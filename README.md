# 💳 ShopPay — Payment Integration Demo

Production-ready reference implementation for **Stripe** and **PayPal** payment integration with shopping cart and
subscription billing flows. Built with **Nuxt 3**, **Vue 3**, **Naive UI**, and **TailwindCSS**.

![Stack](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js) ![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwind-css) ![Stripe](https://img.shields.io/badge/Stripe-API-635bff?logo=stripe) ![PayPal](https://img.shields.io/badge/PayPal-REST-0070ba?logo=paypal)

---

## ✨ Features

- 🛒 **Shopping Cart Checkout** — Browse 8 tech products, manage cart, pay via Stripe or PayPal
- 🔄 **Subscription Billing** — 3 tiers (Starter / Pro / Enterprise) × monthly & yearly billing
- 💳 **Real Stripe Sandbox Integration** — Live test-mode payments with card `4242 4242 4242 4242`
- 🅿️ **PayPal Sandbox Integration** — One-time payments + recurring subscriptions
- 🎭 **Demo Gateway Simulator** — Polished fallback UI when credentials are missing (perfect for client showcases)
- 🔔 **Webhook Handlers** — Stripe + PayPal event handling with signature verification
- 💾 **SQLite Persistence** — Orders, subscriptions, products auto-seeded on first run
- 🎨 **Polished UI** — Dark glassmorphism, gradient animations, confetti success states, page transitions
- 📱 **Fully Responsive** — Mobile-first design with TailwindCSS

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/caodinhtuan/simple-shopping-card.git
cd simple-shopping-card
npm install

# 2. Create .env from template
cp .env.example .env

# 3. Run dev server
npm run dev
```

App will be live at **http://localhost:3000** (or next available port).

> [!NOTE]
> No real Stripe/PayPal credentials? No problem — the demo gateway simulator kicks in automatically and walks through a
> realistic UI flow.

---

## 📚 Documentation

| Document                                                                 | Description                                                                   |
|--------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| [`docs/payment_integration_plan.md`](./docs/payment_integration_plan.md) | Original architecture plan                                                    |
| [`docs/sandbox_setup_guide.md`](./docs/sandbox_setup_guide.md)           | Step-by-step Stripe & PayPal sandbox setup                                    |
| [`docs/webhook_advanced_guide.md`](./docs/webhook_advanced_guide.md)     | Advanced webhook event handling, signature verification, transaction tracking |

---

## 🧱 Project Structure

```
simple-shopping-card/
├── pages/                  # File-based routes
│   ├── index.vue           # Hero / landing
│   ├── products.vue        # Product catalog with search + filter
│   ├── cart.vue            # Shopping cart
│   ├── checkout.vue        # Email + payment selection
│   ├── subscriptions.vue   # Pricing plans + interval toggle
│   ├── checkout/           # success / cancel pages
│   ├── subscription/       # success / cancel pages
│   └── demo/gateway.vue    # Sandbox gateway simulator
│
├── components/
│   ├── layout/             # AppHeader, AppFooter, CartBadge
│   ├── products/           # ProductCard, ProductGrid
│   ├── cart/               # CartItem, CartSummary
│   ├── checkout/           # PaymentMethodSelector, gateway buttons
│   └── subscription/       # PricingCard, PricingGrid
│
├── server/api/
│   ├── stripe/             # create-checkout, create-subscription, webhook
│   ├── paypal/             # create-order, capture-order, create-subscription, webhook
│   ├── orders/             # orders CRUD, mark-paid (demo)
│   ├── products.get.ts
│   └── plans.get.ts        # Returns plans with env-overridden price IDs
│
├── server/utils/
│   ├── stripe.ts           # Stripe SDK singleton
│   ├── paypal.ts           # PayPal OAuth + REST helpers
│   └── db.ts               # SQLite schema + seed
│
├── stores/cart.ts          # Pinia cart store
├── composables/            # useStripe, usePayPal, useAppMessage
├── plugins/naive-ui.ts     # Global Naive UI component registration
└── assets/css/tailwind.css # Design tokens, utility classes, animations
```

---

## 🧪 Test Flows

### Cart → Stripe Checkout

1. `/products` → Add to Cart
2. `/cart` → Pay with Stripe
3. Use test card `4242 4242 4242 4242`, any future expiry, any CVC
4. → Redirects to `/checkout/success`

### Cart → PayPal

1. Cart → Pay with PayPal
2. Login with **PayPal Sandbox buyer** account
3. → Redirects to `/checkout/success`

### Subscription (Monthly/Yearly)

1. `/subscriptions` → toggle Monthly/Yearly
2. Subscribe via Stripe or PayPal
3. → Redirects to `/subscription/success`

See [`docs/sandbox_setup_guide.md`](./docs/sandbox_setup_guide.md) for the complete walkthrough.

---

## 🔧 Environment Variables

Copy `.env.example` → `.env` and fill in:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PRO_MONTHLY=price_1...      # From Stripe Dashboard
# ... (see .env.example for full list)

# PayPal
NUXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
PAYPAL_PLAN_PRO_MONTHLY=P-...            # From PayPal REST API
# ...
```

If a value is empty or contains demo placeholders, the app **automatically falls back** to the gateway simulator — no
errors, demo always works.

---

## 🛠️ Tech Stack

| Layer      | Technology                                                                                                      |
|------------|-----------------------------------------------------------------------------------------------------------------|
| Framework  | [Nuxt 3](https://nuxt.com/)                                                                                     |
| UI Library | [Naive UI](https://www.naiveui.com/)                                                                            |
| Styling    | [TailwindCSS](https://tailwindcss.com/)                                                                         |
| State      | [Pinia](https://pinia.vuejs.org/)                                                                               |
| Database   | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)                                         |
| Payments   | [Stripe SDK](https://github.com/stripe/stripe-node) · [PayPal REST API](https://developer.paypal.com/api/rest/) |

---

## 📜 License

MIT — Use freely for learning or as a starting point for your own integrations.

---

Built with ❤️ as a reference implementation for modern payment integrations.
