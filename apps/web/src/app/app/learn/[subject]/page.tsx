"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserProfile } from "@/lib/user-storage";
import { useDashboardContext } from "../dashboard-context";
import { loadTopicProgress, type TopicStatus } from "@/lib/topic-progress";
import { getCachedLesson } from "@/lib/lesson-cache";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const userProfile = getUserProfile();
  const { curriculum, setLearningContext } = useDashboardContext();

  const subjectSlug = (params?.subject as string) ?? "";

  const subject = useMemo(() => {
    if (!curriculum?.subjects) {
      return null;
    }
    const decoded = decodeURIComponent(subjectSlug);
    return (
      curriculum.subjects.find((item) => item.slug === decoded) ??
      curriculum.subjects.find((item) => item.slug === subjectSlug) ??
      curriculum.subjects.find((item) => item.name === decoded) ??
      null
    );
  }, [curriculum?.subjects, subjectSlug]);

  const subjectName = subject?.name ?? decodeURIComponent(subjectSlug);
  const subjectKey = subject?.slug ?? decodeURIComponent(subjectSlug);

  const topics = useMemo(() => {
    if (!curriculum?.topics) {
      return [];
    }
    return (
      curriculum.topics[subjectKey] ?? curriculum.topics[subjectName] ?? []
    );
  }, [curriculum?.topics, subjectKey, subjectName]);

  const [topicStatuses, setTopicStatuses] = useState<TopicStatus[]>(() => []);

  useEffect(() => {
    const stored = loadTopicProgress(
      subjectKey,
      topics.length || 5,
      subjectName
    );
    const normalized: TopicStatus[] = topics.map((_, index) => {
      const existingStatus = stored[index];
      if (existingStatus === "generated" || existingStatus === "generating") {
        return existingStatus;
      }
      const cached = getCachedLesson(subjectKey, index, subjectName);
      return cached ? "generated" : existingStatus ?? "not-generated";
    });
    setTopicStatuses(normalized);
  }, [subjectKey, subjectName, topics]);

  useEffect(() => {
    if (!subjectKey) {
      setLearningContext({ subject: null, topic: null, relatedTopics: [] });
      return;
    }

    setLearningContext({
      subject,
      topic: null,
      relatedTopics: topics.slice(0, 3),
    });

    return () => {
      setLearningContext({ subject: null, topic: null, relatedTopics: [] });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLearningContext, subject, topics]);

  const handleTopicClick = async (topicIndex: number) => {
    if (!userProfile || !curriculum) return;

    const topic = topics[topicIndex];
    if (!topic) return;

    setLearningContext({
      subject,
      topic,
      relatedTopics: topics.filter((item) => item !== topic).slice(0, 3),
    });

    // Navigate immediately - LessonPage will handle generation/streaming
    router.push(
      `/app/learn/${encodeURIComponent(subjectKey)}/lesson/${topicIndex}`
    );
  };

  const generatedCount = topicStatuses.filter((s) => s === "generated").length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/app/learn")}
            className="text-sm text-sky-600 hover:text-sky-700 mb-4 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span>📚</span>
            <span>{subjectName}</span>
          </h1>
          <p className="text-gray-600">
            Click any topic to generate and start your lesson
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">
              {generatedCount}/{topics.length}
            </span>
          </div>
          <div className="w-full bg-sky-100 rounded-full h-3">
            <div
              className="bg-sky-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${
                  topics.length > 0 ? (generatedCount / topics.length) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-3">
          {topics.map((topic, index) => {
            const status = topicStatuses[index] || "not-generated";
            const isGenerated = status === "generated";

            const cardClasses = [
              "rounded-xl border-2 transition-all overflow-hidden",
              isGenerated
                ? "border-sky-200 bg-sky-50 hover:shadow-md"
                : "border-gray-200 bg-white hover:border-sky-300 hover:shadow-md",
            ].join(" ");

            const statusIcon = isGenerated ? "✓" : "→";
            const statusText = isGenerated
              ? "Ready to learn"
              : "Click to start lesson";

            return (
              <div key={topic} className={cardClasses}>
                <button
                  type="button"
                  onClick={() => handleTopicClick(index)}
                  className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl flex-shrink-0">{statusIcon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-base">
                          {index + 1}. {topic}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {statusText}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {topics.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Topics are being generated...</p>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Status Guide
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">→</span>
              <span className="text-gray-600">Not started</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-gray-600">Completed / Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
