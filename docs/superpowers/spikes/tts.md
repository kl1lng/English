# Spike: server voice for the speaking partner

Date: 2026-11-15. Question: should the partner's replies be spoken by a server voice instead of the browser voice?

## Facts checked (Cloudflare documentation, read 2026-11-15)
| Model | Price | Neurons | Notes |
|---|---|---|---|
| `@cf/myshell-ai/melotts` | $0.0002 per audio minute | 18.63 per minute | **Planned deprecation 2026-11-20**, MP3 output, `lang` parameter |
| `@cf/deepgram/aura-1` | $0.015 per 1,000 characters | 1,363.64 per 1,000 characters | |
| `@cf/deepgram/aura-2-en` | $0.030 per 1,000 characters | 2,727.27 per 1,000 characters | English only |

Free allowance: 10,000 neurons per day for the whole Workers AI account (shared with Whisper and the language model if they run on Cloudflare).

## What that means
- MeloTTS is cheap but is scheduled to be removed in five days, so it is not a base for a feature.
- Aura-1: about 7,300 characters a day are free. A reply is about 240 characters, so about 30 replies a day. One six-reply conversation is about 1,500 characters, about $0.02 if paid.
- Aura-2-en: half of that free volume, double the price per character.
- A server voice would need a daily quota per learner (like the conversation quota), a kill switch (`AI_TTS_ENABLED`) and a cache of repeated phrases (openings are fixed per scenario).

## Not measured
Latency, naturalness and the real size of the audio were **not measured**: that needs a call with your Cloudflare token. A ready script does it: `node scripts/tts-spike.mjs @cf/deepgram/aura-1` (then `@cf/deepgram/aura-2-en`). It prints time and size for five conversation replies and saves the audio in `.superpowers/tts-spike/` for listening. The request body for Aura models (`text`, `speaker`) is written from memory of the API and may need a small fix after the first run.

## Decision criteria
Adopt a server voice only if all hold: reply audio arrives within about 1.5 seconds, it sounds clearly better than the browser voices on the phones your learners use, and the free allowance covers the expected daily conversations or the cost is acceptable.

## Recommendation
Keep the browser voice for now. If you want a better voice, listen to Aura-1 and Aura-2-en samples (run the script once), choose by ear, then plan `api/tts.js` with quota, cache and the kill switch as a separate small task. Do not use MeloTTS.
