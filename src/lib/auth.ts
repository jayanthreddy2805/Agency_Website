import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export interface AELUser {
  username: string;
  loginTime: number;
  displayName: string;
}

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
  topics: string[];
  preferences: string[];
  facts: string[];
}

const SESSION_KEY = "ael_session";

export function getCurrentUser(): AELUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AELUser;
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<AELUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) return null;

    const valid = await bcrypt.compare(password, data.password_hash);
    if (!valid) return null;

    const user: AELUser = {
      username,
      loginTime: Date.now(),
      displayName: username,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function saveMessage(username: string, msg: ChatMessage): Promise<void> {
  await supabase.from("chat_history").insert({
    username,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  });
}

export async function loadChatHistory(username: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("chat_history")
    .select("*")
    .eq("username", username)
    .order("timestamp", { ascending: true })
    .limit(100);

  return (data || []).map((d) => ({
    role: d.role,
    content: d.content,
    timestamp: d.timestamp,
  }));
}

export async function loadUserProfile(username: string): Promise<UserProfile> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (data) {
    return {
      username: data.username,
      firstSeen: data.first_seen,
      lastSeen: data.last_seen,
      totalMessages: data.total_messages,
      topics: data.topics || [],
      preferences: data.preferences || [],
      facts: data.facts || [],
    };
  }

  const newProfile: UserProfile = {
    username,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    totalMessages: 0,
    topics: [],
    preferences: [],
    facts: [],
  };

  await supabase.from("user_profiles").insert({
    username,
    first_seen: newProfile.firstSeen,
    last_seen: newProfile.lastSeen,
    total_messages: 0,
    topics: [],
    preferences: [],
    facts: [],
  });

  return newProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await supabase.from("user_profiles").upsert({
    username: profile.username,
    first_seen: profile.firstSeen,
    last_seen: Date.now(),
    total_messages: profile.totalMessages,
    topics: profile.topics,
    preferences: profile.preferences,
    facts: profile.facts,
  });
}

export async function buildUserContext(username: string): Promise<string> {
  const profile = await loadUserProfile(username);
  const history = await loadChatHistory(username);
  const recentMessages = history.slice(-20);

  let context = `USER PROFILE:
- Username: ${username}
- Total messages sent: ${profile.totalMessages}
- First conversation: ${new Date(profile.firstSeen).toLocaleDateString()}`;

  if (profile.facts.length > 0)
    context += `\n- Known facts about user: ${profile.facts.join(", ")}`;
  if (profile.preferences.length > 0)
    context += `\n- User preferences: ${profile.preferences.join(", ")}`;
  if (profile.topics.length > 0)
    context += `\n- Topics they discuss: ${profile.topics.slice(-10).join(", ")}`;

  if (recentMessages.length > 0) {
    context += `\n\nRECENT CONVERSATION HISTORY:`;
    recentMessages.forEach((m) => {
      context += `\n[${m.role === "user" ? username : "AEL"}]: ${m.content.slice(0, 150)}`;
    });
  }

  return context;
}

export async function updateProfileFromMessage(username: string, userMessage: string): Promise<void> {
  const profile = await loadUserProfile(username);
  profile.totalMessages += 1;

  const namePhrases = userMessage.match(/(?:i am|my name is|call me|i'm)\s+([A-Z][a-zA-Z\s]{1,20})/i);
  if (namePhrases?.[1]) {
    const fact = `name is ${namePhrases[1].trim()}`;
    if (!profile.facts.includes(fact)) profile.facts.push(fact);
  }

  const locationPhrases = userMessage.match(/(?:i live in|i'm from|i am from|based in)\s+([A-Z][a-zA-Z\s,]{2,30})/i);
  if (locationPhrases?.[1]) {
    const fact = `lives in ${locationPhrases[1].trim()}`;
    profile.facts = profile.facts.filter((f) => !f.startsWith("lives in"));
    profile.facts.push(fact);
  }

  const topicKeywords: Record<string, string> = {
    weather: "weather", cricket: "cricket/sports", football: "football/sports",
    code: "coding", website: "web development", app: "app development",
    design: "UI/UX design", marketing: "digital marketing", price: "pricing", cost: "pricing",
  };

  Object.entries(topicKeywords).forEach(([keyword, topic]) => {
    if (userMessage.toLowerCase().includes(keyword) && !profile.topics.includes(topic))
      profile.topics.push(topic);
  });

  if (profile.topics.length > 20) profile.topics = profile.topics.slice(-20);
  if (profile.facts.length > 15) profile.facts = profile.facts.slice(-15);

  await saveUserProfile(profile);
}