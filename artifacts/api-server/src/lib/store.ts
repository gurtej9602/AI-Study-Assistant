import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PathMilestone = {
  id: string;
  topic: string;
  level: string;
  description: string;
  status: "completed" | "in_progress" | "up_next" | "locked";
  accuracy?: number;
  sessionsCount: number;
  lastStudied?: string;
  weakConcepts?: string[];
};

export type Student = {
  id: string;
  username: string;
  name: string;
  grade: string;
  track: string;
  customGoal?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  learningPath: PathMilestone[];
};

export type StoredSession = {
  id: string;
  studentId: string;
  topic: string;
  level: string;
  createdAt: string;
  explanation: string;
  keyConcepts: { title: string; detail: string }[];
  examples: { title: string; detail: string }[];
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    concept: string;
  }[];
  answers: {
    questionIndex: number;
    selectedIndex: number;
    correct: boolean;
    feedback?: string;
    misconception?: string;
    weakConcept?: string;
  }[];
  accuracy: number;
  followUp?: boolean;
  source?: "gemini" | "sample";
};

export const PRESET_TRACKS: Record<string, { name: string; description: string; milestones: Omit<PathMilestone, "id" | "status" | "sessionsCount">[] }> = {
  "Biology & Life Sciences": {
    name: "Biology & Life Sciences",
    description: "From cellular kitchens to genetics and living ecosystems.",
    milestones: [
      { topic: "Photosynthesis", level: "Biology", description: "How plants convert light, water, and CO2 into glucose and oxygen." },
      { topic: "Cellular Respiration", level: "Biology", description: "How cells break down glucose to generate ATP energy." },
      { topic: "DNA & Genetics", level: "Biology", description: "The double helix, gene expression, and how traits are passed on." },
      { topic: "Mitosis & Cell Division", level: "Biology", description: "Cellular reproduction, chromosomes, and tissue growth." },
      { topic: "Ecology & Food Webs", level: "Biology", description: "Energy pyramids, trophic levels, and ecosystem balance." },
    ],
  },
  "Algebra & Mathematics": {
    name: "Algebra & Mathematics",
    description: "Core algebraic thinking, balances, linear functions, and graphs.",
    milestones: [
      { topic: "Linear equations", level: "Algebra", description: "Balancing equations and isolating variables with inverse operations." },
      { topic: "Systems of Linear Equations", level: "Algebra", description: "Solving multiple intersecting linear relationships with substitution and elimination." },
      { topic: "Quadratic Equations", level: "Algebra", description: "Factoring parabolas, the quadratic formula, and finding roots." },
      { topic: "Functions and Graphs", level: "Algebra", description: "Input-output mappings, domain, range, and coordinate planes." },
      { topic: "Exponents & Polynomials", level: "Algebra", description: "Rules of exponents, scientific notation, and polynomial manipulation." },
    ],
  },
  "Earth & Space Science": {
    name: "Earth & Space Science",
    description: "Planetary systems, geological forces, and atmospheric patterns.",
    milestones: [
      { topic: "The water cycle", level: "Earth science", description: "Evaporation, condensation, precipitation, and global collection." },
      { topic: "Plate Tectonics", level: "Earth science", description: "Continental drift, fault lines, earthquakes, and volcanic activity." },
      { topic: "The Rock Cycle", level: "Earth science", description: "Igneous, sedimentary, and metamorphic transformations over deep time." },
      { topic: "Atmosphere and Weather Systems", level: "Earth science", description: "High and low pressure, jet streams, humidity, and cloud formations." },
      { topic: "The Solar System & Gravity", level: "Space science", description: "Orbital mechanics, Kepler's laws, planets, and celestial bodies." },
    ],
  },
  "Computer Science & Python": {
    name: "Computer Science & Python",
    description: "Algorithmic thinking, programming fundamentals, and problem-solving.",
    milestones: [
      { topic: "Variables and Data Types", level: "Computer Science", description: "Numbers, strings, booleans, and how data is stored in memory." },
      { topic: "Conditionals and Logic", level: "Computer Science", description: "Branching code with if/else statements and boolean logic." },
      { topic: "Loops and Iteration", level: "Computer Science", description: "Repeating operations effectively with for and while loops." },
      { topic: "Functions and Scope", level: "Computer Science", description: "Creating reusable modular blocks of code and understanding variable scope." },
      { topic: "Data Structures: Lists and Dictionaries", level: "Computer Science", description: "Organizing collections and fast key-value lookups." },
    ],
  },
};

export function buildDefaultMilestones(trackName: string): PathMilestone[] {
  const track = PRESET_TRACKS[trackName] || PRESET_TRACKS["Biology & Life Sciences"];
  return track.milestones.map((m, index) => ({
    id: `m-${index + 1}-${m.topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    topic: m.topic,
    level: m.level,
    description: m.description,
    status: index === 0 ? "up_next" : "locked",
    sessionsCount: 0,
  }));
}

// Persistent Storage
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const dbFilePath = path.join(dataDir, "store.json");

type DatabaseSchema = {
  students: Student[];
  sessions: StoredSession[];
  tokens: { token: string; studentId: string; expiresAt: string }[];
};

class Store {
  private data: DatabaseSchema = {
    students: [],
    sessions: [],
    tokens: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.seedDemoStudent();
        this.save();
      }
    } catch {
      // In-memory fallback
      this.seedDemoStudent();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist database to file, continuing in-memory:", err);
    }
  }

  private seedDemoStudent() {
    if (this.data.students.length > 0) return;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword("demo123", salt);
    const demoStudent: Student = {
      id: "student-demo-1",
      username: "alex",
      name: "Alex Rivera",
      grade: "High School (10th)",
      track: "Biology & Life Sciences",
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      learningPath: [
        {
          id: "m-1-photosynthesis",
          topic: "Photosynthesis",
          level: "Biology",
          description: "How plants convert light, water, and CO2 into glucose and oxygen.",
          status: "completed",
          accuracy: 100,
          sessionsCount: 1,
          lastStudied: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "m-2-cellular-respiration",
          topic: "Cellular Respiration",
          level: "Biology",
          description: "How cells break down glucose to generate ATP energy.",
          status: "up_next",
          sessionsCount: 0,
        },
        {
          id: "m-3-dna-genetics",
          topic: "DNA & Genetics",
          level: "Biology",
          description: "The double helix, gene expression, and how traits are passed on.",
          status: "locked",
          sessionsCount: 0,
        },
        {
          id: "m-4-mitosis",
          topic: "Mitosis & Cell Division",
          level: "Biology",
          description: "Cellular reproduction, chromosomes, and tissue growth.",
          status: "locked",
          sessionsCount: 0,
        },
        {
          id: "m-5-ecology",
          topic: "Ecology & Food Webs",
          level: "Biology",
          description: "Energy pyramids, trophic levels, and ecosystem balance.",
          status: "locked",
          sessionsCount: 0,
        },
      ],
    };

    const demoSession: StoredSession = {
      id: "demo-session-1",
      studentId: demoStudent.id,
      topic: "Photosynthesis",
      level: "Biology",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      explanation: "Photosynthesis is how plants make their own food in chloroplasts.",
      keyConcepts: [
        { title: "Chloroplasts capture light", detail: "Chlorophyll absorbs photon energy." },
        { title: "Glucose stores energy", detail: "Glucose fuels growth and repair." },
        { title: "Oxygen is released", detail: "Split water molecules release oxygen." },
      ],
      examples: [
        { title: "Sunny windowsill", detail: "Plentiful light drives efficient photosynthesis." },
      ],
      questions: [
        {
          prompt: "Which three ingredients does a plant use for photosynthesis?",
          options: ["Oxygen, glucose, soil", "Sunlight, water, carbon dioxide", "Chlorophyll, oxygen, glucose", "Sunlight, oxygen, soil"],
          correctIndex: 1,
          explanation: "Sunlight provides energy, water and carbon dioxide provide raw materials.",
          concept: "Chloroplasts capture light",
        },
      ],
      answers: [
        {
          questionIndex: 0,
          selectedIndex: 1,
          correct: true,
          feedback: "Correct! Sunlight supplies energy while water and CO2 are reactants.",
        },
      ],
      accuracy: 100,
      source: "gemini",
    };

    this.data.students.push(demoStudent);
    this.data.sessions.push(demoSession);
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString("hex");
  }

  public findStudentByUsername(username: string): Student | undefined {
    return this.data.students.find(
      (s) => s.username.toLowerCase() === username.trim().toLowerCase(),
    );
  }

  public findStudentById(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  public createStudent(params: {
    username: string;
    password: string;
    name: string;
    grade?: string;
    track?: string;
    customGoal?: string;
    customMilestones?: PathMilestone[];
  }): Student {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword(params.password, salt);
    const track = params.track || "Biology & Life Sciences";
    const learningPath = params.customMilestones && params.customMilestones.length > 0
      ? params.customMilestones
      : buildDefaultMilestones(track);

    const student: Student = {
      id: crypto.randomUUID(),
      username: params.username.trim().toLowerCase(),
      name: params.name.trim(),
      grade: params.grade || "Ready to Learn",
      track,
      customGoal: params.customGoal,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      learningPath,
    };

    this.data.students.push(student);
    this.save();
    return student;
  }

  public createSessionToken(studentId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    this.data.tokens.push({ token, studentId, expiresAt });
    this.save();
    return token;
  }

  public getStudentByToken(token: string): Student | undefined {
    if (!token) return undefined;
    const session = this.data.tokens.find(
      (t) => t.token === token && new Date(t.expiresAt) > new Date(),
    );
    if (!session) return undefined;
    return this.findStudentById(session.studentId);
  }

  public revokeToken(token: string): void {
    this.data.tokens = this.data.tokens.filter((t) => t.token !== token);
    this.save();
  }

  public updateStudentTrack(studentId: string, track: string, customGoal?: string, customMilestones?: PathMilestone[]): Student | undefined {
    const student = this.findStudentById(studentId);
    if (!student) return undefined;

    student.track = track;
    student.customGoal = customGoal;
    student.learningPath = customMilestones && customMilestones.length > 0
      ? customMilestones
      : buildDefaultMilestones(track);

    this.save();
    return student;
  }

  public recordStudySession(sessionData: Omit<StoredSession, "id">): StoredSession {
    const session: StoredSession = {
      ...sessionData,
      id: crypto.randomUUID(),
    };
    this.data.sessions.unshift(session);

    // Automatically update the student's learning path milestone
    const student = this.findStudentById(session.studentId);
    if (student) {
      const normalizedTopic = session.topic.trim().toLowerCase();
      let milestoneIndex = student.learningPath.findIndex(
        (m) => m.topic.trim().toLowerCase() === normalizedTopic,
      );

      // If this topic isn't in their current milestones, check if it fits or append/update
      if (milestoneIndex === -1) {
        // Try substring match
        milestoneIndex = student.learningPath.findIndex(
          (m) => normalizedTopic.includes(m.topic.toLowerCase()) || m.topic.toLowerCase().includes(normalizedTopic),
        );
      }

      if (milestoneIndex !== -1) {
        const milestone = student.learningPath[milestoneIndex];
        milestone.sessionsCount = (milestone.sessionsCount || 0) + 1;
        milestone.lastStudied = session.createdAt;
        milestone.accuracy = session.accuracy;

        const weakConcepts = session.answers
          .filter((a) => !a.correct)
          .map((a) => a.weakConcept)
          .filter((c): c is string => Boolean(c));

        milestone.weakConcepts = [...new Set([...(milestone.weakConcepts || []), ...weakConcepts])];

        if (session.accuracy >= 60) {
          milestone.status = "completed";
          // Unlock the next milestone
          const nextMilestone = student.learningPath[milestoneIndex + 1];
          if (nextMilestone && nextMilestone.status === "locked") {
            nextMilestone.status = "up_next";
          }
        } else {
          milestone.status = "in_progress";
        }
      }

      this.save();
    }

    this.save();
    return session;
  }

  public getStudentSessions(studentId: string): StoredSession[] {
    return this.data.sessions.filter((s) => s.studentId === studentId);
  }

  public deleteStudentSession(studentId: string, sessionId: string): boolean {
    const prevLength = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(
      (s) => !(s.studentId === studentId && s.id === sessionId),
    );
    const deleted = this.data.sessions.length !== prevLength;
    if (deleted) this.save();
    return deleted;
  }
}

export const store = new Store();
