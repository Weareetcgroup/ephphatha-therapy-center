# Ephphatha Therapy Center V2 setup

This project now includes a Cloudflare Pages Functions + D1 backend for parent signup/sign-in, patient profiles, therapist profiles, live appointment slots, bookings, therapist availability, admin controls, website theme settings and managed content.

## 1. Create the D1 database
In Cloudflare Dashboard:
1. Workers & Pages -> D1 SQL Database (or Storage & Databases -> D1).
2. Create database: `ephphatha-therapy-db`.
3. Open the database -> Console.
4. Run the complete contents of `schema.sql`.

## 2. Bind D1 to the existing Pages project
1. Workers & Pages -> `ephphatha-therapy-center`.
2. Settings -> Bindings.
3. Add binding -> D1 database.
4. Variable name MUST be: `DB`.
5. Select `ephphatha-therapy-db`.
6. Save and redeploy the Pages project.

## 3. Admin account
The code treats `ephphathatherapycenter@gmail.com` as a super-admin email by default. Open `/portal.html`, create an account using that exact email, then open `/admin.html`.

For a different admin email, add an environment variable named `ADMIN_EMAILS` to the Pages project. Multiple emails can be comma-separated.

## 4. Add therapists and availability
Admin -> Therapists:
- Add therapist name, title, qualifications and email.
- Tick services the therapist provides.

Admin -> Availability:
- Choose therapist.
- Add weekly working windows.
- Add blocked time for leave/meetings.

A therapist who creates an account using the same therapist email is automatically assigned the therapist role and linked to that profile.

## 5. Live booking flow
Parent:
1. Sign up at `/portal.html`.
2. Add child/client profile.
3. Choose service + date.
4. Live slots are calculated from therapist availability, service duration, blocked time and existing pending/confirmed appointments.
5. Booking is created as `pending`.

Admin can change appointment status to Confirmed, Completed, Cancelled or No show.

## 6. Website theme and hours
Admin -> Website & Theme can change:
- primary, accent and text colors
- card radius
- hero style
- announcement banner
- visibility switches
- clinic display hours

The public website fetches these values from `/api/public/settings` on page load.

Default public hours were initialized from the current Google listing checked in August 2026:
- Monday-Friday: 09:30-20:00
- Saturday: 09:30-12:30
- Sunday: Closed

Therapist availability is separate from clinic display hours.

## 7. Important Google listing check
The current Google business listing for Ephphatha Therapy Center shows `Palaniappa Nagar, Sembakkam, Chennai 600073`, while the supplied Ephphatha letterhead/current website uses `Vishwas Apartment, B-Block, Soundariya Nagar, Gowrivakkam, Chennai 600073`.

Keep the website address that matches the actual current center and update Google Business Profile if Google is stale.

## Security notes
- Passwords are hashed with PBKDF2-SHA256 and a random salt.
- Login sessions are stored as SHA-256 token hashes in D1.
- Session cookie is HttpOnly, Secure and SameSite=Lax.
- Role checks run in Pages Functions, not only in the browser.
- Parent records are scoped to the signed-in parent account.
- `_routes.json` limits Functions invocation to `/api/*`; static site requests remain static.

For production expansion involving detailed clinical records, reports, medical documents or payments, perform a dedicated privacy/security/compliance review before storing that data in this lightweight portal.
