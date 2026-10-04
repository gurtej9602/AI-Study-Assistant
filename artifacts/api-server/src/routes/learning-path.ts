import { GoogleGenAI } from "@google/genai";
import { Router, type Request, type Response } from "express";
import { store, PRESET_TRACKS, type PathMilestone } from "../lib/store";
import { getBearerToken } from "./auth";

const router = Router();
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

// GET /api/learning-path/tracks - List all available tracks
router.get("/learning-path/tracks", (_req: Request, res: Response) => {
  const tracks = Object.entries(PRESET_TRACKS).map(([key, track]) => ({
    id: key,
    name: track.name,
    description: track.description,
    milestonesCount: track.milestones.length,
    topics: track.milestones.map((m) => m.topic),
  }));
  return res.json({ tracks });
});

// GET /api/learning-path - Get authenticated student's personalized learning path
router.get("/learning-path", (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Please log in to view your learning path." });
  }

  const student = store.getStudentByToken(token);
  if (!student) {
    return res.status(401).json({ error: "Session invalid or expired." });
  }

  const milestones = student.learningPath || [];
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  
  // Find current active milestone
  const upNext = milestones.find((m) => m.status === "up_next") || milestones.find((m) => m.status === "in_progress") || milestones[0];

  // Aggregate weak concepts across all milestones for targeted recommendations
  const allWeakConcepts = [...new Set(milestones.flatMap((m) => m.weakConcepts || []))];

  return res.json({
    studentId: student.id,
    studentName: student.name,
    grade: student.grade,
    track: student.track,
    customGoal: student.customGoal,
    progressPercent,
    completedCount,
    totalMilestones: milestones.length,
    upNext,
    milestones,
    weakConcepts: allWeakConcepts,
  });
});

// POST /api/learning-path/track - Change track or generate a custom AI roadmap
router.post("/learning-path/track", async (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Please log in to change your learning path." });
  }

  const student = store.getStudentByToken(token);
  if (!student) {
    return res.status(401).json({ error: "Session invalid or expired." });
  }

  const { track, customGoal } = req.body;

  if (track === "Custom" && customGoal && typeof customGoal === "string" && customGoal.trim().length >= 3) {
    // Generate AI curriculum tailored to student with Gemini
    try {
      const client = getGeminiClient();
      const prompt = `You are an expert curriculum designer. A student with learning level "${student.grade || "Beginner"}" wants a structured 5-step learning path for their goal: "${customGoal.trim()}".
Design exactly 5 sequential milestone topics that guide the student step-by-step from foundations to mastery.
Return ONLY valid JSON matching this schema:
{
  "milestones": [
    {
      "topic": "Concise topic title",
      "level": "Short level or subject descriptor",
      "description": "1 sentence explanation of why this step is essential and what the student will learn"
    }
  ]
}`;

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
        },
      });

      const text = response.text?.trim() || "{}";
      const parsed = JSON.parse(text) as { milestones: { topic: string; level: string; description: string }[] };

      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        const customMilestones: PathMilestone[] = parsed.milestones.map((m, index) => ({
          id: `custom-${index + 1}-${m.topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          topic: m.topic,
          level: m.level || "Custom Path",
          description: m.description,
          status: index === 0 ? "up_next" : "locked",
          sessionsCount: 0,
        }));

        const updated = store.updateStudentTrack(student.id, "Custom", customGoal.trim(), customMilestones);
        return res.json({ student: updated });
      }
    } catch (err) {
      console.error("Gemini failed to generate custom learning path, falling back to default:", err);
      // Fallback if Gemini fails
    }
  }

  // Preset track
  const selectedTrack = PRESET_TRACKS[track] ? track : "Biology & Life Sciences";
  const updated = store.updateStudentTrack(student.id, selectedTrack);

  return res.json({ student: updated });
});

export default router;
