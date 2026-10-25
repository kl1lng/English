const translations = {
  "Бұл жер өте әдемі": "This place is very beautiful.",
  "Бұл жер өте әдемі.": "This place is very beautiful.",
  "это место очень красивое": "This place is very beautiful.",
  "Бұл жер": "This place",
  әдемі: "beautiful",
  "тарихи ескерткіш": "historical monument",
};

function demoAnswer(message) {
  const lookup = message.toLocaleLowerCase();
  return (
    translations[lookup] ||
    `You can say: “${message}”\n\nTry this useful pattern: “This place is famous for…” Then add one detail about what makes it special.`
  );
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to send a message." });
  }

  const message = String(request.body?.message || "")
    .trim()
    .slice(0, 500);
  if (!message)
    return response.status(400).json({ error: "Write a message first." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return response.status(200).json({ answer: demoAnswer(message) });

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly English tutor for Kazakhstani school students aged 12-16. Help translate Kazakh or Russian into natural, simple English, explain vocabulary simply, or improve sentences. Be concise and encouraging.",
        },
        { role: "user", content: message },
      ],
    });
    const answer = completion.choices[0]?.message?.content?.trim();
    return response.status(200).json({ answer: answer || demoAnswer(message) });
  } catch (error) {
    console.error("Chat unavailable:", error.message);
    return response.status(200).json({ answer: demoAnswer(message) });
  }
}
