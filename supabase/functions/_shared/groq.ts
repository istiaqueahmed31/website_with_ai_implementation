const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(
  messages: Array<{ role: string; content: string }>,
  tools?: unknown[]
) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  const model =
    Deno.env.get("AI_MODEL") || "qwen/qwen3.6-27b";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    reasoning_effort: "none",
    resoning_format: "hidden",
    temperature: 0.7,
    top_p: 0.8,
    max_completion_tokens: 700,
  };

  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  return await response.json();
}