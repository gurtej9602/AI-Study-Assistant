export type StudySession = {
  id: string;
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
  followUp?: boolean;
  source?: 'gemini' | 'sample';
};

export const STORAGE_KEY = 'study-assistant-sessions';

export const presets = [
  { topic: 'Photosynthesis', subtitle: 'How plants turn light into life', level: 'Biology', symbol: 'leaf' },
  { topic: 'Linear equations', subtitle: 'Find the value hiding in plain sight', level: 'Algebra', symbol: 'math' },
  { topic: 'The water cycle', subtitle: 'Water’s journey through our world', level: 'Earth science', symbol: 'water' },
];

const lessonContent: Record<string, Omit<StudySession, 'id' | 'createdAt' | 'level' | 'answers'>> = {
  Photosynthesis: {
    topic: 'Photosynthesis',
    explanation:
      'Photosynthesis is how plants make their own food. In the leaves, tiny structures called chloroplasts capture energy from sunlight. The plant uses that energy to combine water from the soil with carbon dioxide from the air, making glucose (a sugar) and releasing oxygen. Think of a leaf as a small solar-powered kitchen: sunlight supplies the energy, while water and carbon dioxide are the ingredients.',
    keyConcepts: [
      { title: 'Chloroplasts capture light', detail: 'These structures inside plant cells contain chlorophyll, the green pigment that absorbs light energy.' },
      { title: 'Glucose stores energy', detail: 'The plant uses glucose to grow, repair cells, and fuel other processes. It is the useful food made by photosynthesis.' },
      { title: 'Oxygen is released', detail: 'When water molecules are split during the process, oxygen leaves the plant through tiny pores in its leaves.' },
    ],
    examples: [
      { title: 'A sunny windowsill', detail: 'A houseplant near a window receives light to power photosynthesis. If light is limited, the plant usually makes glucose more slowly.' },
      { title: 'A garden after rain', detail: 'Roots take up water, and leaves take in carbon dioxide. When sunlight returns, the plant has the ingredients it needs to make glucose.' },
    ],
    questions: [
      { prompt: 'Which three ingredients or inputs does a plant use for photosynthesis?', options: ['Oxygen, glucose, and soil', 'Sunlight, water, and carbon dioxide', 'Chlorophyll, oxygen, and glucose', 'Sunlight, oxygen, and soil'], correctIndex: 1, explanation: 'Sunlight supplies energy, while water and carbon dioxide provide the materials used to make glucose.', concept: 'Chloroplasts capture light' },
      { prompt: 'What useful sugar does photosynthesis produce?', options: ['Glucose', 'Chlorophyll', 'Carbon dioxide', 'Water vapor'], correctIndex: 0, explanation: 'Glucose is the energy-rich sugar the plant can use or store.', concept: 'Glucose stores energy' },
      { prompt: 'Which gas is released as a product of photosynthesis?', options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Hydrogen'], correctIndex: 2, explanation: 'Oxygen is released into the air, which is one reason photosynthesis matters to life beyond plants.', concept: 'Oxygen is released' },
    ],
  },
  'Linear equations': {
    topic: 'Linear equations',
    explanation:
      'A linear equation is a statement that two expressions are equal, with a variable whose highest power is one. Solving it means finding the value that keeps the equality true. Imagine a balanced scale: whatever you do to one side, do to the other. Undo addition or subtraction first, then undo multiplication or division, until the variable stands alone.',
    keyConcepts: [
      { title: 'Equality is a balance', detail: 'The equals sign says both sides have the same value. Keep that relationship by performing the same operation on each side.' },
      { title: 'Undo operations in reverse', detail: 'Use inverse operations: subtraction undoes addition, and division undoes multiplication.' },
      { title: 'Check by substituting', detail: 'Put your answer back into the original equation. If both sides match, the solution works.' },
    ],
    examples: [
      { title: 'Undo addition', detail: 'For x + 5 = 12, subtract 5 from both sides. That leaves x = 7.' },
      { title: 'Undo multiplication', detail: 'For 3x = 18, divide both sides by 3. The value of x is 6.' },
    ],
    questions: [
      { prompt: 'What is the first step to solve x + 8 = 15?', options: ['Add 8 to both sides', 'Subtract 8 from both sides', 'Divide both sides by 8', 'Multiply both sides by 8'], correctIndex: 1, explanation: 'Subtracting 8 undoes the +8 while keeping both sides balanced: x = 7.', concept: 'Undo operations in reverse' },
      { prompt: 'Solve 4x = 28.', options: ['24', '112', '7', '32'], correctIndex: 2, explanation: 'Divide both sides by 4 to isolate x. 28 ÷ 4 = 7.', concept: 'Undo operations in reverse' },
      { prompt: 'Which is the best way to check whether x = 3 solves 2x + 1 = 7?', options: ['Replace x with 3 and compare both sides', 'Subtract 3 from 7 only', 'Multiply 2 and 1', 'Check whether 3 is an even number'], correctIndex: 0, explanation: 'Substitution gives 2(3) + 1 = 7, so both sides equal 7 and the solution checks out.', concept: 'Check by substituting' },
    ],
  },
  'The water cycle': {
    topic: 'The water cycle',
    explanation:
      'Water is always moving between Earth’s surface and the atmosphere. Heat from the Sun causes liquid water to evaporate into water vapor. As vapor rises and cools, it condenses into tiny droplets that form clouds. When droplets grow heavy enough, water falls back as precipitation. Some soaks into the ground, and some flows over land back toward rivers, lakes, and oceans.',
    keyConcepts: [
      { title: 'Evaporation moves water up', detail: 'Sunlight warms liquid water, changing some of it into an invisible gas called water vapor.' },
      { title: 'Condensation makes clouds', detail: 'Higher in the atmosphere, vapor cools and changes into tiny liquid droplets or ice crystals.' },
      { title: 'Precipitation brings water down', detail: 'When cloud droplets or crystals become heavy, they fall as rain, snow, sleet, or hail.' },
    ],
    examples: [
      { title: 'A puddle after a warm day', detail: 'The puddle gets smaller as some of its water evaporates into the air, even when it never boils.' },
      { title: 'Clouds over a mountain', detail: 'Moist air rises along a mountain slope, cools, and condenses. The resulting clouds can bring rain or snow.' },
    ],
    questions: [
      { prompt: 'What provides much of the energy that starts evaporation?', options: ['The Moon', 'The Sun', 'Clouds', 'Wind alone'], correctIndex: 1, explanation: 'Heat from sunlight gives surface water energy to evaporate into water vapor.', concept: 'Evaporation moves water up' },
      { prompt: 'What happens when water vapor cools in the atmosphere?', options: ['It condenses into droplets', 'It becomes soil', 'It disappears permanently', 'It turns directly into sunlight'], correctIndex: 0, explanation: 'Cooling vapor condenses into tiny droplets or ice crystals that can form clouds.', concept: 'Condensation makes clouds' },
      { prompt: 'Which process describes water falling from clouds to Earth?', options: ['Collection', 'Evaporation', 'Condensation', 'Precipitation'], correctIndex: 3, explanation: 'Rain, snow, sleet, and hail are all forms of precipitation.', concept: 'Precipitation brings water down' },
    ],
  },
};

const followUpQuestions: Record<string, StudySession['questions']> = {
  Photosynthesis: [
    { prompt: 'Why does a plant need chlorophyll?', options: ['To absorb light energy', 'To take in minerals from soil', 'To release glucose into the air', 'To make roots grow toward water'], correctIndex: 0, explanation: 'Chlorophyll absorbs light energy that powers photosynthesis.', concept: 'Chloroplasts capture light' },
    { prompt: 'How does a plant use the glucose it makes?', options: ['As food for growth and energy', 'As a replacement for sunlight', 'To turn oxygen into soil', 'Only to color its leaves green'], correctIndex: 0, explanation: 'Glucose stores chemical energy the plant can use to grow and fuel its processes.', concept: 'Glucose stores energy' },
    { prompt: 'Where does most of the oxygen released in photosynthesis come from?', options: ['Water molecules split during the process', 'Glucose escaping from the roots', 'Carbon dioxide changing directly into oxygen', 'Sunlight turning into gas'], correctIndex: 0, explanation: 'When water molecules are split, oxygen is released as a by-product.', concept: 'Oxygen is released' },
  ],
  'Linear equations': [
    { prompt: 'If you add 6 to the left side of an equation, what keeps it balanced?', options: ['Add 6 to the right side too', 'Subtract 6 from the right side', 'Multiply only the left side by 6', 'Change the equals sign'], correctIndex: 0, explanation: 'Doing the same operation to both sides preserves the equality.', concept: 'Equality is a balance' },
    { prompt: 'Solve x − 4 = 9. Which operation isolates x?', options: ['Subtract 4 from both sides', 'Add 4 to both sides', 'Multiply both sides by 4', 'Divide both sides by 4'], correctIndex: 1, explanation: 'Adding 4 undoes the subtraction: x = 13.', concept: 'Undo operations in reverse' },
    { prompt: 'If x = 5 is a proposed solution to 3x = 15, what should you check?', options: ['Whether 3 × 5 equals 15', 'Whether 5 is greater than 3', 'Whether 15 is an even number', 'Whether 3 + 5 equals 15'], correctIndex: 0, explanation: 'Substitute 5 for x in the original equation. Since 3 × 5 = 15, the solution works.', concept: 'Check by substituting' },
  ],
  'The water cycle': [
    { prompt: 'A puddle slowly shrinks on a warm day. Which process is happening?', options: ['Condensation', 'Precipitation', 'Evaporation', 'Freezing'], correctIndex: 2, explanation: 'Heat gives liquid water energy to become water vapor and move into the air.', concept: 'Evaporation moves water up' },
    { prompt: 'What change helps tiny cloud droplets form from water vapor?', options: ['The vapor cools and condenses', 'The vapor gets warmer and evaporates', 'The vapor turns into soil', 'Wind changes vapor into sunlight'], correctIndex: 0, explanation: 'Cooling causes water vapor to condense into tiny droplets or ice crystals.', concept: 'Condensation makes clouds' },
    { prompt: 'Snow falling from a cloud is an example of which stage?', options: ['Evaporation', 'Condensation', 'Precipitation', 'Collection'], correctIndex: 2, explanation: 'Precipitation includes rain, snow, sleet, and hail falling from clouds.', concept: 'Precipitation brings water down' },
  ],
};

export function createLesson(topic: string, level: string): StudySession | null {
  const content = lessonContent[topic];
  if (!content) return null;
  return { ...content, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, level, createdAt: new Date().toISOString(), answers: [] };
}

export function createFollowUpSession(session: StudySession, weakConcepts: string[]): StudySession | null {
  const questions = followUpQuestions[session.topic];
  if (!questions) return null;
  const targets = new Set(weakConcepts.length ? weakConcepts : session.keyConcepts.map((concept) => concept.title));
  const selectedQuestions = questions.filter((question) => targets.has(question.concept));
  if (!selectedQuestions.length) return null;
  return {
    ...session,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    questions: selectedQuestions,
    answers: [],
    followUp: true,
  };
}

export function readSessions(): StudySession[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed as StudySession[] : [];
  } catch {
    return [];
  }
}

export function saveSession(session: StudySession) {
  const all = readSessions().filter((item) => item.id !== session.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...all]));
}

export function accuracy(session: StudySession) {
  if (!session.answers.length) return 0;
  return Math.round((session.answers.filter((answer) => answer.correct).length / session.answers.length) * 100);
}