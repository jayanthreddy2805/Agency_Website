// ─── Auth config ─────────────────────────────────────────────────────
// Add more users here later
const VALID_USERS: Record<string, string> = {
  J: "28",
};

export interface AELUser {
  username: string;
  loginTime: number;
  displayName: string;
}

const SESSION_KEY = "ael_session";

// ─── Login ────────────────────────────────────────────────────────────
export function login(username: string, password: string): AELUser | null {
  if (VALID_USERS[username] && VALID_USERS[username] === password) {
    const user: AELUser = {
      username,
      loginTime: Date.now(),
      displayName: username,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

// ─── Logout ───────────────────────────────────────────────────────────
export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Get current user ─────────────────────────────────────────────────
export function getCurrentUser(): AELUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AELUser;
  } catch {
    return null;
  }
}

// ─── Per-user chat history ────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface UserProfile {
  username: string;
  firstSeen: number;
  lastSeen: number;
  totalMessages: number;
  topics: string[];        // topics user has discussed
  preferences: string[];   // learned preferences
  facts: string[];         // facts learned about user
}

function historyKey(username: string): string {
  return `ael_chat_${username}`;
}

function profileKey(username: string): string {
  return `ael_profile_${username}`;
}

// ─── Save chat message ────────────────────────────────────────────────
export function saveMessage(username: string, msg: ChatMessage): void {
  try {
    const key = historyKey(username);
    const existing: ChatMessage[] = JSON.parse(
      localStorage.getItem(key) || "[]"
    );
    existing.push(msg);
    // Keep last 100 messages
    localStorage.setItem(key, JSON.stringify(existing.slice(-100)));
  } catch {}
}

// ─── Load chat history ────────────────────────────────────────────────
export function loadChatHistory(username: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(historyKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Clear chat history ───────────────────────────────────────────────
export function clearChatHistory(username: string): void {
  localStorage.removeItem(historyKey(username));
}

// ─── Load/save user profile ───────────────────────────────────────────
export function loadUserProfile(username: string): UserProfile {
  try {
    const raw = localStorage.getItem(profileKey(username));
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    username,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    totalMessages: 0,
    topics: [],
    preferences: [],
    facts: [],
  };
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    profile.lastSeen = Date.now();
    localStorage.setItem(profileKey(profile.username), JSON.stringify(profile));
  } catch {}
}

// ─── Build user context string for AI ────────────────────────────────
export function buildUserContext(username: string): string {
  const profile = loadUserProfile(username);
  const history = loadChatHistory(username);
  const recentMessages = history.slice(-20);

  let context = `USER PROFILE:
- Username: ${username}
- Total messages sent: ${profile.totalMessages}
- First conversation: ${new Date(profile.firstSeen).toLocaleDateString()}`;

  if (profile.facts.length > 0) {
    context += `\n- Known facts about user: ${profile.facts.join(", ")}`;
  }
  if (profile.preferences.length > 0) {
    context += `\n- User preferences: ${profile.preferences.join(", ")}`;
  }
  if (profile.topics.length > 0) {
    context += `\n- Topics they discuss: ${profile.topics.slice(-10).join(", ")}`;
  }

  if (recentMessages.length > 0) {
    context += `\n\nRECENT CONVERSATION HISTORY (last ${recentMessages.length} messages):`;
    recentMessages.forEach((m) => {
      context += `\n[${m.role === "user" ? username : "AEL"}]: ${m.content.slice(0, 150)}`;
    });
  }

  return context;
}

// ─── Update profile from conversation ────────────────────────────────
export function updateProfileFromMessage(
  username: string,
  userMessage: string
): void {
  const profile = loadUserProfile(username);
  profile.totalMessages += 1;

  // Extract facts about user from message
  const namePhrases = userMessage.match(
    /(?:i am|my name is|call me|i'm)\s+([A-Z][a-zA-Z\s]{1,20})/i
  );
  if (namePhrases?.[1]) {
    const fact = `name is ${namePhrases[1].trim()}`;
    if (!profile.facts.includes(fact)) profile.facts.push(fact);
  }

  const locationPhrases = userMessage.match(
    /(?:i live in|i'm from|i am from|based in)\s+([A-Z][a-zA-Z\s,]{2,30})/i
  );
  if (locationPhrases?.[1]) {
    const fact = `lives in ${locationPhrases[1].trim()}`;
    profile.facts = profile.facts.filter((f) => !f.startsWith("lives in"));
    profile.facts.push(fact);
  }

  // Track topics
  const topicKeywords: Record<string, string> = {
    weather: "weather",
    cricket: "cricket/sports",
    football: "football/sports",
    code: "coding",
    website: "web development",
    app: "app development",
    design: "UI/UX design",
    marketing: "digital marketing",
    price: "pricing",
    cost: "pricing",
  };
  Object.entries(topicKeywords).forEach(([keyword, topic]) => {
    if (
      userMessage.toLowerCase().includes(keyword) &&
      !profile.topics.includes(topic)
    ) {
      profile.topics.push(topic);
    }
  });

  // Keep topics list manageable
  if (profile.topics.length > 20) profile.topics = profile.topics.slice(-20);
  if (profile.facts.length > 15) profile.facts = profile.facts.slice(-15);

  saveUserProfile(profile);
}