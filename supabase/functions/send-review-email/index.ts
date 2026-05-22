// Supabase Edge Function: send-review-email
// Deploy: supabase functions deploy send-review-email
// Required secrets:
// supabase secrets set RESEND_API_KEY=your_resend_api_key REVIEW_TO_EMAIL=gaoskinematics@gmail.com

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const toEmail = Deno.env.get("REVIEW_TO_EMAIL") || "gaoskinematics@gmail.com";

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const html = `
      <h2>New Website Review - Gaos Kinematic</h2>
      <p><strong>Name:</strong> ${payload.name}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Project Type:</strong> ${payload.project_type}</p>
      <p><strong>Rating:</strong> ${payload.rating}/5</p>
      <p><strong>Message:</strong></p>
      <p>${payload.message}</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Gaos Kinematic Website <onboarding@resend.dev>",
        to: [toEmail],
        subject: `New Review from ${payload.name}`,
        html
      })
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
