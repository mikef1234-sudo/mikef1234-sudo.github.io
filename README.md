# Michael Ferrari Consulting Website

Static HTML website for technical delivery consulting, responsive HTML/CSS website builds, PM guidance, project setup, executive communications, red-to-green recovery support, deployment support, and all-in delivery readiness consulting.

## Files

- `index.html` - home page
- `services.html` - 1:1 PM guidance, project setup, responsive website delivery, status updates, plans, governance, communications, deployment, and all-in consulting packages
- `about.html` - Michael Ferrari bio and positioning
- `results.html` - anonymized commercial/federal/enterprise results, red-to-green recovery examples, responsive website delivery examples, and sample template
- `contact.html` - inquiry form
- `styles.css` - shared visual design and responsive layout
- `script.js` - mobile navigation and form endpoint guard

## Publish With GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root.
3. In GitHub, open Settings > Pages.
4. Set the source to your main branch and root folder.
5. Save, then open the GitHub Pages URL.

## Before Publishing

Update the contact form in `contact.html`:

```html
<form class="contact-form" data-inquiry-form action="https://formspree.io/f/your-form-id" method="post">
```

Replace `https://formspree.io/f/your-form-id` with your preferred form endpoint. Formspree, Netlify Forms, Squarespace form embed code, or another CRM form can work.

Update these items when ready:

- Discovery call booking URL for all "Book a Discovery Call" buttons
- Email address or form endpoint
- Testimonials or client proof points
- Any sample screenshots or templates you want to show
- Resume-specific wording if you want the commercial, federal, enterprise, $7M-$10M, web delivery, or red-to-green examples to match your exact job history
