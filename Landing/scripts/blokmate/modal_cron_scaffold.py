# BlokMate background jobs — Modal (modal.com) cron scaffold.
#
# NOT deployed by `npm run build`/Vercel — Modal is a separate platform from
# a separate account. Deploy this file yourself once a Modal account and
# `modal token new` are set up locally:
#   pip install modal
#   modal deploy scripts/blokmate/modal_cron_scaffold.py
#
# Env vars needed (set via `modal secret create blokmate-secrets ...` and
# referenced below, NOT hardcoded): NEXT_PUBLIC_SUPABASE_URL,
# SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST/PORT/USER/PASS (or COMPOSIO_API_KEY
# once that integration is un-blocked — see lib/blokmate.ts's TODO).

import os
from datetime import date

import modal

app = modal.App("blokmate-cron")

image = modal.Image.debian_slim().pip_install("supabase", "resend")  # placeholder deps

blokmate_secrets = modal.Secret.from_name("blokmate-secrets")


@app.function(image=image, secrets=[blokmate_secrets], schedule=modal.Cron("0 8 * * *"))
def daily_overdue_reminders():
    """
    Runs every day at 08:00 UTC. Queries invoices with status='overdue' (or
    status='unpaid' AND due_date < today — decide which once the "overdue"
    status transition is actually implemented) and emails each unit's
    resident a reminder.

    TODO:
      - Import and initialize the Supabase client here (same
        NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY as the Next.js
        app, pulled from the Modal secret, never hardcoded).
      - Query: select invoices joined to units/users where status is
        overdue/unpaid and due_date < today.
      - Send one reminder email per resident (batch by unit_id to avoid
        emailing the same person twice for multiple overdue invoices).
      - Plug in the transactional email sender here — reuse the SMTP
        approach from lib/email.ts (or Composio, once its 401 auth issue
        is resolved — see lib/blokmate.ts's TODO comment) rather than a
        third email path.
    """
    print(f"[blokmate-cron] daily_overdue_reminders placeholder run: {date.today().isoformat()}")
    # supabase = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    # overdue = supabase.table("invoices").select("*, units(*, users(*))").eq("status", "overdue").execute()
    # for invoice in overdue.data:
    #     send_reminder_email(invoice)


@app.function(image=image, secrets=[blokmate_secrets], schedule=modal.Cron("0 6 1 * *"))
def monthly_report_generation():
    """
    Runs at 06:00 UTC on the 1st of each month. Generates a per-building
    summary (total collected, total outstanding, open tickets) for the
    prior month.

    TODO:
      - Query invoices/payments/tickets for the previous calendar month,
        grouped by building_id.
      - Produce the report as JSON/HTML first (returned/stored), and only
        convert to PDF once a renderer is chosen — do not add a PDF
        dependency speculatively before the report content itself is
        real. Candidates when that's needed: a headless-Chrome print (this
        repo already has Remotion's Chrome-launch experience from the
        /studio video engine — see src/remotion/pipeline.ts's
        getBrowserExecutable — as reference for what serverless Chrome
        rendering requires) or a dedicated PDF library.
      - Email or store the generated report per building manager.
    """
    print(f"[blokmate-cron] monthly_report_generation placeholder run: {date.today().isoformat()}")
    # buildings = supabase.table("buildings").select("id, name").execute()
    # for building in buildings.data:
    #     report = build_report_for(building["id"])  # TODO
    #     store_or_email_report(building, report)  # TODO
