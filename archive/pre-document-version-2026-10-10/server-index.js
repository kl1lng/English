import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../src/lessons.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(
  process.env.KAZ_DATA_DIR || path.join(here, "data"),
);
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, "db.json");
const db = fs.existsSync(dbFile)
  ? JSON.parse(fs.readFileSync(dbFile, "utf8"))
  : { users: [], submissions: [], messages: [] };
const save = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
const app = express();
const tokens = new Map();
const chatRequests = new Map();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
const upload = multer({
  dest: path.join(dataDir, "audio"),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_, f, cb) => cb(null, f.mimetype.startsWith("audio/")),
});
const receiveAudio = (req, res, next) =>
  upload.single("audio")(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(tooLarge ? 413 : 400).json({
      error: tooLarge
        ? "This recording is too large. Please try again with a shorter clip."
        : "Please upload a supported audio recording.",
    });
  });
const hash = (password, salt = crypto.randomBytes(16).toString("hex")) =>
  new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (error, derived) =>
      error
        ? reject(error)
        : resolve({ salt, digest: derived.toString("hex") }),
    ),
  );
const auth = (req, res, next) => {
  const user = tokens.get(req.headers.authorization?.replace(/^Bearer /, ""));
  if (!user)
    return res.status(401).json({ error: "Please sign in to continue." });
  req.user = user;
  next();
};
const today = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Oral",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}`;
};
const yesterday = () => {
  const d = new Date(`${today()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return today(d);
};
const userSummary = (user) => {
  const done = [
    ...new Set(
      db.submissions.filter((s) => s.userId === user.id).map((s) => s.day),
    ),
  ].sort();
  let bestStreak = 0,
    run = 0,
    previous = "";
  for (const day of done) {
    const d = new Date(`${day}T12:00:00Z`);
    const prev = new Date(`${previous}T12:00:00Z`);
    const consecutive = previous && d - prev === 86400000;
    run = consecutive ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }
  let streak = 0,
    check = done.includes(today()) ? today() : yesterday();
  const doneSet = new Set(done);
  if (doneSet.has(check)) {
    while (doneSet.has(check)) {
      streak++;
      const d = new Date(`${check}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      check = today(d);
    }
  }
  return {
    id: user.id,
    name: user.name,
    grade: user.grade,
    school: user.school,
    completed: Math.min(30, done.length),
    completedToday: db.submissions.some(
      (s) => s.userId === user.id && s.day === today(),
    ),
    streak,
    bestStreak,
    days: done,
    submissions: db.submissions
      .filter((s) => s.userId === user.id)
      .map(({ audioPath, ...s }) => s),
  };
};
app.get("/api/health", (_, res) =>
  res.json({ ok: true, ai: Boolean(process.env.OPENAI_API_KEY) }),
);
app.get("/api/lessons", (_, res) => res.json(lessons));
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, grade, school, password } = req.body || {};
    if (
      !name?.trim() ||
      !grade ||
      !school?.trim() ||
      !password ||
      password.length < 6
    )
      return res.status(400).json({
        error:
          "Enter your name, class, school, and a password with at least 6 characters.",
      });
    if (
      db.users.some(
        (u) =>
          u.name.toLowerCase() === name.trim().toLowerCase() &&
          u.school.toLowerCase() === school.trim().toLowerCase(),
      )
    )
      return res.status(409).json({
        error:
          "An account with this name and school already exists. Please sign in.",
      });
    const credentials = await hash(password);
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      grade: String(grade),
      school: school.trim(),
      ...credentials,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    save();
    const token = crypto.randomUUID();
    tokens.set(token, user.id);
    res.json({ token, user: userSummary(user) });
  } catch {
    res.status(500).json({ error: "Could not create account." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { name, school, password } = req.body || {};
  const user = db.users.find(
    (u) =>
      u.name.toLowerCase() ===
        String(name || "")
          .trim()
          .toLowerCase() &&
      u.school.toLowerCase() ===
        String(school || "")
          .trim()
          .toLowerCase(),
  );
  if (!user)
    return res
      .status(401)
      .json({ error: "No account found for that name and school." });
  const entered = await hash(password || "", user.salt);
  if (
    entered.digest.length !== user.digest.length ||
    !crypto.timingSafeEqual(
      Buffer.from(entered.digest, "hex"),
      Buffer.from(user.digest, "hex"),
    )
  )
    return res
      .status(401)
      .json({ error: "That password does not match. Try again." });
  const token = crypto.randomUUID();
  tokens.set(token, user.id);
  res.json({ token, user: userSummary(user) });
});
app.get("/api/me", auth, (req, res) =>
  res.json(userSummary(db.users.find((u) => u.id === req.user))),
);
app.post("/api/submissions", auth, receiveAudio, async (req, res) => {
  const index = Number(req.body.lessonIndex);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= lessons.length ||
    !req.file
  )
    return res
      .status(400)
      .json({ error: "Choose a lesson and record an audio answer first." });
  const user = db.users.find((u) => u.id === req.user);
  const prior = db.submissions.filter((s) => s.userId === req.user);
  const priorDays = new Set(prior.map((s) => s.day));
  const todaySubmission = prior.find((s) => s.day === today());
  const nextLesson = Math.min(priorDays.size, 29);
  if (priorDays.size >= 30) {
    fs.unlink(req.file.path, () => {});
    return res.status(409).json({
      error:
        "You’ve completed all 30 speaking cards. Your certificate is ready!",
    });
  }
  if (todaySubmission) {
    fs.unlink(req.file.path, () => {});
    return res.status(409).json({
      error:
        "You’ve completed today’s card. Your next speaking card opens tomorrow.",
    });
  }
  if (index !== nextLesson) {
    fs.unlink(req.file.path, () => {});
    return res.status(409).json({
      error: "Complete the next card in your journey before moving ahead.",
    });
  }
  const duration = Number(req.body.duration || 0);
  if (duration < 60 || duration > 120) {
    fs.unlink(req.file.path, () => {});
    return res
      .status(400)
      .json({ error: "Speaking answers should be between 1 and 2 minutes." });
  }
  let transcript = "",
    feedback,
    ai = false;
  try {
    if (process.env.OPENAI_API_KEY && req.body.aiConsent === "true") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const file = fs.createReadStream(req.file.path);
      const transcription = await client.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: "en",
      });
      transcript = transcription.text;
      const review = await client.chat.completions.create({
        model: process.env.OPENAI_COACH_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a kind English speaking coach for school students aged 12-16. Assess only what can be inferred from the transcript: relevance, vocabulary choice, grammar, and organisation. Mention fluency only cautiously and only from text evidence. Never claim to hear or score pronunciation. Never ask for personal information. Give one short overall comment, two practical tips, and one improved example sentence. Return JSON: {overall:string,tips:string[],example:string}.",
          },
          {
            role: "user",
            content: `Prompt: ${lessons[index].prompt}\nStudent transcript: ${transcript}`,
          },
        ],
      });
      const result = JSON.parse(review.choices[0].message.content);
      if (
        typeof result.overall !== "string" ||
        !Array.isArray(result.tips) ||
        typeof result.example !== "string"
      )
        throw new Error("AI response did not match the feedback schema.");
      feedback = {
        overall: result.overall.slice(0, 500),
        tips: result.tips
          .filter((t) => typeof t === "string")
          .slice(0, 3)
          .map((t) => t.slice(0, 220)),
        example: result.example.slice(0, 300),
        ai: true,
      };
      ai = true;
    }
  } catch (error) {
    console.error("AI feedback unavailable:", error.message);
  }
  if (!feedback) {
    const message =
      process.env.OPENAI_API_KEY && req.body.aiConsent !== "true"
        ? "Your recording is saved. AI feedback stays off until you have permission from a parent or teacher."
        : "Your recording is saved. Add an OpenAI API key to enable transcript-based feedback.";
    feedback = {
      overall: message,
      tips: [
        "Try to explain one idea with a reason or example.",
        "Use two or three of today’s new vocabulary words.",
      ],
      example:
        "This place is famous for its beautiful scenery and rich history.",
    };
  }
  const item = {
    id: crypto.randomUUID(),
    userId: req.user,
    lessonIndex: index,
    day: today(),
    submittedAt: new Date().toISOString(),
    duration,
    aiConsent: ai,
    feedback,
  };
  db.submissions.push(item);
  save();
  fs.unlink(req.file.path, () => {});
  res.json({
    submission: { ...item, userId: undefined },
    user: userSummary(user),
    firstToday: true,
  });
});
app.post(
  "/api/chat",
  (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const recent = (chatRequests.get(key) || []).filter((t) => now - t < 60000);
    if (recent.length >= 20)
      return res
        .status(429)
        .json({ error: "Give your buddy a moment, then try again." });
    recent.push(now);
    chatRequests.set(key, recent);
    next();
  },
  async (req, res) => {
    const message = String(req.body.message || "")
      .trim()
      .slice(0, 500);
    if (!message)
      return res.status(400).json({ error: "Write a message first." });
    let answer;
    try {
      if (process.env.OPENAI_API_KEY) {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a friendly English tutor for Kazakhstani school students aged 12-16. Help translate Kazakh or Russian into natural, simple English, explain vocabulary simply, or improve sentences. Be concise and encouraging.",
            },
            { role: "user", content: message },
          ],
        });
        answer = completion.choices[0].message.content;
      }
    } catch (e) {
      console.error("Chat unavailable:", e.message);
    }
    if (!answer) {
      const translations = {
        "Бұл жер өте әдемі": "This place is very beautiful.",
        "Бұл жер өте әдемі.": "This place is very beautiful.",
        "это место очень красивое": "This place is very beautiful.",
        "Бұл жер": "This place",
        әдемі: "beautiful",
        "тарихи ескерткіш": "historical monument",
      };
      answer =
        translations[message.trim()] ||
        `You can say: “${message}”\n\nTry this useful pattern: “This place is famous for…” Then add one detail about what makes it special.`;
    }
    if (req.user) {
      db.messages.push({
        id: crypto.randomUUID(),
        userId: req.user,
        question: message,
        answer,
        createdAt: new Date().toISOString(),
      });
      save();
    }
    res.json({ answer });
  },
);
const distDir = path.resolve(here, "../dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_, res) =>
    res.sendFile(path.join(distDir, "index.html")),
  );
}
const port = Number(process.env.PORT || 3001);
app.listen(port, () =>
  console.log(`Discover Kazakhstan API ready on http://localhost:${port}`),
);
