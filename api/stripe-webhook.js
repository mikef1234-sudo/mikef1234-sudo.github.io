module.exports = async function stripeWebhook(request, response) {
  response.statusCode = 501;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({
    error: "Stripe webhook handling is not active in this static-site version yet.",
    note: "Use Stripe Payment Links now, or move these routes to a serverless host such as Vercel when ready."
  }));
};
