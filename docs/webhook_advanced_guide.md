# 🔔 Advanced Webhook Integration Guide
### ShopPay · Stripe & PayPal · Payment Status, Amount, Transaction Tracking

| | |
|---|---|
| **Document version** | 1.0 |
| **Last updated** | 2026-05-31 |
| **Prerequisites** | [`sandbox_setup_guide.md`](./sandbox_setup_guide.md) (Phases 1–4 complete) |
| **Audience** | Backend engineers, Payments team, SRE on-call |
| **Estimated reading time** | 25 minutes |
| **Focus** | Reliable capture of payment status, amount, and related transaction metadata |

---

## 📑 Table of Contents

- [Phase 0 — Why Webhooks Matter](#phase-0--why-webhooks-matter)
- [Phase 1 — Architectural Principles](#phase-1--architectural-principles)
- [Phase 2 — Stripe Webhook Reference](#phase-2--stripe-webhook-reference)
- [Phase 3 — PayPal Webhook Reference](#phase-3--paypal-webhook-reference)
- [Phase 4 — Event Subscription Recommendations](#phase-4--event-subscription-recommendations)
- [Phase 5 — Signature Verification](#phase-5--signature-verification)
- [Phase 6 — Idempotency & Replay Protection](#phase-6--idempotency--replay-protection)
- [Phase 7 — Database Schema for Transaction Tracking](#phase-7--database-schema-for-transaction-tracking)
- [Phase 8 — Retry & Failure Handling](#phase-8--retry--failure-handling)
- [Phase 9 — Implementation Patterns](#phase-9--implementation-patterns)
- [Phase 10 — Testing Strategy](#phase-10--testing-strategy)
- [Appendix A — Quick Reference: Event → Action Map](#appendix-a--quick-reference-event--action-map)
- [Appendix B — Monitoring & Alerting](#appendix-b--monitoring--alerting)

---

## Phase 0 — Why Webhooks Matter

### The fundamental problem

After a customer is redirected back from Stripe Checkout or PayPal approval, the **frontend cannot be trusted** as the source of truth for payment status:

1. The redirect URL is **fired by the browser**, not the gateway — it can be tampered with, blocked, or never reached (closed tab, network loss).
2. **Async payments** (ACH, SEPA, bank transfers) complete hours or days after redirect.
3. **Recurring subscriptions** charge on a schedule with no user interaction.
4. **Disputes, refunds, chargebacks** happen entirely outside the user session.

> [!IMPORTANT]
> **Webhooks are the only reliable mechanism** for synchronizing payment state from the gateway to your database. The redirect is for UX (showing the success page); the webhook is for **business truth**.

### What we capture via webhooks

| Data point | Why it matters |
|------------|---------------|
| **Payment status** | `pending` → `paid` / `failed` / `refunded` — drives fulfillment, dunning, churn |
| **Amount captured** | Reconcile against expected order total (catch tampering) |
| **Currency** | Multi-currency support |
| **Gateway transaction ID** | Customer support lookup, refund reference, dispute defense |
| **Customer identifier** | Link to user/email account |
| **Failure reason code** | Drive retry logic, customer messaging |
| **Subscription period** | Compute MRR, renewal date, churn metrics |
| **Timestamp** | Audit log, financial reconciliation |

---

## Phase 1 — Architectural Principles

> Five non-negotiable rules. Every webhook handler must obey all five.

### Rule 1 — Verify signature before doing anything

Reject any request whose signature cannot be cryptographically verified.
**Stripe:** HMAC-SHA256 with shared secret.
**PayPal:** REST verification call with cert URL chain.

### Rule 2 — Respond `200 OK` within 5 seconds

Both gateways treat any non-2xx, timeout, or slow response as a delivery failure and **will retry**. Use:

```
[Verify signature] → [Enqueue job / minimal DB write] → return 200 OK
                                      ↓
                          [Long-running work happens out-of-band]
```

### Rule 3 — Be idempotent

The same event WILL be delivered more than once. Compute a deterministic key (`event.id` or `event.event_type + resource.id`) and skip if already processed.

### Rule 4 — Trust gateway, not frontend

Amount, currency, status — read **only** from the webhook payload, **never** from query strings or client-side state.

### Rule 5 — Log everything

Persist the full event payload (raw JSON) before processing. If a handler bug corrupts state, you need the original to replay.

---

## Phase 2 — Stripe Webhook Reference

### 2.1 Endpoint URL pattern

```
POST https://your-domain.com/api/stripe/webhook
```

Local dev: forwarded via `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### 2.2 Event delivery format

Every Stripe webhook is a JSON envelope:

```jsonc
{
  "id": "evt_1Abc...",                // ← idempotency key
  "object": "event",
  "type": "checkout.session.completed",
  "api_version": "2024-12-18.acacia",
  "created": 1717200000,              // Unix timestamp
  "livemode": false,                  // ← critical: test vs live
  "data": {
    "object": { /* the resource — Session, PaymentIntent, Invoice, ... */ }
  },
  "request": { "id": "req_..." }
}
```

### 2.3 One-time payment events

#### `checkout.session.completed`

Fired when the buyer finishes the hosted Stripe Checkout flow.

**Key fields:**

| Field | Path | Notes |
|-------|------|-------|
| Session ID | `data.object.id` | `cs_test_...` / `cs_live_...` |
| Payment status | `data.object.payment_status` | `paid` / `unpaid` / `no_payment_required` |
| Mode | `data.object.mode` | `payment` / `subscription` / `setup` |
| Amount total | `data.object.amount_total` | Integer in **smallest currency unit** (cents for USD) |
| Currency | `data.object.currency` | ISO 4217 lowercase (`usd`) |
| Customer email | `data.object.customer_details.email` | Verified during checkout |
| Payment Intent ID | `data.object.payment_intent` | Use to look up Charge for refunds |
| Metadata | `data.object.metadata` | Your `order_id`, etc. |

> [!NOTE]
> For one-time payments (`mode: 'payment'`), `payment_status === 'paid'` is the canonical success signal.
> For subscriptions (`mode: 'subscription'`), wait for `invoice.paid` instead — see below.

#### `payment_intent.succeeded`

Fired by the underlying PaymentIntent when funds settle. Useful for **async payment methods** (ACH, SEPA) where `checkout.session.completed` fires immediately but money arrives later.

| Field | Path |
|-------|------|
| PaymentIntent ID | `data.object.id` (`pi_...`) |
| Amount received | `data.object.amount_received` |
| Charges | `data.object.charges.data[0].id` (`ch_...`) |
| Receipt URL | `data.object.charges.data[0].receipt_url` |

#### `payment_intent.payment_failed`

Critical for **dunning** and **customer messaging**.

| Field | Path |
|-------|------|
| Failure code | `data.object.last_payment_error.code` |
| Decline code | `data.object.last_payment_error.decline_code` |
| Message | `data.object.last_payment_error.message` |

Common decline codes: `insufficient_funds`, `card_declined`, `expired_card`, `incorrect_cvc`, `processing_error`.

#### `checkout.session.expired`

Buyer abandoned Checkout (session timeout after 24h). Use to release inventory holds or send recovery emails.

#### `charge.refunded`

A refund was processed (full or partial).

| Field | Path |
|-------|------|
| Charge ID | `data.object.id` |
| Amount refunded | `data.object.amount_refunded` |
| Refund list | `data.object.refunds.data[]` |
| Original amount | `data.object.amount` |

### 2.4 Subscription events

#### `customer.subscription.created`

A subscription was just created. Status may be `trialing`, `active`, or `incomplete`.

| Field | Path |
|-------|------|
| Subscription ID | `data.object.id` (`sub_...`) |
| Status | `data.object.status` |
| Customer ID | `data.object.customer` |
| Price ID | `data.object.items.data[0].price.id` |
| Current period start | `data.object.current_period_start` |
| Current period end | `data.object.current_period_end` |

#### `customer.subscription.updated`

Fires on **any** change: plan upgrade/downgrade, quantity change, status flip (`active` ↔ `past_due` ↔ `canceled`).

Critical sub-cases:
- Status changed from `active` → `past_due` → start dunning UI
- `cancel_at_period_end` flipped to `true` → flag account for churn outreach

#### `customer.subscription.deleted`

Subscription was canceled and the period ended. Revoke access.

#### `invoice.paid` ⭐ KEY EVENT

> This is the **most important event for recurring revenue tracking**.

Fired every billing cycle when payment succeeds. This is what you record for MRR/ARR.

| Field | Path |
|-------|------|
| Invoice ID | `data.object.id` (`in_...`) |
| Amount paid | `data.object.amount_paid` |
| Subscription | `data.object.subscription` |
| Period start | `data.object.period_start` |
| Period end | `data.object.period_end` |
| Invoice PDF | `data.object.invoice_pdf` |

#### `invoice.payment_failed`

The card on file failed during a recurring charge. Stripe retries automatically per your Smart Retries config; this event fires on each attempt.

| Field | Path |
|-------|------|
| Attempt count | `data.object.attempt_count` |
| Next attempt | `data.object.next_payment_attempt` |
| Failure reason | `data.object.last_finalization_error` |

Use this to send dunning emails (e.g. "Update your card") and ultimately suspend service after N failures.

#### `invoice.upcoming`

Sent ~7 days before charge. Useful for "Your subscription will renew on …" email reminders.

#### `customer.subscription.trial_will_end`

Sent ~3 days before trial ends. Send conversion-priming emails.

### 2.5 Dispute events

#### `charge.dispute.created`

A chargeback was filed. You have **7 days** to submit evidence.

| Field | Path |
|-------|------|
| Dispute ID | `data.object.id` (`dp_...`) |
| Reason | `data.object.reason` |
| Amount | `data.object.amount` |
| Evidence due by | `data.object.evidence_details.due_by` |

---

## Phase 3 — PayPal Webhook Reference

### 3.1 Endpoint URL pattern

```
POST https://your-domain.com/api/paypal/webhook
```

Local dev: tunnel via `ngrok http 3000`, register the ngrok URL in PayPal Dashboard.

### 3.2 Event delivery format

```jsonc
{
  "id": "WH-xxxxxxx-yyyyy",          // ← idempotency key
  "event_version": "1.0",
  "create_time": "2026-05-31T10:00:00Z",
  "resource_type": "capture",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "summary": "Payment completed for $29.99 USD",
  "resource": { /* the resource */ },
  "links": [ /* HATEOAS */ ]
}
```

### 3.3 One-time payment events

#### `CHECKOUT.ORDER.APPROVED`

Buyer approved the order on PayPal but funds are **not yet captured**. Use this to log intent or trigger your capture call (if you didn't do it synchronously).

| Field | Path |
|-------|------|
| Order ID | `resource.id` |
| Status | `resource.status` (`APPROVED`) |
| Amount | `resource.purchase_units[0].amount.value` |
| Currency | `resource.purchase_units[0].amount.currency_code` |
| Payer email | `resource.payer.email_address` |
| Custom ID | `resource.purchase_units[0].custom_id` (your `order_id`) |

#### `PAYMENT.CAPTURE.COMPLETED` ⭐ KEY EVENT

Funds successfully transferred. This is your **"payment confirmed"** signal.

| Field | Path |
|-------|------|
| Capture ID | `resource.id` (use this for refund lookups) |
| Status | `resource.status` (`COMPLETED`) |
| Amount | `resource.amount.value` |
| Currency | `resource.amount.currency_code` |
| Custom ID | `resource.custom_id` (your `order_id`) |
| Invoice ID | `resource.invoice_id` |
| Final capture | `resource.final_capture` (boolean) |
| Seller fee | `resource.seller_receivable_breakdown.paypal_fee.value` |
| Net amount | `resource.seller_receivable_breakdown.net_amount.value` |

#### `PAYMENT.CAPTURE.DENIED`

The capture failed (insufficient funds, fraud rule, etc.). Mark order as failed.

#### `PAYMENT.CAPTURE.PENDING`

Capture awaiting review (e.g., e-check pending). May resolve to `COMPLETED` or `DENIED` later — keep order in `pending` state.

#### `PAYMENT.CAPTURE.REFUNDED`

A refund was issued against this capture.

| Field | Path |
|-------|------|
| Refund ID | `resource.id` |
| Amount refunded | `resource.amount.value` |
| Status | `resource.status` |
| Linked capture | `resource.links[].href` (find `up` rel) |

#### `PAYMENT.CAPTURE.REVERSED`

The capture was reversed (rare — usually after a chargeback or PayPal-initiated reversal).

### 3.4 Subscription events

#### `BILLING.SUBSCRIPTION.CREATED`

Subscription record created in PayPal but not yet activated.

#### `BILLING.SUBSCRIPTION.ACTIVATED` ⭐ KEY EVENT

User completed approval and the subscription is now live.

| Field | Path |
|-------|------|
| Subscription ID | `resource.id` (`I-...`) |
| Plan ID | `resource.plan_id` |
| Status | `resource.status` (`ACTIVE`) |
| Subscriber email | `resource.subscriber.email_address` |
| Subscriber payer ID | `resource.subscriber.payer_id` |
| Start time | `resource.start_time` |
| Next billing time | `resource.billing_info.next_billing_time` |
| Last payment amount | `resource.billing_info.last_payment.amount.value` |

#### `BILLING.SUBSCRIPTION.UPDATED`

Plan, quantity, or shipping address change.

#### `BILLING.SUBSCRIPTION.CANCELLED`

Customer canceled. Service should continue until period end (PayPal tracks this).

#### `BILLING.SUBSCRIPTION.SUSPENDED`

PayPal suspended due to payment failure or merchant action.

#### `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

A recurring payment couldn't be charged. Triggers dunning.

| Field | Path |
|-------|------|
| Subscription ID | `resource.id` |
| Failed amount | `resource.billing_info.last_failed_payment.amount.value` |
| Reason | `resource.billing_info.last_failed_payment.reason_code` |
| Next attempt | `resource.billing_info.last_failed_payment.next_payment_retry_time` |

#### `BILLING.SUBSCRIPTION.EXPIRED`

End of term reached without renewal (rare — most subs auto-renew).

#### `PAYMENT.SALE.COMPLETED`

Recurring payment for a subscription captured successfully. This is the per-cycle revenue event.

| Field | Path |
|-------|------|
| Sale ID | `resource.id` |
| Amount gross | `resource.amount.total` |
| Billing agreement ID | `resource.billing_agreement_id` (links back to subscription) |
| Transaction fee | `resource.transaction_fee.value` |

### 3.5 Dispute events

#### `CUSTOMER.DISPUTE.CREATED`

| Field | Path |
|-------|------|
| Dispute ID | `resource.dispute_id` |
| Reason | `resource.reason` |
| Status | `resource.status` |
| Amount | `resource.dispute_amount.value` |
| Response due date | `resource.seller_response_due_date` |

---

## Phase 4 — Event Subscription Recommendations

Pick the **minimum viable set** based on what you actually need. Subscribing to events you don't handle wastes processing capacity.

### 4.1 Stripe — Recommended subscriptions

#### Tier 1 (Required for any payment integration)

```
checkout.session.completed
checkout.session.expired
payment_intent.succeeded
payment_intent.payment_failed
charge.refunded
```

#### Tier 2 (Required if you have subscriptions)

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

#### Tier 3 (Recommended for production)

```
invoice.upcoming
customer.subscription.trial_will_end
charge.dispute.created
charge.dispute.closed
```

#### Tier 4 (Optional — async/specialty)

```
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
invoice.payment_action_required
```

### 4.2 PayPal — Recommended subscriptions

#### Tier 1 (Required)

```
CHECKOUT.ORDER.APPROVED
PAYMENT.CAPTURE.COMPLETED
PAYMENT.CAPTURE.DENIED
PAYMENT.CAPTURE.REFUNDED
```

#### Tier 2 (Subscriptions)

```
BILLING.SUBSCRIPTION.ACTIVATED
BILLING.SUBSCRIPTION.CANCELLED
BILLING.SUBSCRIPTION.SUSPENDED
BILLING.SUBSCRIPTION.PAYMENT.FAILED
PAYMENT.SALE.COMPLETED
```

#### Tier 3 (Production hardening)

```
PAYMENT.CAPTURE.PENDING
PAYMENT.CAPTURE.REVERSED
BILLING.SUBSCRIPTION.UPDATED
BILLING.SUBSCRIPTION.EXPIRED
CUSTOMER.DISPUTE.CREATED
CUSTOMER.DISPUTE.RESOLVED
```

### 4.3 Decision matrix

| Business need | Stripe events | PayPal events |
|--------------|---------------|---------------|
| Confirm payment | `checkout.session.completed` + `payment_intent.succeeded` | `PAYMENT.CAPTURE.COMPLETED` |
| Track recurring revenue | `invoice.paid` | `PAYMENT.SALE.COMPLETED` |
| Handle failed payment | `payment_intent.payment_failed` + `invoice.payment_failed` | `BILLING.SUBSCRIPTION.PAYMENT.FAILED` |
| Process refunds | `charge.refunded` | `PAYMENT.CAPTURE.REFUNDED` |
| Detect cancellations | `customer.subscription.deleted` | `BILLING.SUBSCRIPTION.CANCELLED` |
| Defend chargebacks | `charge.dispute.created` | `CUSTOMER.DISPUTE.CREATED` |
| Compute MRR/ARR | `invoice.paid` (sum `amount_paid`) | `PAYMENT.SALE.COMPLETED` (sum `amount.total`) |
| Send renewal reminders | `invoice.upcoming` | (poll subscription `next_billing_time`) |

---

## Phase 5 — Signature Verification

### 5.1 Stripe — HMAC-SHA256

Stripe sends a `Stripe-Signature` header containing a timestamp and signature. The SDK does the verification:

```typescript
// server/api/stripe/webhook.post.ts
const rawBody = await readRawBody(event)
const signature = getHeader(event, 'stripe-signature')

const stripeEvent = stripe.webhooks.constructEvent(
  rawBody,                            // RAW body — must not be parsed!
  signature,
  config.stripeWebhookSecret,         // whsec_XXXX from Stripe Dashboard
)
```

> [!CAUTION]
> **Critical:** use `readRawBody()` not `readBody()`. JSON parsing changes byte ordering and breaks the HMAC check.

**Failure modes:**

| Error | Meaning | Action |
|-------|---------|--------|
| `Webhook signature verification failed` | Wrong secret or body parsed | Check `STRIPE_WEBHOOK_SECRET` matches the endpoint |
| `Webhook payload must be in JSON format` | Body was empty | Check middleware order |
| `Timestamp outside the tolerance zone` | Clock drift > 5 min | Sync server time (NTP) |

### 5.2 PayPal — REST Verification API

PayPal verification requires an additional API call to PayPal:

```typescript
// server/api/paypal/webhook.post.ts
const verificationResult = await paypalRequest<any>(
  '/v1/notifications/verify-webhook-signature',
  'POST',
  {
    auth_algo: getHeader(event, 'paypal-auth-algo'),
    cert_url: getHeader(event, 'paypal-cert-url'),
    transmission_id: getHeader(event, 'paypal-transmission-id'),
    transmission_sig: getHeader(event, 'paypal-transmission-sig'),
    transmission_time: getHeader(event, 'paypal-transmission-time'),
    webhook_id: config.paypalWebhookId,
    webhook_event: body,
  },
)

if (verificationResult.verification_status !== 'SUCCESS') {
  throw createError({ statusCode: 400, statusMessage: 'Verification failed' })
}
```

> [!NOTE]
> Each verification consumes an API call. For high-volume endpoints, consider caching by `transmission_id` (the dedupe key).

### 5.3 IP allowlisting (defense in depth)

Both gateways publish their webhook source IP ranges. For production, configure firewall rules:

- Stripe: https://docs.stripe.com/ips#webhook-notifications
- PayPal: https://www.paypal.com/us/cshelp/article/what-are-paypal-ip-addresses-help404

---

## Phase 6 — Idempotency & Replay Protection

### 6.1 Why duplicates happen

| Cause | Frequency |
|-------|-----------|
| Network retry after timeout | Common |
| Your handler returned 5xx | Common |
| Gateway recovery after their incident | Occasional |
| Manual re-trigger from dashboard | On-demand |

### 6.2 Implementation pattern

Use a dedicated `webhook_events` table as the dedupe layer:

```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway TEXT NOT NULL,              -- 'stripe' | 'paypal'
  event_id TEXT NOT NULL UNIQUE,      -- Stripe evt_xxx or PayPal WH-xxx
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,              -- raw JSON for audit
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'received'  -- received | processed | failed
);
CREATE INDEX idx_webhook_events_lookup ON webhook_events(gateway, event_id);
```

Wrap the handler:

```typescript
async function handleWebhook(gateway: 'stripe' | 'paypal', evt: any) {
  const db = getDb()

  // 1. Insert event row — UNIQUE constraint blocks duplicates
  try {
    db.prepare(`
      INSERT INTO webhook_events (gateway, event_id, event_type, payload)
      VALUES (?, ?, ?, ?)
    `).run(gateway, evt.id, evt.type || evt.event_type, JSON.stringify(evt))
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log(`[Webhook] Duplicate event ${evt.id} — skipping`)
      return { received: true, duplicate: true }
    }
    throw e
  }

  // 2. Dispatch to specific handler
  try {
    await dispatchEvent(gateway, evt)
    db.prepare(`UPDATE webhook_events SET status='processed' WHERE event_id=?`).run(evt.id)
  } catch (e: any) {
    db.prepare(`UPDATE webhook_events SET status='failed' WHERE event_id=?`).run(evt.id)
    throw e
  }

  return { received: true }
}
```

> [!TIP]
> Logging the raw payload (the `payload` column) is invaluable for postmortems. Many production incidents are solved by re-reading the original webhook JSON.

---

## Phase 7 — Database Schema for Transaction Tracking

Beyond the existing `orders` and `subscriptions` tables, add these for full transaction history.

### 7.1 `payment_transactions` (every monetary event)

```sql
CREATE TABLE payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Linkage
  order_id INTEGER REFERENCES orders(id),
  subscription_id INTEGER REFERENCES subscriptions(id),

  -- Gateway identifiers
  gateway TEXT NOT NULL,                  -- 'stripe' | 'paypal'
  gateway_transaction_id TEXT NOT NULL,   -- Stripe ch_/pi_/in_ or PayPal capture/sale id
  gateway_event_id TEXT NOT NULL,         -- evt_/WH- for traceability

  -- Money
  type TEXT NOT NULL,                     -- 'payment' | 'refund' | 'chargeback' | 'fee'
  amount INTEGER NOT NULL,                -- in smallest currency unit (cents)
  currency TEXT NOT NULL DEFAULT 'USD',
  fee_amount INTEGER DEFAULT 0,           -- gateway fee
  net_amount INTEGER DEFAULT 0,           -- amount - fee

  -- Status
  status TEXT NOT NULL,                   -- 'succeeded' | 'pending' | 'failed' | 'reversed'
  failure_code TEXT,
  failure_message TEXT,

  -- Audit
  occurred_at DATETIME NOT NULL,          -- gateway-reported time
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_event TEXT                          -- full webhook payload for audit
);

CREATE INDEX idx_pt_order ON payment_transactions(order_id);
CREATE INDEX idx_pt_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_pt_gateway_tx ON payment_transactions(gateway, gateway_transaction_id);
CREATE INDEX idx_pt_occurred ON payment_transactions(occurred_at);
```

### 7.2 Why this schema

- **One source of truth for money.** All revenue, refunds, fees pass through this table.
- **Reconciliation-ready.** MRR query becomes `SUM(amount) WHERE type='payment' AND status='succeeded' AND date_range`.
- **Audit trail.** `raw_event` preserves original payload even if you change processing logic later.
- **Refund tracing.** Find original payment by `gateway_transaction_id` of the capture.

### 7.3 Event → row mapping

| Event | Row written |
|-------|-------------|
| Stripe `checkout.session.completed` (mode: payment) | `type='payment', status='succeeded'` |
| Stripe `payment_intent.payment_failed` | `type='payment', status='failed', failure_code=...` |
| Stripe `charge.refunded` | `type='refund', status='succeeded'` |
| Stripe `invoice.paid` (subscription) | `type='payment', status='succeeded', subscription_id=...` |
| Stripe `invoice.payment_failed` | `type='payment', status='failed', subscription_id=...` |
| PayPal `PAYMENT.CAPTURE.COMPLETED` | `type='payment', status='succeeded'` |
| PayPal `PAYMENT.CAPTURE.DENIED` | `type='payment', status='failed'` |
| PayPal `PAYMENT.CAPTURE.REFUNDED` | `type='refund', status='succeeded'` |
| PayPal `PAYMENT.SALE.COMPLETED` (sub) | `type='payment', status='succeeded', subscription_id=...` |
| PayPal `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | `type='payment', status='failed', subscription_id=...` |
| Either `charge.dispute.created` / `CUSTOMER.DISPUTE.CREATED` | `type='chargeback', status='pending'` |

---

## Phase 8 — Retry & Failure Handling

### 8.1 Gateway retry policies

| Gateway | Retry behavior |
|---------|---------------|
| Stripe | Up to 3 days, exponential backoff, ~10 attempts |
| PayPal | Up to 3 days, retry every few hours |

### 8.2 Your handler's contract

Return **2xx within 5 seconds**. Otherwise the gateway treats it as failure and retries.

| Your response | Effect |
|--------------|--------|
| `200 OK` | Event marked delivered |
| `4xx` (except 401/403) | Logged as bad request; **no retry** |
| `5xx` or timeout | Retried per policy |

### 8.3 Pattern: enqueue heavy work

For expensive operations (sending emails, updating CRM, generating PDFs), do not block the webhook response:

```typescript
export default defineEventHandler(async (event) => {
  // 1. Verify signature
  const stripeEvent = verifySignature(event)

  // 2. Record event + minimal status update (< 100ms)
  await db.transaction(() => {
    insertWebhookEvent(stripeEvent)
    updateOrderStatus(stripeEvent)
  })()

  // 3. Enqueue downstream work
  await queue.enqueue('send-receipt-email', { eventId: stripeEvent.id })
  await queue.enqueue('update-analytics', { eventId: stripeEvent.id })

  // 4. Return immediately
  return { received: true }
})
```

For ShopPay demo (no queue infrastructure), keep handlers fast by avoiding network calls inside them.

### 8.4 Handling failures gracefully

If processing fails after the event was recorded:

1. Mark `webhook_events.status = 'failed'`
2. Log full payload + stack trace
3. Build a manual replay tool: `GET /admin/webhooks/replay/:event_id` that re-runs dispatch

> [!IMPORTANT]
> Never `throw` to force a retry. Stripe/PayPal retries are blunt — they'll re-deliver the **same** event repeatedly. Instead, log and triage.

---

## Phase 9 — Implementation Patterns

### 9.1 Dispatcher structure

```typescript
// server/utils/webhook-dispatcher.ts

type Handler = (event: any) => Promise<void>

const stripeHandlers: Record<string, Handler> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'payment_intent.succeeded': handlePaymentSucceeded,
  'payment_intent.payment_failed': handlePaymentFailed,
  'charge.refunded': handleChargeRefunded,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'charge.dispute.created': handleDisputeCreated,
}

export async function dispatchStripe(event: any) {
  const handler = stripeHandlers[event.type]
  if (!handler) {
    console.log(`[Stripe] Unhandled event: ${event.type}`)
    return
  }
  await handler(event)
}
```

### 9.2 Example: handling `invoice.paid` for MRR tracking

```typescript
async function handleInvoicePaid(event: any) {
  const invoice = event.data.object
  const db = getDb()

  // Find subscription by Stripe sub id
  const sub = db.prepare(
    `SELECT id, plan_id FROM subscriptions WHERE subscription_id = ? AND payment_gateway = 'stripe'`
  ).get(invoice.subscription) as { id: number, plan_id: number } | undefined

  if (!sub) {
    console.warn(`[Stripe] invoice.paid: no matching subscription for ${invoice.subscription}`)
    return
  }

  // Record the transaction
  db.prepare(`
    INSERT INTO payment_transactions (
      subscription_id, gateway, gateway_transaction_id, gateway_event_id,
      type, amount, currency, status, occurred_at, raw_event
    ) VALUES (?, 'stripe', ?, ?, 'payment', ?, ?, 'succeeded', ?, ?)
  `).run(
    sub.id,
    invoice.id,
    event.id,
    invoice.amount_paid,
    invoice.currency.toUpperCase(),
    new Date(invoice.created * 1000).toISOString(),
    JSON.stringify(event),
  )

  // Update subscription period
  db.prepare(`
    UPDATE subscriptions
    SET current_period_start = ?, current_period_end = ?, status = 'active'
    WHERE id = ?
  `).run(
    new Date(invoice.period_start * 1000).toISOString(),
    new Date(invoice.period_end * 1000).toISOString(),
    sub.id,
  )
}
```

### 9.3 Example: handling refunds

```typescript
async function handleChargeRefunded(event: any) {
  const charge = event.data.object
  const db = getDb()

  // Find original payment transaction by charge.payment_intent
  const original = db.prepare(
    `SELECT order_id FROM payment_transactions
     WHERE gateway = 'stripe' AND gateway_transaction_id = ? AND type = 'payment'`
  ).get(charge.payment_intent) as { order_id: number } | undefined

  if (!original) {
    console.warn(`[Stripe] charge.refunded: original payment not found for ${charge.payment_intent}`)
    return
  }

  // Record refund row for each refund (Stripe lists all refunds in charge.refunds.data)
  const insertTx = db.prepare(`
    INSERT INTO payment_transactions (
      order_id, gateway, gateway_transaction_id, gateway_event_id,
      type, amount, currency, status, occurred_at, raw_event
    ) VALUES (?, 'stripe', ?, ?, 'refund', ?, ?, 'succeeded', ?, ?)
  `)

  for (const refund of charge.refunds.data) {
    try {
      insertTx.run(
        original.order_id,
        refund.id,
        event.id,
        refund.amount,
        refund.currency.toUpperCase(),
        new Date(refund.created * 1000).toISOString(),
        JSON.stringify(refund),
      )
    } catch (e: any) {
      if (e.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw e
      // already recorded, skip
    }
  }

  // Update order status — partial vs full refund
  const fullyRefunded = charge.amount_refunded >= charge.amount
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`)
    .run(fullyRefunded ? 'refunded' : 'partially_refunded', original.order_id)
}
```

### 9.4 PayPal equivalent: `PAYMENT.CAPTURE.COMPLETED`

```typescript
async function handlePayPalCaptureCompleted(event: any) {
  const capture = event.resource
  const orderId = Number(capture.custom_id)
  if (!orderId) return

  const db = getDb()

  db.prepare(`
    INSERT INTO payment_transactions (
      order_id, gateway, gateway_transaction_id, gateway_event_id,
      type, amount, currency, fee_amount, net_amount,
      status, occurred_at, raw_event
    ) VALUES (?, 'paypal', ?, ?, 'payment', ?, ?, ?, ?, 'succeeded', ?, ?)
  `).run(
    orderId,
    capture.id,
    event.id,
    Math.round(Number(capture.amount.value) * 100),                       // dollars → cents
    capture.amount.currency_code,
    Math.round(Number(capture.seller_receivable_breakdown?.paypal_fee?.value || 0) * 100),
    Math.round(Number(capture.seller_receivable_breakdown?.net_amount?.value || 0) * 100),
    capture.create_time,
    JSON.stringify(event),
  )

  db.prepare(`UPDATE orders SET status = 'paid', payment_id = ? WHERE id = ?`)
    .run(capture.id, orderId)
}
```

---

## Phase 10 — Testing Strategy

### 10.1 Stripe — Local event triggering

The Stripe CLI can synthesize realistic events:

```bash
# Trigger any event by name
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

Triggered events use realistic data with `livemode: false`.

To trigger a refund against a specific real charge:

```bash
stripe refunds create --charge=ch_XXXX
```

### 10.2 PayPal — Local event triggering

PayPal does not offer a `stripe trigger` equivalent. Options:

1. **Sandbox Simulator** in Developer Dashboard → **Mock webhook events**
   - Choose your app → Webhooks → Click bell icon → "Simulate"
   - Pick event type, customize payload, send to your URL

2. **Manual flow:** Actually run an end-to-end checkout in sandbox; PayPal sends real webhooks.

### 10.3 Integration test checklist

For each event you handle, verify:

- [ ] Signature verification succeeds with real header
- [ ] Signature verification fails with tampered body
- [ ] Duplicate delivery is detected (replay same event twice)
- [ ] Handler is fast (< 500ms p99)
- [ ] DB rows written correctly (assert via SQL)
- [ ] Idempotency table prevents double-write
- [ ] Failure path (DB unavailable) returns 5xx for retry

### 10.4 Production smoke test

After deploying:

1. Create a real test transaction in sandbox
2. Confirm webhook arrives in your logs within 5 seconds
3. Check `payment_transactions` row exists with correct amount
4. Verify status update on `orders` / `subscriptions`
5. Trigger refund → verify second row + status change

---

## Appendix A — Quick Reference: Event → Action Map

### Stripe

| Event | Updates `orders` | Updates `subscriptions` | Writes `payment_transactions` | Side effect |
|-------|:----------------:|:----------------------:|:----------------------------:|-------------|
| `checkout.session.completed` (payment) | ✅ status='paid' | — | ✅ type='payment' | Send receipt |
| `checkout.session.expired` | ✅ status='expired' | — | — | Release inventory |
| `payment_intent.succeeded` | — | — | ✅ type='payment' | — |
| `payment_intent.payment_failed` | ✅ status='failed' | — | ✅ type='payment' status='failed' | Notify customer |
| `charge.refunded` | ✅ status='refunded' | — | ✅ type='refund' | Update accounting |
| `customer.subscription.created` | — | ✅ insert | — | Provision access |
| `customer.subscription.updated` | — | ✅ update status/period | — | (depends) |
| `customer.subscription.deleted` | — | ✅ status='canceled' | — | Revoke access |
| `invoice.paid` | — | ✅ extend period | ✅ type='payment' (MRR) | Send receipt |
| `invoice.payment_failed` | — | ✅ status='past_due' | ✅ type='payment' status='failed' | Dunning email |
| `charge.dispute.created` | ✅ status='disputed' | — | ✅ type='chargeback' | Alert ops |

### PayPal

| Event | Updates `orders` | Updates `subscriptions` | Writes `payment_transactions` | Side effect |
|-------|:----------------:|:----------------------:|:----------------------------:|-------------|
| `CHECKOUT.ORDER.APPROVED` | ✅ status='approved' | — | — | Trigger capture |
| `PAYMENT.CAPTURE.COMPLETED` | ✅ status='paid' | — | ✅ type='payment' | Send receipt |
| `PAYMENT.CAPTURE.DENIED` | ✅ status='failed' | — | ✅ type='payment' status='failed' | Notify customer |
| `PAYMENT.CAPTURE.PENDING` | ✅ status='pending' | — | ✅ type='payment' status='pending' | Wait |
| `PAYMENT.CAPTURE.REFUNDED` | ✅ status='refunded' | — | ✅ type='refund' | Update accounting |
| `PAYMENT.CAPTURE.REVERSED` | ✅ status='reversed' | — | ✅ type='chargeback' | Alert ops |
| `BILLING.SUBSCRIPTION.ACTIVATED` | — | ✅ insert/activate | — | Provision access |
| `BILLING.SUBSCRIPTION.UPDATED` | — | ✅ update | — | — |
| `BILLING.SUBSCRIPTION.CANCELLED` | — | ✅ status='canceled' | — | Schedule revoke |
| `BILLING.SUBSCRIPTION.SUSPENDED` | — | ✅ status='suspended' | — | Restrict access |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | — | ✅ status='past_due' | ✅ status='failed' | Dunning |
| `PAYMENT.SALE.COMPLETED` (recurring) | — | ✅ extend period | ✅ type='payment' (MRR) | Send receipt |
| `CUSTOMER.DISPUTE.CREATED` | ✅ status='disputed' | — | ✅ type='chargeback' | Alert ops |

---

## Appendix B — Monitoring & Alerting

### B.1 Metrics to emit

| Metric | Type | Purpose |
|--------|------|---------|
| `webhook.received.count` | counter, labels: gateway, event_type | Volume tracking |
| `webhook.duration.ms` | histogram | p50/p95/p99 handler latency |
| `webhook.signature_failed.count` | counter | Security signal (potential attack) |
| `webhook.duplicate.count` | counter | Idempotency working as expected |
| `webhook.processing_failed.count` | counter | Alert if non-zero |
| `payment.amount.sum` | counter, label: gateway, currency | Real-time revenue dashboard |
| `payment.failed.count` | counter, label: failure_code | Watch for spike in `card_declined` etc. |

### B.2 Alerts to configure

| Alert | Condition | Severity |
|-------|-----------|----------|
| Signature failures spiking | `> 5/min` for 5 min | P1 — possible attack |
| Webhook p99 latency | `> 3s` for 10 min | P2 — gateway will retry soon |
| Processing failure rate | `> 1%` over 1h | P2 — bug investigation |
| Zero webhooks received | `count == 0` for 1h during business hours | P1 — endpoint may be down |
| Dispute event arrived | `charge.dispute.created` or `CUSTOMER.DISPUTE.CREATED` | P2 — ops handover within 48h |
| Payment failed > N times | per subscription, configurable | P3 — auto-suspend trigger |

### B.3 Dashboards

Suggested panels (Grafana/Datadog):

1. **Webhook throughput** — events/min, stacked by gateway and event type
2. **Latency heatmap** — handler duration distribution
3. **Revenue stream** — running sum of `payment.amount` by gateway
4. **Failed payment funnel** — breakdown by failure_code
5. **Subscription health** — `active` vs `past_due` vs `canceled` counts over time

---

## 📞 Support & References

| Topic | Resource |
|-------|----------|
| Stripe events catalog | https://docs.stripe.com/api/events/types |
| Stripe webhook best practices | https://docs.stripe.com/webhooks/best-practices |
| PayPal events catalog | https://developer.paypal.com/api/rest/webhooks/event-names/ |
| PayPal webhook simulator | https://developer.paypal.com/dashboard/webhooksSimulator |
| Internal questions | `#shoppay-platform` on Slack |

---

**End of guide.** Use alongside [`sandbox_setup_guide.md`](./sandbox_setup_guide.md) for full integration setup.
