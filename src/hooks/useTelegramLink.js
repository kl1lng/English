import { useCallback, useEffect, useState } from "react";

const botName = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

// Telegram reminder link for the signed-in learner. Only available when the bot name is
// configured and the learner has an account.
// status: "off" (not configured) | "loading" | "unlinked" | "pending" | "linked" | "error".
export function useTelegramLink({ supabase, userId }) {
  const enabled = Boolean(botName && supabase && userId);
  const [status, setStatus] = useState(enabled ? "loading" : "off");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const { data, error } = await supabase
      .from("telegram_links")
      .select("chat_id, link_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return setStatus("error");
    if (data?.chat_id) setStatus("linked");
    else if (data?.link_token) setStatus("pending");
    else setStatus("unlinked");
  }, [enabled, supabase, userId]);

  useEffect(() => {
    setStatus(enabled ? "loading" : "off");
    refresh();
  }, [enabled, refresh]);

  const connect = useCallback(async () => {
    const { data, error } = await supabase.rpc("create_telegram_link");
    if (error || !data) return setStatus("error");
    setStatus("pending");
    window.open(`https://t.me/${botName}?start=${data}`, "_blank", "noopener");
  }, [supabase]);

  const disconnect = useCallback(async () => {
    const { error } = await supabase.rpc("unlink_telegram");
    if (error) return setStatus("error");
    setStatus("unlinked");
  }, [supabase]);

  return { status, connect, disconnect, refresh };
}
