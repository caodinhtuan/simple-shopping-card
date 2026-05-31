// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
  ],

  colorMode: {
    classSuffix: '',          // adds `dark` / `light` class on <html> (not `dark-mode`)
    preference: 'dark',       // default for new visitors
    fallback: 'dark',
    storageKey: 'shoppay-theme',
  },

  // Naive UI SSR setup
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr'],
  },

  // Runtime config for env vars
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

    // Stripe Price IDs per plan × interval — paste from Stripe Dashboard
    stripePriceStarterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    stripePriceStarterYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
    stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    stripePriceProYearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    stripePriceEnterpriseMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    stripePriceEnterpriseYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',

    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    paypalMode: process.env.PAYPAL_MODE || 'sandbox',

    // PayPal Plan IDs per plan × interval
    paypalPlanStarterMonthly: process.env.PAYPAL_PLAN_STARTER_MONTHLY || '',
    paypalPlanStarterYearly: process.env.PAYPAL_PLAN_STARTER_YEARLY || '',
    paypalPlanProMonthly: process.env.PAYPAL_PLAN_PRO_MONTHLY || '',
    paypalPlanProYearly: process.env.PAYPAL_PLAN_PRO_YEARLY || '',
    paypalPlanEnterpriseMonthly: process.env.PAYPAL_PLAN_ENTERPRISE_MONTHLY || '',
    paypalPlanEnterpriseYearly: process.env.PAYPAL_PLAN_ENTERPRISE_YEARLY || '',

    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      paypalClientId: process.env.NUXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    },
  },

  // TailwindCSS module will pick up `tailwind.config.ts` from project root
  // (darkMode: 'class', preflight: false — see that file)
  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
    rootAttrs: {
      style: 'min-height: 100vh;',
    },
    head: {
      title: 'ShopPay — Payment Integration Demo',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Demo project for Stripe & PayPal payment integration with Shopping Cart and Subscription flows' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' },
      ],
      style: [
        {
          innerHTML: `
            html,body{margin:0;padding:0;font-family:'Inter',system-ui,sans-serif}
            #__nuxt:empty::before{
              content:'';display:block;position:fixed;inset:0;z-index:9999;
              background:#0a0a1a;background-image:radial-gradient(circle at 50% 50%,rgba(139,92,246,0.08),transparent 50%);
            }
            html:not(.dark) #__nuxt:empty::before{background:#fff;background-image:radial-gradient(circle at 50% 50%,rgba(139,92,246,0.04),transparent 50%);}
            #__nuxt:empty::after{
              content:'';position:fixed;left:50%;top:50%;width:48px;height:48px;margin:-24px;z-index:10000;
              border:3px solid rgba(139,92,246,0.15);border-top-color:#8b5cf6;border-radius:50%;
              animation:nuxt-spin .8s linear infinite;
            }
            @keyframes nuxt-spin{to{transform:rotate(360deg)}}
          `,
        },
      ],
    },
  },
})
