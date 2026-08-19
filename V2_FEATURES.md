# Ephphatha Therapy Center V2

## Public website upgrades
- Sign-in button automatically appears on existing public pages.
- Admin-managed brand colors, card radius and hero style.
- Admin-managed announcement banner.
- Clinic hours shown on the Contact page.
- Current Google listing hours initialized as Mon-Fri 09:30-20:00, Sat 09:30-12:30, Sunday closed.
- Public services can be driven from the D1 service catalog.
- Public therapist profiles, programs, gallery and testimonials can be published from Admin.
- Existing static site remains the fallback if the backend is not connected.

## Parent / client portal
- Sign up / sign in / sign out.
- Secure session cookies.
- Child/client profiles.
- Service selection.
- Therapist selection.
- Live slot calculation.
- In-clinic / online mode validation.
- Appointment requests.
- Appointment list and cancellation.

## Admin
- Dashboard metrics.
- Appointment status management.
- Family/client directory.
- Therapist profiles and service assignments.
- Service duration and delivery-mode management.
- Weekly therapist availability.
- Therapist blocked time / leave.
- Center-wide holidays / closures.
- Booking interval, lead time and horizon controls.
- Theme presets and appearance editor.
- Announcement and section visibility controls.
- Business-hours editor.
- Content library for programs, testimonials, gallery items, FAQs and announcements.

## Therapist
- Role-based therapist login.
- Upcoming schedule.
- Add weekly availability.
- Block leave/unavailable time.
- Confirm session, mark complete or no-show.

## Security / architecture
- Cloudflare Pages Functions.
- Cloudflare D1.
- PBKDF2-SHA256 password hashing with random per-user salt.
- SHA-256 session-token storage.
- HttpOnly + Secure + SameSite=Lax session cookie.
- Server-side role authorization.
- Same-origin checks on state-changing requests.
- Parent ownership checks.
- Unique active appointment slot index to help prevent double booking.
- `_routes.json` keeps static pages outside Functions usage.

This is intentionally a lightweight scheduling/operations portal, not a full EMR. Do not expand it to store detailed clinical records or medical documents without a dedicated privacy/security/compliance review.
