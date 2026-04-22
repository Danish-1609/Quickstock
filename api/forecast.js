export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { products } = req.body;
  if (!products) return res.status(400).json({ error: "Missing products data" });

  const today = new Date();
  const month = today.toLocaleString("en-IN", { month: "long" });

  const prompt = `You are an expert AI inventory manager for Indian kirana (grocery) stores.
Today is ${today.toDateString()}, month: ${month}.

Inventory data:
${JSON.stringify(products, null, 2)}

Tasks:
1. For each product, provide: reorderQty (integer), urgency ("critical"/"warning"/"ok"), festivalAlert (string or null), revenueRisk (number in INR for 7 days if stocked out), insight (1 sentence in simple English).
2. Give a 2-sentence overall store summary.
3. Mention any upcoming Indian festivals in ${month} that could spike demand.

Return ONLY valid JSON in this exact shape, no markdown:
{
  "summary": "...",
  "festivalNote": "...",
  "items": [
    { "name": "...", "reorderQty": 0, "urgency": "ok", "festivalAlert": null, "revenueRisk": 0, "insight": "..." }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || "Claude API error" });
    }

    const data = await response.json();
    const text = data.content[0].text.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
