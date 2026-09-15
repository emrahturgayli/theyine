-- BlokMate — Stripe reconciliation sprint: create-session did not persist
-- the Checkout Session id anywhere, so a webhook delivery that never
-- arrives (network blip, misconfigured STRIPE_WEBHOOK_SECRET, Stripe
-- retries exhausted) left the invoice "unpaid" forever with no way to
-- look the payment back up. Storing the session id lets a daily
-- reconciliation job (app/api/payments/reconcile) ask Stripe directly
-- "did this session actually get paid?" for every invoice still open.

begin;

alter table invoices add column if not exists stripe_session_id text;

-- One Checkout Session should only ever map to one invoice — guards the
-- reconciliation job against processing the same session twice if it's
-- ever re-run concurrently.
create unique index if not exists invoices_stripe_session_id_key
  on invoices (stripe_session_id)
  where stripe_session_id is not null;

commit;
