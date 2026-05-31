import Database from 'better-sqlite3'
import {join} from 'path'
import fs from 'fs'

let db: Database.Database | null = null

/**
 * Returns the singleton database instance.
 * On first call, creates tables and seeds sample data.
 */
export function getDb(): Database.Database {
  if (db) {
    return db
  }

  const dbPath = join(process.cwd(), 'data', 'shop.db')

  // Ensure the data directory exists
  const dataDir = join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbPath)

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables(db)
  seedData(db)

  return db
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      stripe_price_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
      stripe_price_id TEXT NOT NULL DEFAULT '',
      paypal_plan_id TEXT NOT NULL DEFAULT '',
      features TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      total_amount INTEGER NOT NULL DEFAULT 0,
      payment_gateway TEXT NOT NULL DEFAULT '',
      payment_id TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_gateway TEXT NOT NULL DEFAULT '',
      subscription_id TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
    );
  `)
}

function seedData(db: Database.Database): void {
  // Only seed if tables are empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  if (productCount.count > 0) {
    return
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, image_url, category, stripe_price_id)
    VALUES (@name, @description, @price, @image_url, @category, @stripe_price_id)
  `)

  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (name, description, price, interval, stripe_price_id, paypal_plan_id, features)
    VALUES (@name, @description, @price, @interval, @stripe_price_id, @paypal_plan_id, @features)
  `)

  const seedTransaction = db.transaction(() => {
    // --- 8 Tech/Gadget Products (prices in cents) ---
    const products = [
      {
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support.',
        price: 14999, // $149.99
        image_url: 'https://placehold.co/400x400/1a1a2e/eee?text=Headphones',
        category: 'Audio',
        stripe_price_id: 'price_headphones_demo',
      },
      {
        name: 'Ultra-Slim Laptop 15"',
        description: 'Lightweight 15-inch laptop with M3 chip, 16GB RAM, 512GB SSD, and all-day battery life.',
        price: 99900, // $999.00
        image_url: 'https://placehold.co/400x400/16213e/eee?text=Laptop',
        category: 'Computers',
        stripe_price_id: 'price_laptop_demo',
      },
      {
        name: 'Mechanical Gaming Keyboard',
        description: 'RGB backlit mechanical keyboard with Cherry MX switches, programmable macros, and aluminum frame.',
        price: 12999, // $129.99
        image_url: 'https://placehold.co/400x400/0f3460/eee?text=Keyboard',
        category: 'Peripherals',
        stripe_price_id: 'price_keyboard_demo',
      },
      {
        name: 'Ergonomic Wireless Mouse',
        description: 'Ergonomic vertical mouse with 4000 DPI sensor, USB-C charging, and multi-device Bluetooth support.',
        price: 4999, // $49.99
        image_url: 'https://placehold.co/400x400/533483/eee?text=Mouse',
        category: 'Peripherals',
        stripe_price_id: 'price_mouse_demo',
      },
      {
        name: '4K Ultra-Wide Monitor 34"',
        description: '34-inch curved ultra-wide monitor with 4K resolution, 144Hz refresh rate, and HDR600 support.',
        price: 69900, // $699.00
        image_url: 'https://placehold.co/400x400/e94560/eee?text=Monitor',
        category: 'Displays',
        stripe_price_id: 'price_monitor_demo',
      },
      {
        name: 'HD Streaming Webcam',
        description: '1080p webcam with auto-focus, built-in microphone, privacy shutter, and low-light correction.',
        price: 7999, // $79.99
        image_url: 'https://placehold.co/400x400/0a1931/eee?text=Webcam',
        category: 'Accessories',
        stripe_price_id: 'price_webcam_demo',
      },
      {
        name: 'Portable Bluetooth Speakers',
        description: 'Waterproof portable speakers with 360° sound, 20-hour playtime, and built-in power bank.',
        price: 2999, // $29.99
        image_url: 'https://placehold.co/400x400/185adb/eee?text=Speakers',
        category: 'Audio',
        stripe_price_id: 'price_speakers_demo',
      },
      {
        name: 'Fitness Smartwatch Pro',
        description: 'Advanced fitness smartwatch with GPS, heart rate monitor, SpO2, sleep tracking, and 7-day battery.',
        price: 24999, // $249.99
        image_url: 'https://placehold.co/400x400/ffc947/333?text=Smartwatch',
        category: 'Wearables',
        stripe_price_id: 'price_smartwatch_demo',
      },
    ]

    for (const product of products) {
      insertProduct.run(product)
    }

    // --- 3 Subscription Plans (prices in cents) ---
    const plans = [
      {
        name: 'Starter',
        description: 'Perfect for individuals getting started with basic features.',
        price: 999, // $9.99/mo
        interval: 'monthly',
        stripe_price_id: 'price_starter_monthly_demo',
        paypal_plan_id: 'P-STARTER-DEMO',
        features: JSON.stringify([
          '5 Projects',
          '1 GB Storage',
          'Email Support',
          'Basic Analytics',
          'Community Access',
        ]),
      },
      {
        name: 'Pro',
        description: 'Best for professionals and small teams needing more power.',
        price: 2999, // $29.99/mo
        interval: 'monthly',
        stripe_price_id: 'price_pro_monthly_demo',
        paypal_plan_id: 'P-PRO-DEMO',
        features: JSON.stringify([
          'Unlimited Projects',
          '50 GB Storage',
          'Priority Support',
          'Advanced Analytics',
          'API Access',
          'Team Collaboration',
          'Custom Integrations',
        ]),
      },
      {
        name: 'Enterprise',
        description: 'Full-featured plan for large teams and organizations.',
        price: 9999, // $99.99/mo
        interval: 'monthly',
        stripe_price_id: 'price_enterprise_monthly_demo',
        paypal_plan_id: 'P-ENTERPRISE-DEMO',
        features: JSON.stringify([
          'Unlimited Everything',
          '1 TB Storage',
          '24/7 Dedicated Support',
          'Real-time Analytics',
          'Full API Access',
          'Unlimited Team Members',
          'Custom Integrations',
          'SSO / SAML',
          'SLA Guarantee',
          'Dedicated Account Manager',
        ]),
      },
    ]

    for (const plan of plans) {
      insertPlan.run(plan)
    }
  })

  seedTransaction()
  console.log('[DB] Database seeded with sample products and subscription plans.')
}
