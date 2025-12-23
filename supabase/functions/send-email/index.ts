import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Add this block - Declare Deno types for environment variables
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  try {
    const { emailQueueId } = await req.json();

    if (!emailQueueId) {
      throw new Error("emailQueueId is required");
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get email from queue
    const { data: emailData, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("id", emailQueueId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch email: ${fetchError.message}`);
    }

    if (!emailData) {
      throw new Error("Email not found in queue");
    }

    // Update status to sending
    await supabase
      .from("email_queue")
      .update({ 
        status: "sending",
        last_attempt_at: new Date().toISOString(),
        attempts: emailData.attempts + 1
      })
      .eq("id", emailQueueId);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: emailData.recipient_email,
        subject: emailData.subject,
        html: emailData.body.replace(/\n/g, "<br>")
      })
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const resendData = await resendResponse.json();

    // Update status to sent
    await supabase
      .from("email_queue")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString(),
        error_message: null
      })
      .eq("id", emailQueueId);

    return new Response(JSON.stringify({
      success: true,
      emailQueueId,
      resendId: resendData.id
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Email sending error:", error);

    // Try to update status to failed
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY
        );

        const { emailQueueId } = await req.json().catch(() => ({}));
        
        if (emailQueueId) {
          await supabase
            .from("email_queue")
            .update({ 
              status: "failed",
              error_message: error.message
            })
            .eq("id", emailQueueId);
        }
      } catch (updateError) {
        console.error("Failed to update email status:", updateError);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});