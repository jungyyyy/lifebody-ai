/**
 * One-time setup: creates LifeBody AI Premium product + €9.89/month EUR price.
 * Run: node scripts/create-stripe-product.js
 * Copy the logged price ID into .env.local as STRIPE_PRICE_ID
 *
 * SANDBOX TESTING (Stripe Checkout):
 * Card: 4242 4242 4242 4242 | Expiry: any future date | CVC: any 3 digits | ZIP: any 5 digits
 */

const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn("No .env.local found — using process.env only");
    return;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}
if (!secretKey.startsWith("sk_test_")) {
  console.error("Refusing to run: STRIPE_SECRET_KEY must be a test key (sk_test_...)");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function main() {
  const product = await stripe.products.create({
    name: "LifeBody AI Premium",
    description: "Personalized diet, fitness, fasting program with AI coaching",
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 989,
    currency: "eur",
    recurring: {
      interval: "month",
      trial_period_days: 3,
    },
  });

  console.log("\n✅ Stripe product and price created (test mode)\n");
  console.log("Product ID:", product.id);
  console.log("Price ID:  ", price.id);
  console.log("\nAdd to .env.local:\n");
  console.log(`STRIPE_PRICE_ID=${price.id}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
