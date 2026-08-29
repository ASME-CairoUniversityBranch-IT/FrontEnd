# Main Segment release validation

Frontend issue #8 is the release gate for the Main Segment public page, registration flow, and admin workflow.

## Automated checks

Run from `ASMECairoUniversityFrontEnd`:

```bash
npm ci
npm test
npm run test:e2e
npm run build
```

The browser suite uses intercepted synthetic API responses and synthetic files. It does not submit applicant data to the deployed API.

| Area | Automated evidence |
| --- | --- |
| API contracts | Unit tests cover the public schema mapping, exact multipart payload, idempotency header, academic routes, admin schema revision endpoints, review/detail/status/document/export mappings, and error propagation. |
| Publish-to-review journey | Playwright publishes the active draft through the admin workspace, opens the public edition, completes all three registration steps, submits synthetic files, reviews the new applicant, opens an authorized document, changes status, and downloads the filtered CSV. |
| Accessibility | Modal focus trapping/restoration and Escape behavior are unit- and browser-tested. The public page is scanned for serious/critical WCAG 2.0/2.1 A/AA axe findings. Reduced-motion behavior and 200% zoom visibility are checked. |
| Responsive layout | The public page is checked at 390px, 768px, and 1440px for horizontal overflow. Sponsor cards within a tier are checked for equal logo-stage dimensions. |
| Privacy | The E2E flow verifies that National ID and free-text answers are absent from browser storage. Public page loading is checked for private-document and admin endpoint prefetches. |
| Regression | Angular unit tests cover public rendering, registration validation/submission, admin CRUD/form-builder/review behavior, focus handling, and service mappings. A production build is required. |

## Manual release checklist

Before production release, repeat these checks against the release API and R2 configuration:

- Publish a draft schema, reload the public registration modal, and confirm its version and questions match.
- Submit a synthetic applicant using JPEG/PNG/WebP ID images and a PDF or DOCX CV. Confirm duplicate/idempotent submission behavior.
- Verify admin role access, document authorization, status history, and filtered CSV contents.
- Confirm document URLs are never embedded in list/detail responses and private files are retrieved only after an explicit admin action.
- Test keyboard-only navigation and visible focus in the registration dialog, search lists, form builder, review drawer, document viewer, and export control.
- Inspect the page at 390px, 768px, and 1440px and at browser zoom 200% with production content and real sponsor logos.
- Confirm R2 CORS, retention, content-type, file-size, and malware-scanning policies in the release environment.

## Known environment boundary

Local production-mode frontend configuration points to the deployed API. A fully green intercepted browser suite proves the frontend contract and UI behavior, while live API/R2 readiness still requires the manual release checks above.
