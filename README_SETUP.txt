GAOS KINEMATIC WEBSITE UPDATE - SETUP GUIDE

1. Upload files
- Replace your existing HTML files with these updated files:
  index.html, about.html, services.html, projects.html, contact.html, admin.html
- Replace css/style.css with css/style.css
- Replace js/main.js with js/main.js
- Add js/supabase-config.js and js/admin.js

2. Supabase setup
- Open Supabase SQL Editor.
- Run supabase/schema.sql.
- Go to Authentication > Users and create the admin login email/password manually.
- Go to Storage and confirm the live-site-photos bucket exists and is public.

3. Configure website Supabase keys
- Open js/supabase-config.js.
- Replace:
  GAOS_SUPABASE_URL
  GAOS_SUPABASE_ANON_KEY

4. Review email setup
- Create a Resend account and get API key.
- Install Supabase CLI if you want automated emails.
- Deploy the Edge Function:
  supabase functions deploy send-review-email
- Set secrets:
  supabase secrets set RESEND_API_KEY=your_resend_api_key REVIEW_TO_EMAIL=gaoskinematics@gmail.com

5. Admin upload
- Visit /admin.html.
- Login using the user created in Supabase Authentication.
- Upload photo, survey type, location and caption.
- Public photos will show automatically on the homepage.

6. Branding
- The visible business name has been corrected to Gaos Kinematic Concept Limited.
- Domain/email remain gaoskinematics.com / gaoskinematics@gmail.com because those are official contact/domain identifiers.
