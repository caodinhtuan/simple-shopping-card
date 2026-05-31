# 📘 Sandbox Integration Setup Guide

### ShopPay Demo · Stripe & PayPal

|                          |                                       |
|--------------------------|---------------------------------------|
| **Document version**     | 1.0                                   |
| **Last updated**         | 2026-05-31                            |
| **Audience**             | Engineering team, QA, Demo presenters |
| **Estimated setup time** | ~45–60 minutes (first time)           |
| **Maintained by**        | ShopPay Platform Team                 |

---

## 📑 Table of Contents

- [Phase 0 — Prerequisites](#phase-0--prerequisites)
- [Phase 1 — Project Local Setup](#phase-1--project-local-setup)
- [Phase 2 — Stripe Sandbox Integration](#phase-2--stripe-sandbox-integration)
- [Phase 3 — PayPal Sandbox Integration](#phase-3--paypal-sandbox-integration)
- [Phase 4 — Environment Configuration](#phase-4--environment-configuration)
- [Phase 5 — End-to-End Verification](#phase-5--end-to-end-verification)
- [Phase 6 — Webhook Setup (Optional)](#phase-6--webhook-setup-optional)
- [Appendix A — Troubleshooting Matrix](#appendix-a--troubleshooting-matrix)
- [Appendix B — Demo Mode Fallback](#appendix-b--demo-mode-fallback)
- [Appendix C — Production Readiness Checklist](#appendix-c--production-readiness-checklist)
- [Appendix D — Code References](#appendix-d--code-references)

---

## Phase 0 — Prerequisites

> **Goal:** Confirm your machine and accounts are ready before starting.

### Software requirements

| Tool                  | Minimum version   | Verification command |
|-----------------------|-------------------|----------------------|
| Node.js               | `≥ 18.0.0`        | `node -v`            |
| npm                   | `≥ 9.0.0`         | `npm -v`             |
| Git                   | any               | `git --version`      |
| curl                  | any (for testing) | `curl --version`     |
| (Optional) Stripe CLI | latest            | `stripe version`     |
| (Optional) ngrok      | latest            | `ngrok version`      |

### Accounts to register (15 minutes)

| Provider         | URL                                   | Notes                                                       |
|------------------|---------------------------------------|-------------------------------------------------------------|
| Stripe           | https://dashboard.stripe.com/register | Free. Test mode does **not** require business verification. |
| PayPal Developer | https://developer.paypal.com/         | Free. Auto-creates sandbox buyer/seller accounts.           |

### Pre-setup checklist

- [ ] Node.js installed and verified
- [ ] Project cloned and dependencies installed (`npm install`)
- [ ] Stripe account created, **Test mode** toggle ON
- [ ] PayPal Developer account created
- [ ] Editor of choice (VS Code recommended)

---

## Phase 1 — Project Local Setup

> **Goal:** Get the demo running locally before connecting payment gateways.
> **Estimated time:** 5 minutes

### Step 1.1 — Install dependencies

```bash
cd simple-shopping-card
npm install
```

**✓ Expected result:** `node_modules/` directory created without errors.

### Step 1.2 — Create `.env` from template

```bash
cp .env.example .env
```

**✓ Expected result:** New `.env` file in project root with placeholder values.

### Step 1.3 — Start dev server

```bash
npm run dev
```

**✓ Expected result:**

- Console shows `➜ Local: http://localhost:3000/`
- Browser opens to home page with hero section
- No red errors in terminal

> [!TIP]
> If port 3000 is in use, Nuxt will pick the next available port (e.g., 3001/3002). Check terminal output for actual
> URL.

### Phase 1 Sign-off ✅

- [ ] App is accessible at `http://localhost:3000`
- [ ] Home page renders correctly
- [ ] Browsing products and adding to cart works
- [ ] Clicking checkout → opens email modal (gateway hasn't been wired yet — demo simulator will be used)

---

## Phase 2 — Stripe Sandbox Integration

> **Goal:** Configure Stripe to handle both one-time and recurring payments.
> **Estimated time:** 15 minutes

### Step 2.1 — Locate API Keys

1. Login to https://dashboard.stripe.com
2. Confirm **Test mode** toggle (top-right) is **ON** — UI shows orange "Test mode" banner
3. Navigate to: **Developers → API keys** (https://dashboard.stripe.com/test/apikeys)

You will use **two** keys:

| Key             | Format              | Where used                 |
|-----------------|---------------------|----------------------------|
| Publishable key | `pk_test_51XXXX...` | Frontend (Stripe.js)       |
| Secret key      | `sk_test_51XXXX...` | Backend (server-side only) |

> [!WARNING]
> The secret key (`sk_test_...`) must **never** be committed to Git or exposed client-side. The `.env` file is already
> in `.gitignore`.

**✓ Expected result:** Both keys copied to a temporary scratchpad.

### Step 2.2 — Create Products and Prices (for subscriptions)

> Stripe one-time payments work with inline `price_data` and do **not** require pre-created prices.
> Subscriptions, however, **require** pre-created recurring prices.

Navigate to: **Product catalog → Add product** (https://dashboard.stripe.com/test/products)

Create **3 products**, each with **2 recurring prices** (Monthly + Yearly):

#### Product 1 — Starter

| Field          | Monthly price                           | Yearly price                  |
|----------------|-----------------------------------------|-------------------------------|
| Product name   | Starter                                 | (same product)                |
| Description    | Perfect for individuals getting started | —                             |
| Pricing model  | Standard pricing — recurring            | Standard pricing — recurring  |
| Amount         | `$9.99`                                 | `$95.90` *(12 × $9.99 × 0.8)* |
| Billing period | Monthly                                 | Yearly                        |

#### Product 2 — Pro

| Field          | Monthly  | Yearly    |
|----------------|----------|-----------|
| Amount         | `$29.99` | `$287.90` |
| Billing period | Monthly  | Yearly    |

#### Product 3 — Enterprise

| Field          | Monthly  | Yearly    |
|----------------|----------|-----------|
| Amount         | `$99.99` | `$959.90` |
| Billing period | Monthly  | Yearly    |

### Step 2.3 — Copy Price IDs

After creating each price, click into it and copy the **price ID** (starts with `price_1...`, **not** the `prod_...`
product ID).

Record the **6 price IDs** in a temporary list:

```
Starter Monthly:     price_1________________
Starter Yearly:      price_1________________
Pro Monthly:         price_1________________
Pro Yearly:          price_1________________
Enterprise Monthly:  price_1________________
Enterprise Yearly:   price_1________________
```

**✓ Expected result:** 6 price IDs collected. Each follows pattern `price_1` + 24 alphanumeric chars.

### Step 2.4 — Reference: Test Card Numbers

You will use these cards in [Phase 5](#phase-5--end-to-end-verification).

| Use case             | Card number           | Behavior                      |
|----------------------|-----------------------|-------------------------------|
| ✅ Success            | `4242 4242 4242 4242` | Normal success                |
| 🔐 3D Secure         | `4000 0027 6000 3184` | Triggers authentication popup |
| ❌ Insufficient funds | `4000 0000 0000 9995` | Declined                      |
| ❌ Generic decline    | `4000 0000 0000 0002` | Declined                      |

For all test cards:

- **Expiry:** any future date (e.g. `12/30`)
- **CVC:** any 3 digits (e.g. `123`)
- **ZIP:** any 5 digits (e.g. `12345`)

📋 Full reference: https://docs.stripe.com/testing#cards

### Phase 2 Sign-off ✅

- [ ] Stripe Test mode is ON
- [ ] Publishable key (`pk_test_...`) copied
- [ ] Secret key (`sk_test_...`) copied
- [ ] 6 recurring Price IDs collected (3 plans × 2 intervals)
- [ ] Test card numbers noted

---

## Phase 3 — PayPal Sandbox Integration

> **Goal:** Configure PayPal sandbox for one-time payments and subscriptions.
> **Estimated time:** 20 minutes (subscriptions require REST API calls)

### Step 3.1 — Create Sandbox App

1. Login to https://developer.paypal.com/
2. Navigate to: **Apps & Credentials**
3. Ensure **Sandbox** tab is selected (not Live)
4. Click **Create App**
5. Fill in:
    - **App Name:** ShopPay Demo
    - **Type:** Merchant
6. Click **Create**

**✓ Expected result:** Two credentials displayed:

| Field     | Format                        |
|-----------|-------------------------------|
| Client ID | `AaXxXxXxXxXx...` (~80 chars) |
| Secret    | `EbYyYyYyYyYy...` (~80 chars) |

Click **Show** next to Secret and copy both values to your scratchpad.

### Step 3.2 — Locate Sandbox Test Accounts

PayPal auto-creates 2 default sandbox accounts (1 buyer + 1 facilitator/seller).

1. Navigate to: **Testing tools → Sandbox accounts** (https://developer.paypal.com/dashboard/accounts)
2. Find the **Personal** account (this is your buyer)
3. Click **⋮ (kebab menu) → View/edit account**
4. Record:
    - **Email** (e.g., `sb-xxxxx@personal.example.com`)
    - **System-generated password**

**✓ Expected result:** You can use this credential to login when PayPal redirects you during testing.

### Step 3.3 — Obtain OAuth Access Token

This token is required for all REST API calls in subsequent steps. It expires every 9 hours.

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -u "<YOUR_CLIENT_ID>:<YOUR_CLIENT_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

**✓ Expected response:**

```json
{
  "scope": "...",
  "access_token": "A21AAxxxxxxxxxxxxx",
  "token_type": "Bearer",
  "app_id": "APP-...",
  "expires_in": 32400,
  "nonce": "..."
}
```

Copy the `access_token` — you'll use it as `Authorization: Bearer <token>` in next steps.

### Step 3.4 — Create Catalog Products (1 per plan)

Run **3 times** — once each for Starter, Pro, Enterprise.

**Example: Create "Pro" product**

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ShopPay Pro",
    "description": "Pro tier — best for professionals and small teams",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }'
```

**✓ Expected response:** Contains `"id": "PROD-XXXXXXXXX"` — record it.

Repeat for **Starter** and **Enterprise**. You will end up with **3 product IDs**:

```
PROD_STARTER:    PROD-________________
PROD_PRO:        PROD-________________
PROD_ENTERPRISE: PROD-________________
```

### Step 3.5 — Create Billing Plans (2 per product, 6 total)

For each product, create one **Monthly** plan and one **Yearly** plan.

**Example: Pro Monthly**

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "<PROD_PRO_ID>",
    "name": "Pro Monthly",
    "description": "Pro plan billed every month",
    "status": "ACTIVE",
    "billing_cycles": [{
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "REGULAR",
      "sequence": 1,
      "total_cycles": 0,
      "pricing_scheme": {
        "fixed_price": { "value": "29.99", "currency_code": "USD" }
      }
    }],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

**Example: Pro Yearly** — replace:

- `"name": "Pro Yearly"`
- `"interval_unit": "YEAR"`
- `"value": "287.90"`

**✓ Expected response:** Contains `"id": "P-XXXXXXXXXXXX"` — record it.

Repeat across all 3 products × 2 intervals = **6 plan IDs**:

```
Starter Monthly:     P-________________
Starter Yearly:      P-________________
Pro Monthly:         P-________________
Pro Yearly:          P-________________
Enterprise Monthly:  P-________________
Enterprise Yearly:   P-________________
```

### Step 3.6 — Verify Plan Activation

Plans default to `ACTIVE`, but if status is `CREATED`, activate explicitly:

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/billing/plans/<PLAN_ID>/activate \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

List all plans to verify:

```bash
curl https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**✓ Expected result:** Response contains all 6 plans with `"status": "ACTIVE"`.

### Phase 3 Sign-off ✅

- [ ] PayPal sandbox app created
- [ ] Client ID + Secret copied
- [ ] Sandbox personal (buyer) account credentials noted
- [ ] OAuth access token successfully obtained
- [ ] 3 catalog products created
- [ ] 6 billing plans created and verified ACTIVE

---

## Phase 4 — Environment Configuration

> **Goal:** Populate `.env` with all values collected from Phases 2 & 3.
> **Estimated time:** 5 minutes

### Step 4.1 — Edit `.env`

Open `.env` in your editor. Replace placeholders with the values you collected.

```env
# ─── Stripe ────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_51________________
STRIPE_WEBHOOK_SECRET=                      # Leave empty if not using webhooks yet
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51________________

STRIPE_PRICE_STARTER_MONTHLY=price_1________________
STRIPE_PRICE_STARTER_YEARLY=price_1________________
STRIPE_PRICE_PRO_MONTHLY=price_1________________
STRIPE_PRICE_PRO_YEARLY=price_1________________
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1________________
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1________________

# ─── PayPal ────────────────────────────────────────────
NUXT_PUBLIC_PAYPAL_CLIENT_ID=Aa________________
PAYPAL_CLIENT_SECRET=Eb________________
PAYPAL_WEBHOOK_ID=                          # Leave empty for now
PAYPAL_MODE=sandbox

PAYPAL_PLAN_STARTER_MONTHLY=P-________________
PAYPAL_PLAN_STARTER_YEARLY=P-________________
PAYPAL_PLAN_PRO_MONTHLY=P-________________
PAYPAL_PLAN_PRO_YEARLY=P-________________
PAYPAL_PLAN_ENTERPRISE_MONTHLY=P-________________
PAYPAL_PLAN_ENTERPRISE_YEARLY=P-________________

# ─── App ───────────────────────────────────────────────
NUXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 4.2 — Restart dev server

> [!IMPORTANT]
> Nuxt **does not** hot-reload environment variables. You **must** restart.

Stop the running dev server (`Ctrl + C`) and run again:

```bash
npm run dev
```

### Step 4.3 — Verify environment is loaded

```bash
curl http://localhost:3000/api/plans | head -c 1500
```

**✓ Expected result:** Response includes your real `stripe_price_id_monthly` (`price_1...`) and
`paypal_plan_id_monthly` (`P-...`) — not the `_demo` placeholder values.

### Phase 4 Sign-off ✅

- [ ] All env vars filled in
- [ ] Dev server restarted
- [ ] `/api/plans` returns real Stripe and PayPal IDs

---

## Phase 5 — End-to-End Verification

> **Goal:** Validate every payment flow from UI through gateway.
> **Estimated time:** 10 minutes

### Test Scenario 1 — Cart → Stripe (one-time)

| Step | Action                                                              | Expected result                                            |
|------|---------------------------------------------------------------------|------------------------------------------------------------|
| 1    | Go to `/products`                                                   | Product grid loads with 8 items                            |
| 2    | Click **Add to Cart** on any item                                   | Toast: "X added to cart" + cart badge increments           |
| 3    | Click cart icon → goes to `/cart`                                   | Cart shows item + summary                                  |
| 4    | Click **Pay with Stripe**                                           | Email modal opens                                          |
| 5    | Enter `test@example.com` → **Continue to Stripe**                   | Browser redirects to `checkout.stripe.com`                 |
| 6    | Card: `4242 4242 4242 4242`, expiry `12/30`, CVC `123`, ZIP `12345` | Form accepts                                               |
| 7    | Click **Pay**                                                       | Redirects to `/checkout/success?gateway=stripe&order_id=X` |
| 8    | Success page shows confetti + order details                         | DB updated: order status = `paid`                          |

### Test Scenario 2 — Cart → PayPal (one-time)

| Step | Action                                            | Expected result                           |
|------|---------------------------------------------------|-------------------------------------------|
| 1    | Add item to cart                                  | Cart updates                              |
| 2    | Cart → **Pay with PayPal** → Continue             | Redirects to PayPal sandbox login page    |
| 3    | Login with **personal sandbox buyer** credentials | PayPal approval screen shows order detail |
| 4    | Click **Continue** / **Pay Now**                  | Redirects back to app                     |
| 5    | Success page renders                              | DB order status = `paid`                  |

### Test Scenario 3 — Subscription → Stripe (Monthly)

| Step | Action                                           | Expected result                                                      |
|------|--------------------------------------------------|----------------------------------------------------------------------|
| 1    | Go to `/subscriptions`                           | 3 plan cards visible, Monthly toggle active                          |
| 2    | Click **Subscribe via Stripe** on **Pro**        | Modal: "Subscribe via Stripe · Pro plan"                             |
| 3    | Enter email → **Confirm & Subscribe**            | Redirects to Stripe Checkout (subscription mode)                     |
| 4    | Card: `4242 4242 4242 4242`, etc.                | Form accepts                                                         |
| 5    | Click **Subscribe**                              | Redirects to `/subscription/success?gateway=stripe&interval=monthly` |
| 6    | Page shows Active plan + next billing in 1 month | ✓                                                                    |

### Test Scenario 4 — Subscription → Stripe (Yearly)

| Step | Action                                    | Expected result                                            |
|------|-------------------------------------------|------------------------------------------------------------|
| 1    | Subscriptions page → toggle to **Yearly** | Prices update to yearly amounts, "Save 20%" badge visible  |
| 2    | Subscribe via Stripe on Pro               | Modal shows yearly price ($287.90)                         |
| 3    | Complete checkout                         | Success page shows interval=yearly, next billing in 1 year |

### Test Scenario 5 — Subscription → PayPal

| Step | Action                                   | Expected result                                     |
|------|------------------------------------------|-----------------------------------------------------|
| 1    | Subscriptions → Subscribe via PayPal     | Email modal                                         |
| 2    | Continue → redirects to PayPal sandbox   | Subscription approval screen                        |
| 3    | Login with buyer sandbox → **Subscribe** | Redirects to `/subscription/success?gateway=paypal` |

### Test Scenario 6 — Cancel/Decline path

| Step | Action                                              | Expected result                              |
|------|-----------------------------------------------------|----------------------------------------------|
| 1    | At Stripe Checkout, click back/cancel               | Redirects to `/checkout/cancel` with warn UI |
| 2    | Try Stripe with declined card `4000 0000 0000 0002` | Stripe shows decline error; user can retry   |

### Phase 5 Sign-off ✅

- [ ] Stripe one-time payment completes successfully
- [ ] PayPal one-time payment completes successfully
- [ ] Stripe subscription (monthly + yearly) works
- [ ] PayPal subscription (monthly + yearly) works
- [ ] Cancel/decline paths render correctly

---

## Phase 6 — Webhook Setup (Optional)

> **Goal:** Receive real-time payment confirmation events from Stripe and PayPal.
> **Estimated time:** 10 minutes
> **When to do this:** Required for production. Optional for local demo since `/api/orders/mark-paid` is called by the
> demo simulator.

### Step 6.1 — Stripe Webhooks (local development)

The Stripe CLI forwards live test-mode events from Stripe → your localhost.

**Install:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux / others → https://docs.stripe.com/stripe-cli#install
```

**Login & forward:**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**✓ Expected output:**

```
> Ready! Your webhook signing secret is whsec_XXXXXX
```

Copy the `whsec_...` value → paste into `STRIPE_WEBHOOK_SECRET` in `.env` → restart Nuxt.

**Trigger a test event:**

```bash
stripe trigger checkout.session.completed
```

You should see logs in both the `stripe listen` terminal and your Nuxt server.

### Step 6.2 — PayPal Webhooks (local development)

PayPal requires a public HTTPS URL. Use **ngrok** to tunnel localhost.

**Install ngrok:**

```bash
brew install ngrok
ngrok config add-authtoken <your-token>  # from https://dashboard.ngrok.com
```

**Tunnel localhost:**

```bash
ngrok http 3000
```

**✓ Expected output:**

```
Forwarding https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

**Register webhook in PayPal Dashboard:**

1. https://developer.paypal.com/dashboard/applications → click your app
2. Scroll to **Webhooks** → **Add Webhook**
3. **Webhook URL:** `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/paypal/webhook`
4. **Event types** (select these):
    - `PAYMENT.CAPTURE.COMPLETED`
    - `BILLING.SUBSCRIPTION.ACTIVATED`
    - `BILLING.SUBSCRIPTION.CANCELLED`
5. Save → copy **Webhook ID** → paste into `PAYPAL_WEBHOOK_ID` in `.env` → restart Nuxt.

### Phase 6 Sign-off ✅

- [ ] Stripe CLI forwards events to localhost
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] ngrok tunnel active
- [ ] PayPal webhook registered
- [ ] `PAYPAL_WEBHOOK_ID` configured

---

## Appendix A — Troubleshooting Matrix

| Symptom                                     | Likely cause                      | Fix                                                   |
|---------------------------------------------|-----------------------------------|-------------------------------------------------------|
| `"No such price: 'price_xxx_demo'"`         | Using demo placeholder            | Replace with real `price_1Xxx...` in `.env`, restart  |
| `"Resource not found"` (PayPal)             | Empty/invalid plan ID             | Verify with `GET /v1/billing/plans/<id>`              |
| `"AUTHENTICATION_FAILURE"` (PayPal)         | Wrong client secret or wrong mode | Confirm `PAYPAL_MODE=sandbox` matches the credentials |
| `"Invalid API Key provided"` (Stripe)       | Wrong key or live/test mix-up     | Confirm key starts with `sk_test_` in test mode       |
| Webhook not received                        | Tunnel disconnected or wrong URL  | Restart `stripe listen` / `ngrok`, verify env secret  |
| Stripe Checkout shows declined              | Used decline test card            | Use `4242 4242 4242 4242` for success                 |
| `Failed to resolve component: n-button`     | Plugin not loaded                 | Restart dev server; plugin at `plugins/naive-ui.ts`   |
| Cancel redirect loop                        | Browser back-button after cancel  | Clear URL or navigate fresh to `/products`            |
| Subscription redirects but DB has no record | Webhook not configured            | Set up Phase 6, or rely on demo `mark-paid` flow      |

---

## Appendix B — Demo Mode Fallback

When `.env` is incomplete or contains demo placeholders, the app **automatically falls back** to a built-in gateway
simulator at `/demo/gateway`. This ensures the UI demo never breaks during a presentation.

| Condition                                                                 | Fallback behavior                             |
|---------------------------------------------------------------------------|-----------------------------------------------|
| `STRIPE_SECRET_KEY` missing or doesn't start with `sk_`                   | Redirect to demo gateway as Stripe            |
| Stripe price ID contains `_demo`                                          | Redirect to demo gateway                      |
| Stripe API rejects (invalid price, etc.)                                  | Redirect to demo gateway + `&fallback=1` flag |
| `NUXT_PUBLIC_PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` contains `xxxxx` | Redirect to demo gateway as PayPal            |
| PayPal plan ID contains `DEMO`                                            | Redirect to demo gateway                      |

The simulator:

- Shows a realistic Stripe/PayPal-branded checkout screen
- Runs a 4-step animation (Authenticating → Authorizing → Confirming → Finalizing)
- Marks the order as `paid` in the database via `/api/orders/mark-paid`
- Redirects to the appropriate success page with all query params preserved

> [!CAUTION]
> Before going live to production, ensure **no** plan or price IDs contain `_demo` / `DEMO` strings, otherwise
> legitimate transactions would silently fall back to the simulator.

---

## Appendix C — Production Readiness Checklist

Before promoting from sandbox to production:

### Credentials

- [ ] Replace `sk_test_...` with **live** `sk_live_...` (Stripe)
- [ ] Replace `pk_test_...` with **live** `pk_live_...` (Stripe)
- [ ] Replace sandbox client ID/secret with **live** ones (PayPal)
- [ ] Set `PAYPAL_MODE=production`

### Webhooks

- [ ] Stripe webhook endpoint deployed at `https://yourapp.com/api/stripe/webhook`
- [ ] Live Stripe webhook secret in env
- [ ] PayPal webhook registered with live app
- [ ] Live `PAYPAL_WEBHOOK_ID` in env
- [ ] Signature verification enabled (already implemented in `webhook.post.ts` handlers)

### Catalog re-creation

- [ ] Re-create all Stripe Products + Prices in **live** account
- [ ] Re-create all PayPal Products + Plans in **live** account
- [ ] Update `.env` with **live** price/plan IDs
- [ ] Verify **none** of them contain `_demo` or `DEMO` substring

### Security

- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] `.env` not in source control
- [ ] Database: migrate from SQLite to PostgreSQL/MySQL
- [ ] PCI DSS compliance review (Stripe Checkout handles most of this)
- [ ] Refund flow tested end-to-end
- [ ] Email receipts enabled (Stripe Dashboard → Settings → Customer emails)

### Operational

- [ ] Monitoring/alerting on `payment_intent.payment_failed` events
- [ ] Dashboard for ops to view orders / subscriptions
- [ ] Customer support workflow for chargebacks
- [ ] Dunning emails configured (Stripe Smart Retries)

---

## Appendix D — Code References

| Layer  | File                                            | Purpose                            |
|--------|-------------------------------------------------|------------------------------------|
| Config | `nuxt.config.ts`                                | Runtime config (env mapping)       |
| Config | `.env.example`                                  | Env template for teammates         |
| API    | `server/api/plans.get.ts`                       | Returns plans + env-overridden IDs |
| API    | `server/api/stripe/create-checkout.post.ts`     | Cart → Stripe one-time             |
| API    | `server/api/stripe/create-subscription.post.ts` | Plan → Stripe subscription         |
| API    | `server/api/stripe/webhook.post.ts`             | Stripe event handler               |
| API    | `server/api/paypal/create-order.post.ts`        | Cart → PayPal one-time             |
| API    | `server/api/paypal/create-subscription.post.ts` | Plan → PayPal subscription         |
| API    | `server/api/paypal/capture-order.post.ts`       | Capture approved PayPal order      |
| API    | `server/api/paypal/webhook.post.ts`             | PayPal event handler               |
| API    | `server/api/orders/mark-paid.post.ts`           | Demo-mode: flip order to paid      |
| Util   | `server/utils/stripe.ts`                        | Stripe SDK singleton               |
| Util   | `server/utils/paypal.ts`                        | PayPal OAuth + REST helpers        |
| Util   | `server/utils/db.ts`                            | SQLite schema + seed               |
| UI     | `pages/demo/gateway.vue`                        | Sandbox gateway simulator          |
| UI     | `pages/subscriptions.vue`                       | Plans page with interval toggle    |
| UI     | `components/subscription/PricingGrid.vue`       | Pricing toggle + grid              |

---

## 📞 Support

| Issue type                             | Contact           |
|----------------------------------------|-------------------|
| Webhook signature verification failing | Backend team      |
| Production go-live review              | Platform Lead     |
| Tax/VAT configuration (Stripe Tax)     | Finance + Backend |
| Multi-currency setup                   | Backend team      |
| UI/UX polish                           | Frontend team     |

---

**End of guide.** For internal questions, ping `#shoppay-platform` on Slack.
