"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserProfile } from "@/lib/user-storage";
import { useDashboardContext } from "../../../dashboard-context";
import { getCachedLesson, setCachedLesson } from "@/lib/lesson-cache";
import { completeTopic } from "@/lib/topic-progress";
import LessonContent from "@/components/LessonContent";
import type { LessonContentPayload } from "@/lib/curriculum-api";
import { streamLessonSession } from "@/lib/curriculum-api";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { curriculum, setLearningContext } = useDashboardContext();

  const subjectSlugParam = (params?.subject as string) ?? "";
  const topicIndexStr = (params?.topicIndex as string) ?? "0";

  const subject = useMemo(() => {
    if (!curriculum?.subjects) {
      return null;
    }
    const decoded = decodeURIComponent(subjectSlugParam);
    return (
      curriculum.subjects.find((item) => item.slug === decoded) ??
      curriculum.subjects.find((item) => item.slug === subjectSlugParam) ??
      curriculum.subjects.find((item) => item.name === decoded) ??
      null
    );
  }, [curriculum?.subjects, subjectSlugParam]);

  const subjectName = subject?.name ?? decodeURIComponent(subjectSlugParam);
  const subjectKey = subject?.slug ?? decodeURIComponent(subjectSlugParam);
  const topicIndex = useMemo(
    () => parseInt(topicIndexStr, 10),
    [topicIndexStr]
  );

  const [hasUser, setHasUser] = useState(false);

  const [lesson, setLesson] = useState<LessonContentPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topics = useMemo(() => {
    if (!curriculum?.topics) {
      return [];
    }
    return (
      curriculum.topics[subjectKey] ?? curriculum.topics[subjectName] ?? []
    );
  }, [curriculum?.topics, subjectKey, subjectName]);

  const topic = topics[topicIndex] || "";

  useEffect(() => {
    if (!subjectKey) {
      setLearningContext({ subject: null, topic: null, relatedTopics: [] });
      return;
    }

    setLearningContext({
      subject,
      topic: topic || null,
      relatedTopics: topics.filter((item) => item !== topic).slice(0, 3),
    });

    return () => {
      setLearningContext({ subject: null, topic: null, relatedTopics: [] });
    };
  }, [subject, subjectKey, topic, topics, setLearningContext]);

  useEffect(() => {
    const profile = getUserProfile();
    setHasUser(!!profile);
  }, []);

  useEffect(() => {
    async function ensureLesson() {
      if (!hasUser) {
        return;
      }

      // 1. Check Cache First
      const cached = getCachedLesson(subjectKey, topicIndex, subjectName);
      if (cached) {
        setLesson(cached.lesson);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!curriculum) {
        setLesson(null);
        setIsLoading(false);
        setError(
          "Lesson not found in cache. Return to dashboard to regenerate it."
        );
        return;
      }

      if (!topic) {
        setLesson(null);
        setIsLoading(false);
        setError(
          "Topic details are missing. Return to the subject overview and try again."
        );
        return;
      }

      // 2. Start Streaming
      setIsLoading(true);
      setError(null);

      // Initialize empty lesson structure
      let currentLesson: LessonContentPayload = {
        title: topic,
        content: "",
        keyPoints: [],
        slides: [],
        examples: [],
        practice: {
          question: "",
          options: [],
          answerIndex: -1,
          correctFeedback: "",
          incorrectFeedback: "",
        },
        progress: {
          current: topicIndex,
          total: topics.length || 1,
        },
      };

      try {
        const lessonRequest = {
          country: curriculum.country,
          language: curriculum.language,
          gradeLevel: curriculum.gradeLevel,
          subject: subjectName,
          topic,
          topicIndex,
          totalTopics: topics.length || 1,
        };

        for await (const event of streamLessonSession(lessonRequest)) {
          if (event.type === "plan") {
            // Plan received: Validates we are on track.
            // We could update 'keyPoints' here if the plan included them, but payload is specific.
            // For now we just acknowledge the plan is done.
            // If plan payload has keyPoints, we could set them:
            if (event.payload && event.payload.keyPoints) {
              currentLesson = {
                ...currentLesson,
                keyPoints: event.payload.keyPoints,
              };
              setLesson({ ...currentLesson });
            }
            // We can stop "Loading" spinner once we have a plan, or wait for first slide?
            // Let's keep isLoading=true until we have at least one slide or the plan is solid.
            // Actually, to show "Creating lesson..." we might want to show the component in a loading state.
            // But simpler: just keep full loader until first content arrives.
          } else if (event.type === "slide") {
            // Append new slide
            if (event.payload) {
              const newSlides = [...currentLesson.slides, event.payload];
              currentLesson = {
                ...currentLesson,
                slides: newSlides,
              };
              setLesson({ ...currentLesson });
              // Once we have a slide, we can show the UI
              setIsLoading(false);
            }
          } else if (event.type === "practice") {
            if (event.payload) {
              currentLesson = {
                ...currentLesson,
                practice: event.payload,
              };
              setLesson({ ...currentLesson });
            }
          } else if (event.type === "complete") {
            // Finalize
            if (event.payload && event.payload.lesson) {
              // Use the authoritative final result which might have extra polish
              setLesson(event.payload.lesson);

              // Cache it
              setCachedLesson(
                subjectKey,
                topicIndex,
                {
                  subjectSlug: subjectKey,
                  subjectName,
                  topic,
                  topicIndex,
                  lesson: event.payload.lesson,
                  session: event.payload.session,
                  savedAt: Date.now(),
                },
                subjectName
              );
            }
          } else if (event.type === "error") {
            throw new Error(event.message || "Stream error");
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load lesson";
        setError(message);
        setIsLoading(false);
      }
    }

    void ensureLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum, hasUser, subjectName, topicIndex, topic, topics]);

  const handleBack = () => {
    router.push(`/app/learn/${encodeURIComponent(subjectKey)}`);
  };

  const handleComplete = () => {
    completeTopic(subjectKey, topicIndex, topics.length, subjectName);
    router.push(`/app/learn/${encodeURIComponent(subjectKey)}`);
  };

  if (!hasUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
      >
        ← Back to {subjectName}
      </button>

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading lesson...
          </h2>
          <p className="text-gray-600">{topic}</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Could not load lesson</h2>
          <p className="text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={handleBack}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700"
          >
            Back to Topics
          </button>
        </div>
      )}

      {!isLoading && !error && lesson && (
        <LessonContent
          lesson={lesson}
          subject={subjectName}
          topicIndex={topicIndex}
          totalTopics={topics.length}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
