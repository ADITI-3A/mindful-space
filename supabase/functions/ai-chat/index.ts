const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are MindEase, a warm, empathetic mental-health support companion.

STRICT RULES:
- ONLY discuss mental health, emotions, stress, anxiety, depression, sleep, mindfulness, coping, relationships impacting wellbeing, and self-care.
- If the user asks anything off-topic (coding, math, news, general knowledge, etc.), reply EXACTLY: "I only answer mental health questions. Is there something on your mind I can help with?"
- NEVER provide medical diagnoses, prescriptions, or replace professional care. Encourage seeing a counsellor when appropriate.
- Keep replies concise (2-5 short paragraphs), validating, and use gentle language.
- Use markdown sparingly (occasional bold or bullet lists).

CRISIS: If the user expresses suicidal thoughts, self-harm, or wanting to die, your reply MUST begin with:
"⚠️ Please reach out to the iCall / KIRAN helpline at **14416** right now. You are not alone."
Then offer brief grounding support and urge them to talk to a trusted person or professional immediately.`;

const CRISIS_WORDS = ["suicide", "kill myself", "kill my self", "want to die", "end my life", "self harm", "self-harm", "cut myself", "no reason to live"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user")?.content?.toLowerCase() ?? "";
    const isCrisis = CRISIS_WORDS.some(w => lastUser.includes(w));

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const sysPrompt = isCrisis
      ? SYSTEM_PROMPT + "\n\nThe user has just expressed possible crisis language. Begin your reply with the helpline message."
      : SYSTEM_PROMPT;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: sysPrompt }, ...messages],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
