"use client";

import {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { processLatex } from "@/lib/latex";
import "katex/dist/katex.min.css";
import "katex/dist/contrib/mhchem.mjs";
import {
  type ChatMessage,
  type CurriculumData,
  type CurriculumSubject,
  type LearningSession,
} from "@/lib/curriculum-db";
import { useI18n } from "@/lib/i18n-context";
import LearningSessionCard from "@/components/LearningSessionCard";
import { type LearningContext } from "@/hooks/useCurriculumChat";
import { BookOpen, Compass, HelpCircle, Lightbulb, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  isPrimingLesson: boolean;
  curriculum: CurriculumData | null;
  recommendedSubject: CurriculumSubject | null;
  activeSession?: LearningSession;
  onLessonContinue: () => void;
  onSubmitLessonAnswer: (answerIndex: number) => void;
  onFinishLesson: () => void;
  onSendMessage?: (message: string) => void;
  learningContext: LearningContext;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  Icon: ComponentType<{ className?: string }>;
}

function formatTimestamp(timestamp: number, locale: string): string | null {
  if (!Number.isFinite(timestamp) || timestamp === Number.MAX_SAFE_INTEGER) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return null;
  }
}

export default function ChatPanel({
  messages,
  isGenerating,
  isPrimingLesson,
  curriculum,
  recommendedSubject,
  activeSession,
  onLessonContinue,
  onSubmitLessonAnswer,
  onFinishLesson,
  onSendMessage,
  learningContext,
}: ChatPanelProps) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );

  const filteredMessages = useMemo(
    () =>
      orderedMessages.filter(
        (message) =>
          !(
            message.type === "component" &&
            message.metadata?.component === "curriculum_setup"
          )
      ),
    [orderedMessages]
  );

  const assessmentSubject = useMemo(() => {
    const slug = curriculum?.assessment?.nextSubject;
    if (!slug) {
      return null;
    }
    return (
      (curriculum?.subjects ?? []).find((subject) => subject.slug === slug) ??
      null
    );
  }, [curriculum?.assessment?.nextSubject, curriculum?.subjects]);

  const activeSubject = useMemo(() => {
    const name = activeSession?.subject;
    if (!name) {
      return null;
    }
    return (
      (curriculum?.subjects ?? []).find((subject) => subject.name === name) ??
      null
    );
  }, [activeSession?.subject, curriculum?.subjects]);

  const currentSubject = useMemo<CurriculumSubject | null>(() => {
    if (learningContext.subject) {
      return learningContext.subject;
    }

    return (
      activeSubject ??
      assessmentSubject ??
      recommendedSubject ??
      curriculum?.subjects?.[0] ??
      null
    );
  }, [
    activeSubject,
    assessmentSubject,
    recommendedSubject,
    learningContext.subject,
    curriculum?.subjects,
  ]);

  const subjectTopics = useMemo(() => {
    if (!currentSubject) {
      return [];
    }
    return curriculum?.topics?.[currentSubject.slug] ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum?.topics, currentSubject?.slug]);

  const currentTopic = useMemo(() => {
    if (!currentSubject) {
      return null;
    }

    if (
      learningContext.subject?.slug === currentSubject.slug &&
      learningContext.topic
    ) {
      return learningContext.topic;
    }

    if (
      activeSession?.subject === currentSubject.name &&
      activeSession?.topic
    ) {
      return activeSession.topic;
    }

    return subjectTopics[0] ?? null;
  }, [
    activeSession?.subject,
    activeSession?.topic,
    currentSubject,
    subjectTopics,
    learningContext.subject,
    learningContext.topic,
  ]);

  const relatedTopics = useMemo(() => {
    if (
      learningContext.subject?.slug === currentSubject?.slug &&
      learningContext.relatedTopics.length > 0
    ) {
      return learningContext.relatedTopics;
    }
    if (!currentTopic) {
      return [];
    }
    return subjectTopics.filter((topic) => topic !== currentTopic).slice(0, 3);
  }, [
    subjectTopics,
    currentTopic,
    learningContext.relatedTopics,
    learningContext.subject,
    currentSubject,
  ]);

  const userMessageCount = useMemo(
    () =>
      filteredMessages.filter((message) => message.sender === "user").length,
    [filteredMessages]
  );

  const showQuickActions = Boolean(currentTopic) && userMessageCount === 0;
  const showNavigationTip = relatedTopics.length > 0 && userMessageCount >= 2;

  const quickActions: QuickAction[] = useMemo(() => {
    if (!currentTopic || !currentSubject) {
      return [];
    }

    return [
      {
        id: "explain",
        label: t("chat.quickActionExplain"),
        prompt: t("chat.quickActionExplainPrompt", { topic: currentTopic }),
        Icon: Lightbulb,
      },
      {
        id: "examples",
        label: t("chat.quickActionExamples"),
        prompt: t("chat.quickActionExamplesPrompt", { topic: currentTopic }),
        Icon: HelpCircle,
      },
      {
        id: "relate",
        label: t("chat.quickActionRelated"),
        prompt: t("chat.quickActionRelatedPrompt", {
          topic: currentTopic,
          subject: currentSubject.name,
        }),
        Icon: Compass,
      },
    ];
  }, [currentTopic, currentSubject, t]);

  const handleSendDraft = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || !onSendMessage || isGenerating) {
      return;
    }
    setDraft("");
    void onSendMessage(trimmed);
  }, [draft, onSendMessage, isGenerating]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      if (!prompt || !onSendMessage || isGenerating) {
        return;
      }
      setDraft("");
      void onSendMessage(prompt);
    },
    [onSendMessage, isGenerating]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  const renderMessage = (message: ChatMessage) => {
    if (message.type === "component" && message.metadata?.placeholder) {
      return null;
    }

    if (
      message.type === "component" &&
      message.metadata?.component === "learning_session"
    ) {
      return (
        <div key={message.id} className="flex justify-start">
          <LearningSessionCard
            session={activeSession}
            onContinue={onLessonContinue}
            onSubmitAnswer={onSubmitLessonAnswer}
            onFinish={onFinishLesson}
          />
        </div>
      );
    }

    const isUser = message.sender === "user";
    const timestamp = formatTimestamp(message.timestamp, locale);

    if (message.type === "subject") {
      return (
        <div key={message.id} className="flex justify-start">
          <div className="max-w-[85%] space-y-2">
            <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-sky-700">
                  {message.metadata?.subject || message.content}
                </span>
                {message.metadata?.topics?.length ? (
                  <span className="text-xs font-medium text-sky-500">
                    {t("chat.topicsGenerated", {
                      count: message.metadata.topics.length,
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-sky-400">
                    {t("chat.generating")}
                  </span>
                )}
              </div>
              {message.metadata?.topics?.length ? (
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {message.metadata.topics.map((topic: string) => (
                    <li key={`${message.id}-${topic}`}>• {topic}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            {timestamp && (
              <span className="text-xs text-slate-400">{timestamp}</span>
            )}
          </div>
        </div>
      );
    }

    const assistantStyles: Record<ChatMessage["type"], string> = {
      system: "bg-sky-50 text-sky-900 border border-sky-100",
      status: "bg-sky-50 text-sky-900 border border-sky-100",
      complete: "bg-emerald-50 text-emerald-900 border border-emerald-100",
      error: "bg-red-50 text-red-900 border border-red-100",
      subject: "bg-white text-slate-900",
      user: "bg-sky-600 text-white",
      component: "bg-white text-slate-900",
    };

    const bubbleClass = isUser
      ? "bg-sky-600 text-white rounded-3xl rounded-br-none shadow-sm"
      : `${
          assistantStyles[message.type] ??
          "bg-white text-slate-900 border border-slate-200"
        } rounded-3xl rounded-bl-none shadow-sm`;

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div className="max-w-[85%] space-y-2">
          <div className={`px-4 py-3 text-sm leading-relaxed ${bubbleClass}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                  [
                    rehypeKatex,
                    { strict: false, trust: true, throwOnError: false },
                  ],
                ]}
                components={{
                  p: ({ children }) => (
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="ml-4 list-disc space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="ml-4 list-decimal space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-200 underline hover:text-white"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="rounded bg-white/20 px-1 py-0.5 text-xs">
                        {children}
                      </code>
                    ) : (
                      <code className="block rounded bg-slate-900/60 p-3 text-xs text-white">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {processLatex(message.content)}
              </ReactMarkdown>
            )}
            {message.metadata?.subject && !isUser && (
              <div className="mt-2 text-xs opacity-75">
                {t("chat.addedToCurriculum")}
              </div>
            )}
            {!isUser &&
              Array.isArray(message.metadata?.followUps) &&
              message.metadata.followUps.length > 0 &&
              onSendMessage && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.metadata.followUps.map((followUp: string) => (
                    <button
                      key={`${message.id}-follow-${followUp}`}
                      type="button"
                      onClick={() => onSendMessage(followUp)}
                      className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-50"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
            {!isUser && message.metadata?.navigationTip && (
              <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                {message.metadata.navigationTip}
              </div>
            )}
          </div>
          {timestamp && (
            <span className="text-xs text-slate-400">{timestamp}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 w-[35%] flex-col border-l border-slate-200 bg-white">
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white backdrop-blur">
            🧠
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("chat.aiTutorTitle")}</h3>
            <p className="text-xs text-sky-100">{t("chat.aiTutorSubtitle")}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-100">
            {t("chat.nowLearning")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            <BookOpen className="h-4 w-4 text-sky-100" />
            <span>{currentTopic ?? t("chat.waitingForLesson")}</span>
            {currentSubject ? (
              <span className="text-xs font-medium text-sky-100">
                {t("chat.nowLearningIn", { subject: currentSubject.name })}
              </span>
            ) : null}
          </div>

          {relatedTopics.length > 0 && (
            <p className="mt-3 text-xs text-sky-100/80">
              {t("chat.relatedTopics", { topics: relatedTopics.join(", ") })}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {filteredMessages.length === 0 && !isGenerating ? (
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
            {t("chat.aiTutorWelcome")}
          </div>
        ) : null}

        {filteredMessages.map((message) => renderMessage(message))}

        {(isGenerating || isPrimingLesson) && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-3xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>
                {isPrimingLesson
                  ? t("chat.preparingFirstLesson")
                  : t("chat.generating")}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showNavigationTip && relatedTopics[0] ? (
        <div className="border-t border-slate-200 bg-sky-50 px-6 py-3 text-xs text-sky-700">
          <span className="font-semibold">💡</span>{" "}
          {t("chat.tipNavigate", { topic: relatedTopics[0] })}
        </div>
      ) : null}

      <div className="border-t border-slate-200 bg-white p-5">
        {showQuickActions && (
          <div className="mb-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("chat.quickQuestions")}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:bg-sky-50"
                  disabled={isGenerating}
                >
                  <action.Icon className="h-4 w-4 text-sky-500" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendDraft();
              }
            }}
            placeholder={t("chat.draftPlaceholder")}
            disabled={isGenerating}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
          />
          <button
            type="button"
            onClick={handleSendDraft}
            disabled={
              isGenerating || draft.trim().length === 0 || !onSendMessage
            }
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send className="h-4 w-4" />
            {t("chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
