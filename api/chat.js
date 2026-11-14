import { lessons } from "../src/lessons.js";
import { getRequestUser } from "../server/auth.js";
import { consume, dailyLimit } from "../server/usage.js";

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

  const user = await getRequestUser(request);
  if (!user)
    return response.status(401).json({ error: "Please sign in first." });
  if (user.userId && !(await consume(user.token, "chat", dailyLimit("DAILY_CHAT_LIMIT", 60))))
    return response
      .status(429)
      .json({ error: "You have reached today’s limit for the helper. Please try again tomorrow." });

  const message = String(request.body?.message || "")
    .trim()
    .slice(0, 500);
  if (!message)
    return response.status(400).json({ error: "Write a message first." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return response.status(200).json({ answer: demoAnswer(message) });

  try {
    const lesson = lessons[Number(request.body?.lessonIndex)];
    const lessonContext = lesson
      ? ` The learner is currently studying the lesson "${lesson.title}" with these target words: ${lesson.words
          .map((w) => w.term)
          .join(", ")}. Prefer examples about this topic when it fits.`
      : "";
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly English tutor for adult learners in Kazakhstan (level B1-B2). Help translate Kazakh or Russian into natural, simple English, explain vocabulary simply, or improve sentences. Be concise and encouraging." +
            lessonContext,
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
