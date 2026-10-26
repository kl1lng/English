import multer from "multer";
import { lessons } from "../src/lessons.js";
import { createCloudflareSpeakingFeedback } from "../server/cloudflare-ai.js";

export const config = { api: { bodyParser: false } };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_request, file, done) =>
    done(null, file.mimetype.startsWith("audio/")),
});
const requestsByIp = new Map();

function receiveAudio(request, response) {
  return new Promise((resolve, reject) =>
    upload.single("audio")(request, response, (error) =>
      error ? reject(error) : resolve(),
    ),
  );
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to send a recording." });
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN)
    return response
      .status(503)
      .json({ error: "Cloudflare speech feedback is not configured yet." });

  const ip = String(request.headers["x-forwarded-for"] || "unknown")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter((at) => now - at < 60000);
  if (recent.length >= 30)
    return response.status(429).json({ error: "Please wait before sending another recording." });
  recent.push(now);
  requestsByIp.set(ip, recent);

  try {
    await receiveAudio(request, response);
  } catch (error) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return response.status(tooLarge ? 413 : 400).json({
      error: tooLarge
        ? "This recording is too large. Please try a shorter clip."
        : "Please upload a supported audio recording.",
    });
  }

  const index = Number(request.body?.lessonIndex);
  const duration = Number(request.body?.duration);
  const lesson = lessons[index];
  if (!request.file || !lesson)
    return response.status(400).json({ error: "Choose a lesson and record an answer first." });
  if (request.body?.aiConsent !== "true")
    return response.status(403).json({ error: "Adult permission is required before AI processing." });
  if (!Number.isFinite(duration) || duration < 1 || duration > lesson.maxDurationSeconds)
    return response.status(400).json({ error: "The recording duration is outside this lesson’s limit." });

  try {
    const result = await createCloudflareSpeakingFeedback({
      audio: request.file.buffer,
      duration,
      lesson,
    });
    return response.status(200).json(result);
  } catch (error) {
    console.error("Cloudflare speech feedback unavailable:", error.message);
    return response.status(502).json({
      error: "Cloudflare could not process this recording. Please try again later.",
    });
  }
}
