// Add this block - Declare Deno types for environment variables
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SEND_EMAIL_FUNCTION_URL = Deno.env.get("SEND_EMAIL_FUNCTION_URL") || 
  `${SUPABASE_URL}/functions/v1/send-email`;

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
    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get pending emails (max 10 per batch)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3) // Max 3 attempts
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch pending emails: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No pending emails to process",
        processed: 0
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (email) => {
        try {
          const response = await fetch(SEND_EMAIL_FUNCTION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              emailQueueId: email.id
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Send email failed: ${errorData}`);
          }

          return await response.json();
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error);
          throw error;
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return new Response(JSON.stringify({
      success: true,
      processed: pendingEmails.length,
      successful,
      failed,
      results: results.map(r => ({
        status: r.status,
        value: r.status === "fulfilled" ? r.value : undefined,
        reason: r.status === "rejected" ? r.reason?.message : undefined
      }))
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Queue processing error:", error);

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