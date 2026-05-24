# Clarpoint Template Store Setup

## Current mode

This store is built in the simplest reliable mode for the current Clarpoint site:

- static product catalog
- static product detail pages
- static downloadable file packs
- Stripe Payment Link fallback mode

## Environment variables for future Stripe API mode

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

These are not hardcoded anywhere in the site.

## Where to add products

Edit:

`/Users/miferrar/Downloads/mikef1234-sudo.github.io/data/templates.js`

Each product supports:

- `id`
- `title`
- `slug`
- `description`
- `price`
- `category`
- `includedFiles`
- `downloadFiles`
- `downloadFilePath`
- `stripePriceId`
- `stripePaymentLink`
- `featured`
- `badge`
- `useCase`
- `audience`

## Where to store downloadable files

Put files in:

`/Users/miferrar/Downloads/mikef1234-sudo.github.io/public/downloads/templates/<product-slug>/`

Recommended contents:

- `README.md`
- `included-files.txt`
- `how-to-use.txt`
- `product-summary.pdf`
- `download-all.zip`
- starter template files

## How to add Stripe Payment Links

1. Create a product in Stripe
2. Create a Stripe Payment Link
3. Paste the URL into the product's `stripePaymentLink` field in `data/templates.js`
4. Save and deploy

If `stripePaymentLink` is empty, the store shows a setup state instead of direct checkout.

## How to test the current flow

1. Open `/templates/`
2. Open a product page
3. Add a real Stripe Payment Link to `data/templates.js`
4. Click `Buy Now`
5. In Stripe, set the post-payment redirect to:

`https://clarpoint.co/success/?product=<product-slug>`

6. After purchase, the success page will show the download pack and individual files

## How to add a new product

1. Add the product object to `data/templates.js`
2. Create the download folder under `public/downloads/templates/<slug>/`
3. Add the starter files
4. Add or copy a product detail page under `templates/<slug>/index.html`
5. Add a Stripe Payment Link or future Stripe Price ID
6. Update `sitemap.xml` if you want the product indexed

## Future upgrade path

If Clarpoint moves off a static-only host, connect:

- `/api/create-checkout-session`
- `/api/stripe-webhook`
- `/api/download`

That will support:

- server-side Stripe Checkout sessions
- verified payment state
- gated download delivery

## Deployment note

The current version is designed to work on a simple static deployment with no custom backend.
