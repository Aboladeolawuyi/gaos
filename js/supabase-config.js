/* =========================================================
   GAOS KINEMATIC SUPABASE CONFIG
   Replace these two values with your Supabase project details.
   Supabase Dashboard -> Project Settings -> API

   IMPORTANT:
   These values are intentionally exposed because this is frontend code.
   Use ONLY the anon public key here, never the service-role key.
========================================================= */
window.GAOS_SUPABASE_URL = "https://ncnrvwklhqmftzxxaetk.supabase.co";
window.GAOS_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbnJ2d2tsaHFtZnR6eHhhZXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTc1MjIsImV4cCI6MjA5NDk3MzUyMn0.yOsvHBVfS-8lHCLPnWoPV5T7CNNAXMJFPPkMpI2cCb0";
window.GAOS_REVIEW_EMAIL_FUNCTION_URL = `${window.GAOS_SUPABASE_URL}/functions/v1/send-review-email`;

window.gaosSupabase = window.supabase.createClient(
  window.GAOS_SUPABASE_URL,
  window.GAOS_SUPABASE_ANON_KEY
);
