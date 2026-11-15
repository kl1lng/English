import { dayKey } from "../src/lib/time.js";
import { messageFor, secretMatches, sendTelegram, serviceClient } from "../server/telegram.js";

// Daily reminder job (Vercel Cron). Vercel sends "Authorization: Bearer <CRON_SECRET>".
export default async function handler(request, response) {
  const bearer = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!secretMatches(bearer, process.env.CRON_SECRET))
    return response.status(401).json({ ok: false });
  const supabase = serviceClient();
  if (!supabase || !process.env.TELEGRAM_BOT_TOKEN)
    return response.status(503).json({ ok: false, error: "Reminders are not configured." });

  const today = dayKey();
  const { data: links, error } = await supabase
    .from("telegram_links")
    .select("user_id, chat_id, last_sent_on")
    .not("chat_id", "is", null)
    .limit(200);
  if (error) return response.status(500).json({ ok: false });

  let sent = 0;
  for (const link of links) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("data")
        .eq("id", link.user_id)
        .maybeSingle();
      const data = profile?.data || {};
      const practisedToday = (data.days || []).includes(today);
      const text = messageFor({ link, practisedToday, today, profile: data });
      if (!text) continue;
      const result = await sendTelegram(link.chat_id, text);
      if (result.ok) {
        sent += 1;
        await supabase.from("telegram_links").update({ last_sent_on: today }).eq("user_id", link.user_id);
      } else if (result.status === 403) {
        // The learner blocked the bot: stop trying.
        await supabase.from("telegram_links").delete().eq("user_id", link.user_id);
      }
    } catch (e) {
      console.error("Reminder failed:", e.message);
    }
  }
  return response.status(200).json({ ok: true, sent });
}
