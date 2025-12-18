import type { LessonSlide } from "@/lib/lesson-types";
import { normalizeSubjectList } from "@/lib/slug";

/**
 * IndexedDB utilities for curriculum and chat storage
 */

const DB_NAME = "graspy-db";
const DB_VERSION = 1;
const CURRICULUM_STORE = "curriculum";
const CHAT_STORE = "chat-history";

export interface CurriculumData {
  id: string;
  country: string;
  countryName?: string;
  language: string;
  languageName?: string;
  gradeLevel: string;
  subjects: CurriculumSubject[];
  topics?: Record<string, string[]>;
  activeSession?: LearningSession;
  assessment?: {
    nextSubject: string | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calendar?: any;
  createdAt: number;
  updatedAt: number;
}

export interface LearningSession {
  id: string;
  subject: string;
  topic: string;
  topicIndex: number;
  totalTopics: number;
  explanation: string;
  practice: {
    question: string;
    options: string[];
    answerIndex: number;
    correctFeedback: string;
    incorrectFeedback: string;
  };
  slides?: LessonSlide[];
  phase: "explanation" | "practice" | "feedback" | "complete";
  answerIndex?: number;
  isCorrect?: boolean;
  metadata?: {
    country: string;
    language: string;
    gradeLevel?: string;
    generator?: string;
    learningObjectives?: string[];
  }; // Preserves backend context so lesson details remain consistent across requests.
}

export interface ChatMessage {
  id: string;
  type:
    | "system"
    | "status"
    | "subject"
    | "complete"
    | "error"
    | "user"
    | "component";
  content: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  sender: "ai" | "user";
}

export interface CurriculumSubject {
  name: string;
  slug: string;
}

type LegacyCurriculumSubject = string | CurriculumSubject;

interface LegacyCurriculumData
  extends Omit<CurriculumData, "subjects" | "topics" | "assessment"> {
  subjects: LegacyCurriculumSubject[];
  topics?: Record<string, string[]>;
  assessment?: {
    nextSubject: string | null;
  };
}

function normalizeCurriculumData(
  input: CurriculumData | LegacyCurriculumData | null
): CurriculumData | null {
  if (!input) {
    return null;
  }

  const {
    subjects: rawSubjects,
    topics: rawTopics,
    assessment,
    ...rest
  } = input as LegacyCurriculumData;
  const { subjects, nameToSlug } = normalizeSubjectList(rawSubjects ?? []);

  const topicsBySlug: Record<string, string[]> = {};
  const sourceTopics = rawTopics ?? {};

  for (const subject of subjects) {
    const fromSlug = sourceTopics[subject.slug];
    const fromName = sourceTopics[subject.name];
    const entries = Array.isArray(fromSlug)
      ? fromSlug
      : Array.isArray(fromName)
      ? fromName
      : [];
    topicsBySlug[subject.slug] = [...entries];
  }

  const nextSubjectRaw = assessment?.nextSubject ?? null;
  const normalizedNextSubject =
    nextSubjectRaw && subjects.length > 0
      ? subjects.find((subject) => subject.slug === nextSubjectRaw)?.slug ??
        (nextSubjectRaw ? nameToSlug.get(nextSubjectRaw) ?? null : null)
      : null;

  return {
    ...rest,
    subjects,
    topics: topicsBySlug,
    assessment: assessment
      ? {
          ...assessment,
          nextSubject: normalizedNextSubject,
        }
      : undefined,
  };
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create curriculum store
      if (!db.objectStoreNames.contains(CURRICULUM_STORE)) {
        db.createObjectStore(CURRICULUM_STORE, { keyPath: "id" });
      }

      // Create chat history store
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: "id" });
        chatStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Curriculum Operations

export async function saveCurriculum(
  data: Omit<CurriculumData, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CURRICULUM_STORE, "readwrite");
  const store = tx.objectStore(CURRICULUM_STORE);

  const curriculum = normalizeCurriculumData({
    id: "current", // Single curriculum per user
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  if (!curriculum) {
    db.close();
    throw new Error("Failed to normalize curriculum data before saving");
  }

  await new Promise<void>((resolve, reject) => {
    const request = store.put(curriculum);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

export async function getCurriculum(): Promise<CurriculumData | null> {
  const db = await openDB();
  const tx = db.transaction(CURRICULUM_STORE, "readonly");
  const store = tx.objectStore(CURRICULUM_STORE);

  const curriculum = await new Promise<LegacyCurriculumData | undefined>(
    (resolve, reject) => {
      const request = store.get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );

  db.close();
  return normalizeCurriculumData(curriculum ?? null);
}

export async function updateCurriculum(
  updates: Partial<CurriculumData>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CURRICULUM_STORE, "readwrite");
  const store = tx.objectStore(CURRICULUM_STORE);

  const existing = await new Promise<LegacyCurriculumData | undefined>(
    (resolve, reject) => {
      const request = store.get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );

  if (existing) {
    const normalizedExisting = normalizeCurriculumData(existing);
    const merged = normalizeCurriculumData({
      ...(normalizedExisting ?? existing),
      ...updates,
      updatedAt: Date.now(),
    });

    if (!merged) {
      db.close();
      throw new Error("Failed to normalize curriculum data during update");
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(merged);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  db.close();
}

export async function deleteCurriculum(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CURRICULUM_STORE, "readwrite");
  const store = tx.objectStore(CURRICULUM_STORE);

  await new Promise<void>((resolve, reject) => {
    const request = store.delete("current");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

// Chat History Operations

export async function saveChatMessage(
  message: Omit<ChatMessage, "id" | "timestamp"> & { sender?: "ai" | "user" }
): Promise<ChatMessage> {
  const db = await openDB();
  const tx = db.transaction(CHAT_STORE, "readwrite");
  const store = tx.objectStore(CHAT_STORE);

  const chatMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    sender: message.sender ?? "ai",
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.put(chatMessage);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return chatMessage;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const db = await openDB();
  const tx = db.transaction(CHAT_STORE, "readonly");
  const store = tx.objectStore(CHAT_STORE);

  const messages = await new Promise<ChatMessage[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return messages
    .map((message) => ({
      ...message,
      sender: message.sender ?? "ai",
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearChatHistory(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CHAT_STORE, "readwrite");
  const store = tx.objectStore(CHAT_STORE);

  await new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

export async function updateChatMessage(
  id: string,
  updates: Partial<Omit<ChatMessage, "id" | "timestamp">>
): Promise<ChatMessage | null> {
  const db = await openDB();
  const tx = db.transaction(CHAT_STORE, "readwrite");
  const store = tx.objectStore(CHAT_STORE);

  const existing = await new Promise<ChatMessage | undefined>(
    (resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );

  if (!existing) {
    db.close();
    return null;
  }

  const mergedMetadata = updates.metadata
    ? { ...(existing.metadata ?? {}), ...updates.metadata }
    : existing.metadata;

  const updated: ChatMessage = {
    ...existing,
    ...updates,
    metadata: mergedMetadata,
    sender: updates.sender ?? existing.sender ?? "ai",
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.put(updated);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return updated;
}
