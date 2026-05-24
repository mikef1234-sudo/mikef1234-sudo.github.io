module.exports = async function createCheckoutSession(request, response) {
  response.statusCode = 501;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({
    error: "Stripe Checkout server-side flow is not active in this static-site version yet.",
    note: "Use stripePaymentLink values in data/templates.js for the low-maintenance checkout flow.",
    requiredEnv: [
      "STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_SITE_URL"
    ]
  }));
};
