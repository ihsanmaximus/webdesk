# Webdesk — Proposal RLC

Static proposal experience for Rifdaira Learning Center.

## Route
- Overview: `/penawaran/rlc/`
- Chapter pages: `/penawaran/rlc/bab/{chapter-slug}/`

## Structure
- Compact sticky top navigation and expandable iconbar sidebar
- Split-bleed hero
- Nine photographic proposal cards; each opens its own chapter route
- Quote & image interludes after each three-card group
- Final CTA, summary and footer
- Responsive single-column mobile cards with staggered Intersection Observer reveal

## Deployment
Static site; no build step required. Vercel rewrites route each chapter URL to the shared page shell, which renders the matching chapter based on its path.
