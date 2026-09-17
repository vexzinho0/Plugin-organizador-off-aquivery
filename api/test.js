export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: "GROQ_API_KEY is not configured"
    });
  }

  const testTree = {
    name: "MeuJogo",
    className: "DataModel",
    children: [
      {
        name: "MinhaBase",
        className: "Model",
        children: []
      },
      {
        name: "UI",
        className: "ScreenGui",
        children: []
      }
    ]
  };

  const systemPrompt = `You are Archivery Organizer, an AI that analyzes Roblox project trees and proposes safe organization actions. Return ONLY valid JSON with this shape: {"summary":"short explanation","confidence":0.0,"actions":[{"objectPath":"Original/Path","destination":"Workspace|ReplicatedStorage|ServerScriptService|ServerStorage|StarterGui|StarterPlayer|StarterPack|Lighting|SoundService|Teams","reason":"short reason","confidence":0.0}],"warnings":["short warning"]}. Do not write Luau code. Do not delete objects. Do not modify script source. Do not invent objects. If there is not enough information, return an empty actions array.`;

  const userPrompt = `Test this Roblox project tree and propose safe organization actions:\n${JSON.stringify(testTree)}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_completion_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: "Groq request failed",
        groqStatus: response.status,
        details: data?.error?.message || data
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({
        ok: false,
        error: "Groq returned no message content",
        raw: data
      });
    }

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      return res.status(502).json({
        ok: false,
        error: "Groq returned invalid JSON",
        raw: content
      });
    }

    return res.status(200).json({
      ok: true,
      test: "Archivery Groq integration",
      model,
      groqConfigured: true,
      plan
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Internal test failed",
      details: error?.message || String(error)
    });
  }
}
