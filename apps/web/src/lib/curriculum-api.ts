import type { CurriculumSubject, LearningSession } from "@/lib/curriculum-db";
import type { LessonSlide } from "@/lib/lesson-types";

/**
 * Curriculum API Client
 * Connects Next.js frontend to the curriculum generation backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CurriculumRequest {
  country: string;
  language: string;
  gradeLevel?: string;
  subjects?: string[];
}

export interface CurriculumResponse {
  subjects: CurriculumSubject[];
  topics?: Record<string, string[]>;
  currentStep: string;
  error?: string;
}

export interface LessonRequest {
  country: string;
  language: string;
  gradeLevel?: string;
  subject: string;
  topic: string;
  topicIndex: number;
  totalTopics: number;
}

export interface LessonContentPayload {
  title: string;
  content: string;
  keyPoints: string[];
  slides: LessonSlide[];
  examples: string[];
  practice: {
    question: string;
    options: string[];
    answerIndex: number;
    correctFeedback: string;
    incorrectFeedback: string;
  };
  progress: {
    current: number;
    total: number;
  };
}

export interface LessonResponse {
  success: boolean;
  lesson: LessonContentPayload;
  session: LearningSession;
}

export type LessonStreamPhase =
  | "initializing"
  | "planning"
  | "generating_slides"
  | "slides_ready"
  | "generating_practice"
  | "complete"
  | "error";

export interface LessonPlanPayload {
  learningObjectives: string[];
  keyPoints: string[];
  slideSpecs: Array<{
    slideType: string;
    title: string;
    focus: string;
    keyConcept: string;
  }>;
}

export interface LessonPracticePayload {
  question: string;
  options: string[];
  answerIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
}

export type LessonStreamEvent =
  | {
      type: "status" | "error";
      phase?: LessonStreamPhase;
      message?: string;
      payload?: never;
      index?: number;
      total?: number;
    }
  | {
      type: "plan";
      phase?: LessonStreamPhase;
      message?: string;
      payload: LessonPlanPayload;
      index?: number;
      total?: number;
    }
  | {
      type: "slide";
      phase?: LessonStreamPhase;
      message?: string;
      payload: LessonSlide;
      index: number;
      total: number;
    }
  | {
      type: "practice";
      phase?: LessonStreamPhase;
      message?: string;
      payload: LessonPracticePayload;
      index?: number;
      total?: number;
    }
  | {
      type: "complete";
      phase?: LessonStreamPhase;
      message?: string;
      payload: LessonResponse;
      index?: number;
      total?: number;
    };

/**
 * Generate curriculum (non-streaming)
 */
export async function generateCurriculum(
  request: CurriculumRequest
): Promise<CurriculumResponse> {
  const response = await fetch(`${API_BASE_URL}/curriculum/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(error.error || "Failed to generate curriculum");
  }

  return response.json();
}

export async function generateLessonSession(
  request: LessonRequest
): Promise<LessonResponse> {
  const params = new URLSearchParams({
    country: request.country,
    language: request.language,
    subject: request.subject,
    topic: request.topic,
    index: String(Math.max(0, request.topicIndex)),
    totalTopics: String(Math.max(1, request.totalTopics)),
  });

  if (request.gradeLevel) {
    params.set("grade", request.gradeLevel);
  }

  const response = await fetch(
    `${API_BASE_URL}/curriculum/lesson?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(error.error || "Failed to generate lesson");
  }

  return response.json();
}

export async function fetchLesson(
  request: LessonRequest
): Promise<LessonResponse> {
  return generateLessonSession(request);
}

export async function* streamLessonSession(
  request: LessonRequest
): AsyncGenerator<LessonStreamEvent> {
  const url = new URL(`${API_BASE_URL}/curriculum/lesson/stream`);
  url.searchParams.set("country", request.country);
  url.searchParams.set("language", request.language);
  url.searchParams.set("subject", request.subject);
  url.searchParams.set("topic", request.topic);
  url.searchParams.set("index", String(Math.max(0, request.topicIndex)));
  url.searchParams.set("totalTopics", String(Math.max(1, request.totalTopics)));
  if (request.gradeLevel) {
    url.searchParams.set("grade", request.gradeLevel);
  }

  const controller = new AbortController();
  const response = await fetch(url.toString(), {
    signal: controller.signal,
  });

  if (!response.ok) {
    controller.abort();
    const error = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(error.error || "Failed to start lesson stream");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    controller.abort();
    throw new Error("No response body");
  }

  let buffer = "";

  const findDelimiter = (
    source: string
  ): { index: number; length: number } | null => {
    const newlineIndex = source.indexOf("\n\n");
    const carriageIndex = source.indexOf("\r\n\r\n");

    if (newlineIndex === -1 && carriageIndex === -1) {
      return null;
    }

    if (
      newlineIndex !== -1 &&
      (carriageIndex === -1 || newlineIndex < carriageIndex)
    ) {
      return { index: newlineIndex, length: 2 };
    }

    return { index: carriageIndex, length: 4 };
  };

  const extractEvents = () => {
    const events: LessonStreamEvent[] = [];
    let doneSignal = false;

    while (true) {
      const delimiter = findDelimiter(buffer);

      if (!delimiter) {
        break;
      }

      const rawEvent = buffer.slice(0, delimiter.index);
      buffer = buffer.slice(delimiter.index + delimiter.length);

      const dataPayload = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");

      if (!dataPayload) {
        continue;
      }

      if (dataPayload === "[DONE]") {
        doneSignal = true;
        break;
      }

      try {
        const parsed = JSON.parse(dataPayload) as LessonStreamEvent;
        events.push(parsed);
      } catch {
        // Ignore malformed chunks and wait for the next complete event
      }
    }

    return { events, doneSignal } as const;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const { events, doneSignal } = extractEvents();
      for (const event of events) {
        yield event;
      }

      if (doneSignal) {
        break;
      }
    }

    if (buffer.length > 0) {
      const { events } = extractEvents();
      for (const event of events) {
        yield event;
      }
    }
  } finally {
    controller.abort();
    try {
      reader.releaseLock();
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Generate curriculum with streaming (SSE)
 */
export async function* streamCurriculum(
  request: CurriculumRequest
): AsyncGenerator<CurriculumResponse> {
  const url = new URL(`${API_BASE_URL}/curriculum/generate-stream`);
  url.searchParams.set("country", request.country);
  url.searchParams.set("language", request.language);
  if (request.gradeLevel) {
    url.searchParams.set("gradeLevel", request.gradeLevel);
  }
  if (request.subjects && request.subjects.length > 0) {
    for (const subject of request.subjects) {
      url.searchParams.append("subject", subject);
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Failed to start curriculum stream");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let buffer = "";

  const findDelimiter = (
    source: string
  ): { index: number; length: number } | null => {
    const newlineIndex = source.indexOf("\n\n");
    const carriageIndex = source.indexOf("\r\n\r\n");

    if (newlineIndex === -1 && carriageIndex === -1) {
      return null;
    }

    if (
      newlineIndex !== -1 &&
      (carriageIndex === -1 || newlineIndex < carriageIndex)
    ) {
      return { index: newlineIndex, length: 2 };
    }

    return { index: carriageIndex, length: 4 };
  };

  const extractEvents = () => {
    const events: CurriculumResponse[] = [];
    let doneSignal = false;

    while (true) {
      const delimiter = findDelimiter(buffer);

      if (!delimiter) {
        break;
      }

      const rawEvent = buffer.slice(0, delimiter.index);
      buffer = buffer.slice(delimiter.index + delimiter.length);

      const dataPayload = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");

      if (!dataPayload) {
        continue;
      }

      if (dataPayload === "[DONE]") {
        doneSignal = true;
        break;
      }

      try {
        events.push(JSON.parse(dataPayload) as CurriculumResponse);
      } catch {
        // Ignore malformed chunks and wait for the next complete event
      }
    }

    return { events, doneSignal } as const;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      const { events, doneSignal } = extractEvents();
      for (const event of events) {
        yield event;
      }

      if (doneSignal) {
        return;
      }

      if (done) {
        buffer += decoder.decode();
        const finalResult = extractEvents();
        for (const event of finalResult.events) {
          yield event;
        }
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface TutorChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface TutorChatRequest {
  message: string;
  subject: string;
  topic?: string | null;
  relatedTopics?: string[];
  language: string;
  country?: string;
  gradeLevel?: string;
  history?: TutorChatHistoryEntry[];
}

export interface TutorChatResponse {
  answer: string;
  followUps?: string[];
  navigationTip?: string;
}

export async function askTutor(
  request: TutorChatRequest
): Promise<TutorChatResponse> {
  const response = await fetch(`${API_BASE_URL}/curriculum/tutor-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to get tutor response");
  }

  return payload as TutorChatResponse;
}
