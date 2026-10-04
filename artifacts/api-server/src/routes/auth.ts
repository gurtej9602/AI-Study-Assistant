import { Router, type Request, type Response } from "express";
import { store } from "../lib/store";

const router = Router();

// Helper to extract bearer token
export function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  // Also check cookies or query params if any
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return undefined;
}

// POST /api/auth/register
router.post("/auth/register", (req: Request, res: Response) => {
  const { username, password, name, grade, track, customGoal } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }

  if (!password || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long." });
  }

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Please enter your name." });
  }

  const existing = store.findStudentByUsername(username);
  if (existing) {
    return res.status(409).json({ error: "This username is already taken. Please choose another or sign in." });
  }

  const student = store.createStudent({
    username,
    password,
    name,
    grade,
    track,
    customGoal,
  });

  const token = store.createSessionToken(student.id);

  // Return student without security hashes
  const { passwordHash, salt, ...safeStudent } = student;
  return res.status(201).json({
    student: safeStudent,
    token,
  });
});

// POST /api/auth/login
router.post("/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Please provide both username and password." });
  }

  const student = store.findStudentByUsername(username);
  if (!student) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const computedHash = store.hashPassword(password, student.salt);
  if (computedHash !== student.passwordHash) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = store.createSessionToken(student.id);
  const { passwordHash, salt, ...safeStudent } = student;

  return res.json({
    student: safeStudent,
    token,
  });
});

// GET /api/auth/me
router.get("/auth/me", (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const student = store.getStudentByToken(token);
  if (!student) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }

  const { passwordHash, salt, ...safeStudent } = student;
  const sessions = store.getStudentSessions(student.id);

  return res.json({
    student: safeStudent,
    sessionsCount: sessions.length,
  });
});

// POST /api/auth/logout
router.post("/auth/logout", (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    store.revokeToken(token);
  }
  return res.json({ success: true });
});

// POST /api/auth/demo
router.post("/auth/demo", (_req: Request, res: Response) => {
  const demoStudent = store.findStudentByUsername("alex");
  if (!demoStudent) {
    return res.status(500).json({ error: "Demo student could not be initialized." });
  }

  const token = store.createSessionToken(demoStudent.id);
  const { passwordHash, salt, ...safeStudent } = demoStudent;

  return res.json({
    student: safeStudent,
    token,
  });
});

export default router;
