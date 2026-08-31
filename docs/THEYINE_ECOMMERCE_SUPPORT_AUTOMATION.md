# THEYINE E-Commerce Triage & Automated Order-Support Workflow

**Status:** Draft blueprint · **Owner:** THEYINE Infra · **Stack:** Next.js/TypeScript (Landing, theyine-enterprise-qr), n8n (orchestration), Shopify Admin API, Supabase (Postgres), Claude API (Anthropic)

This document specifies the AI-driven support automation that triages inbound customer email, verifies order/fulfillment truth against Shopify and Supabase, and drafts (never auto-sends) contextual replies as Gmail drafts for human review. It is designed to sit alongside the existing `Landing` and `theyine-enterprise-qr` (QR / try-on) modules without modifying them — it's a new service, `support-automation`, that talks to the same Supabase project.

---

## 1. System Architecture & Data Flow

```
┌──────────────┐    ┌────────────────┐    ┌────────────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ Gmail Trigger │ →  │ LLM Intent      │ →  │ Shopify / Supabase Order    │ →  │ Smart Contextual    │ →  │ Gmail Draft Create  │
│ (poll/push)   │    │ Triage (Claude) │    │ Status Verification API     │    │ Reply Generation     │    │ (human-in-the-loop) │
└──────────────┘    └────────────────┘    └────────────────────────────┘    └────────────────────┘    └────────────────────┘
```

1. **Gmail Trigger** — n8n Gmail node (or Gmail Pub/Sub push webhook) polls the support inbox, normalizes each message (sender, subject, body, thread ID, message ID).
2. **LLM Intent Triage** — Claude classifies intent (`order_status`, `shipping_delay`, `return_refund`, `product_question`, `complaint`, `spam/automated`, `other`), extracts a probable **order number / email / tracking number**, and decides `needs_reply`. Emails with no extractable order reference for order-related intents are flagged `needs_order_lookup: false` and routed to a generic-reply path.
3. **Shopify/Supabase Order Verification** — if an order reference was extracted, the workflow calls Shopify Admin API for order + fulfillment + tracking, and Supabase for internal fields (support ticket history, VIP/B2B tier, custom SLAs) that Shopify doesn't hold. This is the **single source of truth** injected into the prompt — the LLM is never allowed to state a delivery date it did not receive from this step.
4. **Smart Contextual Reply Generation** — Claude drafts a reply using *only* the verified order-data JSON plus the original email. Strict system-prompt guardrails (Section 3) forbid invented dates, invented tracking numbers, or promises outside policy.
5. **Gmail Draft Creation** — the draft is written via `gmail.users.drafts.create` (never `send`) into the original thread, so a human support agent reviews and sends it.

### Data flow contract between steps

| From → To | Payload |
|---|---|
| Gmail Trigger → LLM Triage | `InboundEmail` (see Section 4) |
| LLM Triage → Order Verification | `{ intent, order_reference, customer_email, needs_order_lookup }` |
| Order Verification → Reply Generation | `OrderContext` (Shopify + Supabase merged, see Section 2) |
| Reply Generation → Draft Creation | `DraftReply { subject, body, requires_human_review_reason }` |

---

## 2. Shopify & Supabase Integration Logic

### 2.1 Why both

- **Shopify Admin API** is the source of truth for order line items, payment/fulfillment status, and Shopify-generated tracking numbers.
- **Supabase** (THEYINE's own Postgres) holds data Shopify doesn't model well for us: linked support tickets, B2B account tier/SLA, prior automation actions on this order (to avoid double-replying), and cached webhook-driven fulfillment events for low-latency lookups without hammering Shopify's rate limits.

### 2.2 Lookup sequence

1. Resolve the customer's order: try, in order, (a) an explicit order number in the email (`#1234` / `THY-1234`), (b) the sender's email address matched against Shopify customer → most recent order, (c) a tracking number regex match.
2. Query **Supabase first** (`orders_cache` table, populated by Shopify webhooks — `orders/updated`, `fulfillments/create`, `fulfillments/update`) for a fast, already-normalized record.
3. If the cached record is stale (`updated_at` older than 15 minutes) or missing, call **Shopify Admin API** (`GET /admin/api/2025-01/orders/{id}.json` + `GET /admin/api/2025-01/orders/{id}/fulfillments.json`) directly, and upsert the result back into `orders_cache`.
4. Merge with Supabase-only context (`support_accounts` table: B2B tier, SLA hours, prior tickets on this order) into a single `OrderContext` object.
5. If a tracking number is present, optionally enrich with carrier status via the fulfillment's `tracking_url` (do not scrape carrier sites directly from this workflow — treat carrier ETA as Shopify/Supabase-reported only, not live-fetched, to avoid extra hallucination surface).

### 2.3 Supabase schema (`orders_cache`, `support_accounts`)

```sql
create table public.orders_cache (
  id                 bigint primary key,           -- Shopify order id
  order_number       text not null,
  customer_email     text not null,
  financial_status   text not null,                -- paid, refunded, partially_refunded, ...
  fulfillment_status text,                          -- fulfilled, partial, unfulfilled, null
  line_items         jsonb not null default '[]',
  tracking_numbers   jsonb not null default '[]',   -- [{number, carrier, url}]
  estimated_delivery date,                          -- ONLY set from a Shopify/carrier-reported field, never inferred
  shipped_at         timestamptz,
  created_at         timestamptz not null,
  updated_at         timestamptz not null default now()
);
create index on public.orders_cache (customer_email);
create index on public.orders_cache (order_number);

create table public.support_accounts (
  customer_email  text primary key,
  account_tier    text not null default 'standard', -- standard, b2b_silver, b2b_gold, enterprise
  sla_hours       int  not null default 48,
  open_tickets    jsonb not null default '[]',
  notes           text
);

create table public.automation_actions (
  id           bigserial primary key,
  order_id     bigint references public.orders_cache(id),
  thread_id    text not null,
  action       text not null,   -- 'draft_created', 'flagged_for_review', 'skipped_spam'
  created_at   timestamptz not null default now()
);
```

`automation_actions` is the idempotency guard: before creating a new draft, check whether a `draft_created` row already exists for this `thread_id` within the last N hours, to prevent duplicate drafts on repeated polling.

### 2.4 Shopify Admin API calls used

| Purpose | Endpoint |
|---|---|
| Order lookup by number | `GET /admin/api/2025-01/orders.json?name={order_number}` |
| Order lookup by customer | `GET /admin/api/2025-01/customers/search.json?query=email:{email}` → `GET /admin/api/2025-01/orders.json?customer_id={id}` |
| Fulfillments | `GET /admin/api/2025-01/orders/{id}/fulfillments.json` |
| Webhook subscriptions (setup, one-time) | `POST /admin/api/2025-01/webhooks.json` for `orders/updated`, `fulfillments/create`, `fulfillments/update` → point at the `support-automation` webhook receiver, which upserts into `orders_cache` |

Use a **read-only, scoped** Shopify custom app token (`read_orders`, `read_fulfillments`, `read_customers` only) — this automation never writes to Shopify.

---

## 3. AI Prompt Engineering & Guardrails

Two Claude calls, each with its own strict system prompt and structured output schema (`output_config.format`, see Section 4) so responses are always machine-parseable and never free-form prose that could omit required fields.

### 3.1 Triage system prompt

```
You are THEYINE's e-commerce support triage classifier. You read one inbound
customer email and output structured classification only — you do not draft
a reply here.

Classify the email's intent as exactly one of: order_status, shipping_delay,
return_refund, product_question, complaint, spam_or_automated, other.

Extract an order_reference if one is present in the text (order number,
tracking number, or nothing). Do not guess an order number that is not
literally present in the email.

Set needs_reply to false for: marketing/promotional email, automated
system notifications, out-of-office replies, and spam. Set it to true for
any genuine customer inquiry, including short or curt ones.

Output only the structured fields defined by the schema. Do not include
delivery estimates, order details, or any claim about order status in this
step — you have not been given order data yet.
```

### 3.2 Reply-generation system prompt (the hallucination-guardrail prompt)

```
You are THEYINE's B2B enterprise support reply drafter. THEYINE is a
plug-and-play AI infrastructure company for e-commerce and B2B SaaS
(theyine.com). Your tone is professional, precise, and warm — never
casual, never over-apologetic, never salesy.

You will receive:
  1. The customer's original email.
  2. An `order_context` JSON object containing verified data pulled from
     Shopify and our internal database moments ago.

HARD RULES — violating any of these is a critical failure:
- You may state a delivery date, ship date, or "in transit" status ONLY if
  it is present verbatim in `order_context`. If `order_context.estimated_delivery`
  is null, you must NOT invent, estimate, or imply a delivery date — instead,
  say the estimate isn't available yet and that a team member will confirm it.
- You may reference a tracking number or carrier ONLY if present in
  `order_context.tracking_numbers`.
- If `order_context` is null or the order could not be found, do not
  fabricate order details of any kind. Draft a reply that asks the customer
  to confirm their order number, and set requires_human_review_reason.
- Never promise a refund, discount, replacement, or policy exception. If the
  customer requests one, acknowledge the request and note it has been
  escalated to the support team — set requires_human_review_reason.
- Never disclose internal fields (account_tier, sla_hours, internal notes,
  ticket IDs) to the customer.
- If the customer is angry or the sentiment is negative, lead with empathy
  in one sentence, then facts — do not over-apologize repeatedly.
- Match the customer's language if they wrote in a language other than
  English; otherwise write in English.

Write a complete, ready-to-send draft. A human will review it before
sending — your job is accuracy and tone, not caution to the point of being
useless.
```

### 3.3 Guardrail enforcement outside the prompt (defense in depth)

Prompting alone is not sufficient — enforce these in code after generation, before the draft is written:

1. **Date cross-check:** regex-scan the drafted `body` for date-like tokens; if any date appears in the body that is not a substring of `order_context.estimated_delivery` or `order_context.shipped_at`, reject the draft and regenerate once with an explicit correction message appended to the prompt, or fall back to `requires_human_review_reason = "unverified date in draft"` and hold for manual review rather than auto-drafting.
2. **Tracking-number cross-check:** same approach — any tracking-number-shaped token in the body must appear in `order_context.tracking_numbers[].number`.
3. **No-order-context path:** if `order_context` is `null`, force `requires_human_review_reason` to be non-null regardless of what the model returns.
4. **Structured output only:** use `output_config.format` (JSON Schema, Section 4) for both calls so there is no free-text parsing step that guardrail code could be bypassed by.

---

## 4. Implementation — Schemas & Code

### 4.1 Shared TypeScript types (`support-automation/src/types.ts`)

```typescript
export interface InboundEmail {
  messageId: string;
  threadId: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
}

export type TriageIntent =
  | "order_status"
  | "shipping_delay"
  | "return_refund"
  | "product_question"
  | "complaint"
  | "spam_or_automated"
  | "other";

export interface TriageResult {
  intent: TriageIntent;
  orderReference: string | null;
  needsReply: boolean;
  sentiment: "positive" | "neutral" | "negative" | "urgent_negative";
  summary: string;
}

export interface TrackingInfo {
  number: string;
  carrier: string | null;
  url: string | null;
}

export interface OrderContext {
  orderNumber: string;
  customerEmail: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  lineItems: { title: string; quantity: number }[];
  trackingNumbers: TrackingInfo[];
  estimatedDelivery: string | null; // ISO date, ONLY from Shopify/Supabase — never inferred
  shippedAt: string | null;
}

export interface DraftReply {
  subject: string;
  body: string;
  tone: "formal" | "professional" | "friendly" | "empathetic";
  requiresHumanReviewReason: string | null;
}
```

### 4.2 Structured-output JSON Schemas for Claude

```typescript
// support-automation/src/schemas/triage.schema.ts
export const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "order_status", "shipping_delay", "return_refund",
        "product_question", "complaint", "spam_or_automated", "other",
      ],
    },
    order_reference: { type: ["string", "null"] },
    needs_reply: { type: "boolean" },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "urgent_negative"],
    },
    summary: { type: "string" },
  },
  required: ["intent", "order_reference", "needs_reply", "sentiment", "summary"],
  additionalProperties: false,
} as const;

// support-automation/src/schemas/draft-reply.schema.ts
export const DRAFT_REPLY_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    tone: {
      type: "string",
      enum: ["formal", "professional", "friendly", "empathetic"],
    },
    requires_human_review_reason: { type: ["string", "null"] },
  },
  required: ["subject", "body", "tone", "requires_human_review_reason"],
  additionalProperties: false,
} as const;
```

### 4.3 Claude calls (`support-automation/src/ai.ts`)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TRIAGE_SCHEMA } from "./schemas/triage.schema";
import { DRAFT_REPLY_SCHEMA } from "./schemas/draft-reply.schema";
import type { InboundEmail, TriageResult, OrderContext, DraftReply } from "./types";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const TRIAGE_SYSTEM_PROMPT = `You are THEYINE's e-commerce support triage classifier...`; // full text in Section 3.1
const REPLY_SYSTEM_PROMPT = `You are THEYINE's B2B enterprise support reply drafter...`; // full text in Section 3.2

export async function triageEmail(email: InboundEmail): Promise<TriageResult> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: TRIAGE_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: TRIAGE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `From: ${email.from}\nSubject: ${email.subject}\n\n${email.bodyText}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const parsed = JSON.parse(textBlock!.text);
  return {
    intent: parsed.intent,
    orderReference: parsed.order_reference,
    needsReply: parsed.needs_reply,
    sentiment: parsed.sentiment,
    summary: parsed.summary,
  };
}

export async function draftReply(
  email: InboundEmail,
  orderContext: OrderContext | null,
): Promise<DraftReply> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    system: REPLY_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: DRAFT_REPLY_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          `Customer email:\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.bodyText}\n\n` +
          `order_context: ${orderContext ? JSON.stringify(orderContext) : "null"}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const parsed = JSON.parse(textBlock!.text);

  return enforceGuardrails(parsed, orderContext);
}

// Defense-in-depth guardrail enforcement — see Section 3.3.
function enforceGuardrails(draft: any, orderContext: OrderContext | null): DraftReply {
  const allowedDates = [orderContext?.estimatedDelivery, orderContext?.shippedAt].filter(Boolean) as string[];
  const allowedTracking = (orderContext?.trackingNumbers ?? []).map((t) => t.number);

  const dateLike = /\b\d{4}-\d{2}-\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}\b/gi;
  const trackingLike = /\b[A-Z0-9]{10,30}\b/g;

  const bodyDates = draft.body.match(dateLike) ?? [];
  const unverifiedDate = bodyDates.some(
    (d: string) => !allowedDates.some((allowed) => allowed.includes(d) || d.includes(allowed)),
  );

  const bodyTracking = draft.body.match(trackingLike) ?? [];
  const unverifiedTracking = bodyTracking.some((t: string) => !allowedTracking.includes(t));

  let reviewReason = draft.requires_human_review_reason;
  if (!orderContext) reviewReason = reviewReason ?? "no order context available";
  if (unverifiedDate) reviewReason = "unverified delivery date detected in draft — hold for manual review";
  if (unverifiedTracking) reviewReason = "unverified tracking number detected in draft — hold for manual review";

  return {
    subject: draft.subject,
    body: draft.body,
    tone: draft.tone,
    requiresHumanReviewReason: reviewReason,
  };
}
```

### 4.4 Shopify + Supabase order verification (`support-automation/src/orderLookup.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { OrderContext } from "./types";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!; // e.g. theyine-dev.myshopify.com
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!; // read-only scoped token
const CACHE_STALE_MS = 15 * 60 * 1000;

export async function resolveOrderContext(
  orderReference: string | null,
  customerEmail: string,
): Promise<OrderContext | null> {
  const cached = await lookupSupabaseCache(orderReference, customerEmail);
  if (cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_STALE_MS) {
    return toOrderContext(cached);
  }

  const shopifyOrder = await lookupShopify(orderReference, customerEmail);
  if (!shopifyOrder) return cached ? toOrderContext(cached) : null;

  await upsertCache(shopifyOrder);
  return toOrderContext(shopifyOrder);
}

async function lookupSupabaseCache(orderReference: string | null, customerEmail: string) {
  const query = supabase.from("orders_cache").select("*").limit(1);
  const { data } = orderReference
    ? await query.eq("order_number", orderReference).maybeSingle()
    : await query.eq("customer_email", customerEmail).order("created_at", { ascending: false }).maybeSingle();
  return data;
}

async function lookupShopify(orderReference: string | null, customerEmail: string) {
  const url = orderReference
    ? `https://${SHOPIFY_STORE}/admin/api/2025-01/orders.json?name=${encodeURIComponent(orderReference)}&status=any`
    : `https://${SHOPIFY_STORE}/admin/api/2025-01/customers/search.json?query=email:${encodeURIComponent(customerEmail)}`;

  const res = await fetch(url, { headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN } });
  if (!res.ok) throw new Error(`Shopify lookup failed: ${res.status}`);
  const json = await res.json();
  const order = json.orders?.[0];
  if (!order) return null;

  const fulfillmentsRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-01/orders/${order.id}/fulfillments.json`,
    { headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN } },
  );
  const fulfillments = fulfillmentsRes.ok ? (await fulfillmentsRes.json()).fulfillments : [];

  return { ...order, fulfillments };
}

async function upsertCache(order: any) {
  await supabase.from("orders_cache").upsert({
    id: order.id,
    order_number: order.name,
    customer_email: order.email,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    line_items: order.line_items?.map((li: any) => ({ title: li.title, quantity: li.quantity })) ?? [],
    tracking_numbers:
      order.fulfillments?.flatMap((f: any) =>
        (f.tracking_numbers ?? []).map((num: string, i: number) => ({
          number: num,
          carrier: f.tracking_company ?? null,
          url: f.tracking_urls?.[i] ?? null,
        })),
      ) ?? [],
    // IMPORTANT: only set from a real Shopify-reported field — never computed/inferred here.
    estimated_delivery: order.fulfillments?.[0]?.estimated_delivery_at ?? null,
    shipped_at: order.fulfillments?.[0]?.created_at ?? null,
    created_at: order.created_at,
    updated_at: new Date().toISOString(),
  });
}

function toOrderContext(row: any): OrderContext {
  return {
    orderNumber: row.order_number,
    customerEmail: row.customer_email,
    financialStatus: row.financial_status,
    fulfillmentStatus: row.fulfillment_status,
    lineItems: row.line_items,
    trackingNumbers: row.tracking_numbers,
    estimatedDelivery: row.estimated_delivery,
    shippedAt: row.shipped_at,
  };
}
```

### 4.5 Gmail draft creation (`support-automation/src/gmailDraft.ts`)

```typescript
import { google } from "googleapis";
import type { InboundEmail, DraftReply } from "./types";

const gmail = google.gmail({ version: "v1", auth: getOAuthClient() }); // OAuth2 client with gmail.compose scope only

export async function createDraftReply(email: InboundEmail, draft: DraftReply) {
  const raw = buildRfc2822Reply(email, draft);
  await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        threadId: email.threadId,
        raw: Buffer.from(raw).toString("base64url"),
      },
    },
  });
}

function buildRfc2822Reply(email: InboundEmail, draft: DraftReply): string {
  return [
    `To: ${email.from}`,
    `Subject: ${draft.subject}`,
    `In-Reply-To: ${email.messageId}`,
    `References: ${email.messageId}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    draft.body,
  ].join("\r\n");
}

function getOAuthClient() {
  const { OAuth2 } = google.auth;
  const client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  );
  client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return client;
}
```

**Scope note:** the Gmail OAuth client here uses `gmail.compose` (create drafts) — deliberately **not** `gmail.send`. This is the workflow's own human-in-the-loop guarantee at the permissions layer, independent of any prompt-level instruction not to auto-send.

### 4.6 Orchestrator (`support-automation/src/index.ts`)

```typescript
import { triageEmail, draftReply } from "./ai";
import { resolveOrderContext } from "./orderLookup";
import { createDraftReply } from "./gmailDraft";
import { alreadyDrafted, logAction } from "./idempotency";
import type { InboundEmail } from "./types";

export async function handleInboundEmail(email: InboundEmail) {
  if (await alreadyDrafted(email.threadId)) return;

  const triage = await triageEmail(email);
  if (!triage.needsReply) {
    await logAction(null, email.threadId, "skipped_spam");
    return;
  }

  const orderContext =
    triage.intent === "order_status" || triage.intent === "shipping_delay" || triage.intent === "return_refund"
      ? await resolveOrderContext(triage.orderReference, email.from)
      : null;

  const draft = await draftReply(email, orderContext);
  await createDraftReply(email, draft);
  await logAction(orderContext ? Number((orderContext as any).id) : null, email.threadId, "draft_created");
}
```

### 4.7 Environment variables (`.env.example`)

```bash
# Claude / Anthropic
ANTHROPIC_API_KEY=

# Gmail OAuth2 (gmail.compose scope only — never gmail.send)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=
GMAIL_REFRESH_TOKEN=

# Shopify (read-only custom app token: read_orders, read_fulfillments, read_customers)
SHOPIFY_STORE_DOMAIN=theyine-dev.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=

# Supabase (service role key — server-side only, never exposed to the browser)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 5. Integration Notes (Landing / theyine-enterprise-qr)

- This service is deployed independently (`support-automation/`, own `package.json`) — it does **not** import from `Landing` or `theyine-enterprise-qr`, but shares the **same Supabase project**, so add `orders_cache`, `support_accounts`, and `automation_actions` as new tables alongside whatever schema those apps already use; do not touch existing tables.
- If `theyine-enterprise-qr`'s try-on/QR flow ever needs order status (e.g. a post-purchase QR redirect showing "your order has shipped"), it can read `orders_cache` directly via the Supabase client with an appropriate RLS policy — it does not need to call Shopify itself.
- Secrets (`SHOPIFY_ADMIN_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, Gmail OAuth secrets) belong only in the `support-automation` service's server-side environment — never in `Landing`'s client bundle.

## 6. Open Items / Recommended Next Steps

1. Provision the read-only Shopify custom app + scoped token.
2. Run the SQL in Section 2.3 against the shared Supabase project.
3. Register Shopify webhooks (`orders/updated`, `fulfillments/create`, `fulfillments/update`) pointing at a new `support-automation` webhook receiver route.
4. Wire up Gmail OAuth with `gmail.compose` scope (Google Cloud Console → OAuth consent screen → this is the same project pattern as any other Gmail-integrated app).
5. Decide polling vs. Gmail push (Pub/Sub) for the trigger — push is lower-latency but requires a public webhook endpoint; polling every 1–2 minutes via n8n's Gmail Trigger node is simpler to stand up first.
