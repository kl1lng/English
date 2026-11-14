import { chatIdOf, parseStart, secretMatches, sendTelegram, serviceClient } from "../server/telegram.js";

// Telegram webhook. Telegram sends the secret in a header that we set when registering the
// webhook. The only thing it can do here is link a chat to a learner with a one-time token.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false });
  }
  if (!secretMatches(request.headers["x-telegram-bot-api-secret-token"], process.env.TELEGRAM_WEBHOOK_SECRET))
    return response.status(401).json({ ok: false });

  const update = request.body;
  const start = parseStart(update);
  const chatId = chatIdOf(update);
  try {
    if (start) {
      const supabase = serviceClient();
      if (!supabase) throw new Error("Database access is not configured.");
      const { data, error } = await supabase
        .from("telegram_links")
        .update({ chat_id: start.chatId, link_token: null })
        .eq("link_token", start.token)
        .select("user_id");
      if (error) throw error;
      await sendTelegram(
        start.chatId,
        data?.length
          ? "Connected. I will remind you if you have not practised English today. To stop, disconnect in the app."
          : "This link has expired. Open the app and press Connect Telegram again.",
      );
    } else if (chatId) {
      await sendTelegram(chatId, "Open the app and press Connect Telegram to link this chat for daily reminders.");
    }
  } catch (error) {
    console.error("Telegram webhook error:", error.message);
  }
  // Always answer 200 so Telegram does not retry old updates.
  return response.status(200).json({ ok: true });
}
