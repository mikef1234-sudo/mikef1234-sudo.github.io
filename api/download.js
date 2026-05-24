module.exports = async function templateDownload(request, response) {
  response.statusCode = 501;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({
    error: "Protected server-side downloads are not active in this static-site version yet.",
    note: "The current store uses simple static download packs plus Stripe Payment Link redirects."
  }));
};
