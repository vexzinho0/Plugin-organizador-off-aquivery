const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are Archivery Organizer, an AI that plans safe Roblox Studio Lite project organization.

You receive a JSON tree describing Instances in a Roblox project. Do NOT write or execute Luau code. Do NOT invent objects that were not provided. Return ONLY valid JSON.

Your job is to propose safe moves for existing objects when their likely destination is clear. Prefer minimal changes. Never delete objects. Never modify script source. Never move an object when the destination is uncertain.

Allowed destination roots are only:
- Workspace
- ReplicatedStorage
- ServerScriptService
- ServerStorage
- StarterGui
- StarterPlayer
- StarterPack
- Lighting
- SoundService
- Teams

Return exactly this shape:
{
  "summary": "short explanation",
  "confidence": 0.0,
  "actions": [
    {
      "objectPath": "Original/Path/To/Object",
      "destination": "ReplicatedStorage",
      "reason": "short reason",
      "confidence": 0.0
    }
  ],
  "warnings": ["short warning"]
}

Only include actions you can justify from the supplied tree. `;

function send(res, status, body) {
  res.status(status).json(body);
}

function sanitizeTree(tree) {
  if (!tree || typeof tree !== "object") return null;
  const json = JSON.stringify(tree);
  if (json.length > 120000) return null;
  return tree;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!process.env.GROQ_API_KEY) return send(res, 500, { error: "GROQ_API_KEY is not configured" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const tree = sanitizeTree(body?.tree);
    if (!tree) return send(res, 400, { error: "Invalid or oversized tree" });

    const userPrompt = `Analyze this Roblox project tree and produce the organization plan:\n\n${JSON.stringify(tree)}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_completion_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      return send(res, groqResponse.status, {
        error: "Groq request failed",
        details: data?.error?.message || "Unknown Groq error"
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return send(res, 502, { error: "Groq returned no plan" });

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      return send(res, 502, { error: "AI returned invalid JSON" });
    }

    return send(res, 200, {
      ok: true,
      model: MODEL,
      plan
    });
  } catch (error) {
    return send(res, 500, {
      error: "Internal server error",
      details: error?.message || "Unknown error"
    });
  }
};
