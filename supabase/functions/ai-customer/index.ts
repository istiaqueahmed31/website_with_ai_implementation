import { callGroq } from "../_shared/groq.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { CUSTOMER_SYSTEM_PROMPT } from "../_shared/ai-prompts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message is too long" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const result = await callGroq([
      {
        role: "system",
        content: CUSTOMER_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: message,
      },
    ]);

    const reply =
      result.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: "AI service temporarily unavailable",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});