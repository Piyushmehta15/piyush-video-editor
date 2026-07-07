# TODO - Contact section redesign

- [x] Replace the current Contact section markup in `index.html` with a premium two-column client inquiry layout:
  - [x] LEFT: headline + subtitle + conversion-first form (all requested fields, file upload, submit)
  - [x] RIGHT: glassmorphism info card + response/delivery bullets + 5 contact buttons (WhatsApp/Instagram/LinkedIn/YouTube/Email) all fully clickable
  - [x] Fix floating/inline WhatsApp link to use `https://wa.me/919625651513`
  - [x] Add containers for success/error + loading state

- [x] Add/extend styles in `css/styles.css` to match existing theme and meet design requirements:

- [x] Two-column responsive layout
  - [x] Glassmorphism card/form, dark premium UI, cyan accent
  - [x] Rounded corners (20px), soft shadows, smooth hover animations
  - [x] Beautiful focus states
  - [x] Loading animation while submitting
  - [x] Success + error message styles

- [x] Add client-side behavior in `js/app.js` (or separate module):
   - [x] Prevent default submit, validate required fields
   - [x] Show loading animation and disable submit
   - [x] On success show: "Thank you! I'll contact you within 24 hours."
   - [x] On error show friendly error message
   - [x] Ensure buttons navigate correctly (WhatsApp/email/social)

- [x] Run a quick sanity check (manual):
  - [x] WhatsApp button links correctly
  - [x] Form submission UI states work
  - [x] Responsive layout works on small screens

