# ♡ Our Little Love Story

A small private-admin/public-memory website for a long-distance relationship.

## What it does

- The entire site is locked behind Supabase email/password authentication.
- Unauthenticated visitors are shown only the login screen.
- Direct links to individual memory pages redirect to the login screen.
- Database RLS prevents anonymous users from reading the memories.
- Clicking a card opens a dedicated memory page.
- Each month can have:
  - a photo
  - a title
  - a date/label
  - a favorite memory
- Admin page protected by Supabase email/password authentication.
- Upload photos directly from the Admin page.
- Add, edit, and delete months without touching the code.
- Responsive on phones and desktops.

## 1. Create the Supabase project

Go to https://supabase.com/ and create a project.

In **Authentication → Users**, create your admin user with the email/password you want to use.

Then open **SQL Editor**, paste `supabase/schema.sql`, replace:

    YOUR_ADMIN_EMAIL

with the exact email of your admin account, and run it.

## 2. Create the photo bucket

In **Storage**, create a bucket named:

    month-photos

Make it **Public**.

Then run the storage policy section from `supabase/schema.sql` if you did not run the entire SQL file at once.

## 3. Add your Supabase keys

Open:

    js/config.js

Replace:

    YOUR_SUPABASE_PROJECT_URL
    YOUR_SUPABASE_ANON_KEY

You can find both in Supabase under **Project Settings → API**.

The anon key is intended for frontend use. Do NOT put a Supabase service-role key in this website.

## 4. Test locally

Because this project uses JavaScript modules, open it through a local web server rather than double-clicking `index.html`.

If you have Python installed, from this folder run:

    python -m http.server 8000

Then visit:

    http://localhost:8000

Open `/admin.html` and sign in.

## 5. Deploy

This is a static site, so you can deploy the folder to services such as Netlify, Vercel, GitHub Pages, or Cloudflare Pages.

Upload the whole project, keeping the folder structure.

## Adding future months

You do NOT need to edit `index.html`.

Just:

1. Open `/admin.html`.
2. Sign in.
3. Enter the month number.
4. Give the month a title.
5. Add the date/label.
6. Write the memory.
7. Choose the photo.
8. Click **Save month**.

The homepage and month pages update automatically.

## Important security note

The public site can read the months because the public SELECT policy allows it. Only the configured admin email can insert, update, or delete rows and upload photos.

Keep your Supabase **service role key** secret and never put it in `config.js`.


## Full-site password protection

The site now uses **Supabase Authentication**, rather than a JavaScript-only password.

That distinction matters: a password hard-coded into JavaScript can be discovered by anyone who views the site's source code. Supabase Auth gives you a real login session, and the database RLS policy prevents anonymous users from fetching the memories.

Create the account(s) you want to allow into the site under **Supabase → Authentication → Users**.

You can use the same account for both the public memory area and `/admin.html`. The Admin page still checks the configured admin email before allowing changes.

### To change who can enter

Create/delete users in Supabase Authentication. Anyone with a valid Supabase account can enter the site, while only `YOUR_ADMIN_EMAIL` can edit the memories.

If you want **exactly one shared password with no email**, that requires a server-side authentication layer; do not put a shared password directly in frontend JavaScript.
