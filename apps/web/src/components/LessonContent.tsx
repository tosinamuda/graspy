"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { LessonContentPayload } from "@/lib/curriculum-api";
import type { LessonSlide } from "@/lib/lesson-types";
import { processLatex } from "@/lib/latex";
import "katex/dist/katex.min.css";
import "katex/dist/contrib/mhchem.mjs";

interface LessonContentProps {
  lesson: LessonContentPayload;
  subject: string;
  topicIndex: number;
  totalTopics: number;
  onComplete?: () => void;
}

export default function LessonContent({
  lesson,
  subject,
  topicIndex,
  totalTopics,
  onComplete,
}: LessonContentProps) {
  const slides = lesson.slides ?? [];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isCheckpointActive, setIsCheckpointActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!slides.length) {
      setActiveSlideIndex(0);
      return;
    }

    setActiveSlideIndex((previous) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, previous));
      return clamped;
    });
  }, [slides.length]);

  const activeSlide: LessonSlide | undefined = slides[activeSlideIndex];

  useEffect(() => {
    setIsCheckpointActive(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [activeSlideIndex]);

  const isFinalSlide =
    slides.length > 0 && activeSlideIndex === slides.length - 1;
  const assessment = activeSlide?.assessment;
  const hasAssessment = Boolean(assessment);
  const hasChoiceAssessment = Boolean(
    assessment &&
      assessment.type === "choice" &&
      (assessment.options?.length ?? 0) > 0
  );

  const canGoPrev = activeSlideIndex > 0;
  const canGoNext = activeSlideIndex < slides.length - 1;

  const handleSlideNav = (direction: "prev" | "next") => {
    if (!slides.length) {
      return;
    }

    setActiveSlideIndex((previous) => {
      if (direction === "prev") {
        return Math.max(0, previous - 1);
      }
      return Math.min(slides.length - 1, previous + 1);
    });
  };

  const beginCheckpoint = () => {
    if (!assessment) {
      return;
    }
    setIsCheckpointActive(true);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const exitCheckpoint = () => {
    setIsCheckpointActive(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (!hasChoiceAssessment) {
      return;
    }
    setSelectedAnswer(index);
    setShowFeedback(false);
  };

  const handleSubmitAnswer = () => {
    if (hasChoiceAssessment && selectedAnswer === null) {
      return;
    }
    setShowFeedback(true);
  };

  const advanceAfterCheckpoint = () => {
    if (isFinalSlide) {
      onComplete?.();
    } else {
      handleSlideNav("next");
    }
    exitCheckpoint();
  };

  const formatSlideType = (slideType: LessonSlide["slideType"]): string => {
    switch (slideType) {
      case "concept_introduction":
        return "Concept introduction";
      case "worked_example":
        return "Worked example";
      case "scaffolded_problem":
        return "Scaffolded practice";
      case "misconception":
        return "Misconception check";
      case "synthesis":
        return "Synthesis & reflection";
      default:
        return "Slide";
    }
  };

  const isCorrect =
    hasChoiceAssessment && selectedAnswer === assessment?.answerIndex;
  const canAdvance = !hasChoiceAssessment || showFeedback;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-sky-600">{subject}</p>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
          <span>📖</span>
          <span>{lesson.title}</span>
        </h1>
        <p className="text-sm text-gray-500">
          Topic {topicIndex + 1} of {Math.max(totalTopics, 1)}
        </p>
        <div className="h-2 w-full rounded-full bg-sky-100">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all"
            style={{
              width: `${Math.min(
                100,
                ((topicIndex + 1) / Math.max(totalTopics, 1)) * 100
              )}%`,
            }}
          />
        </div>
      </header>

      {activeSlide && (
        <section className="relative rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div
            className={`relative transition-all duration-500 ease-in-out ${
              isCheckpointActive
                ? "pointer-events-none opacity-25"
                : "pointer-events-auto opacity-100"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  {formatSlideType(activeSlide.slideType)}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeSlide.title}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Slide {activeSlideIndex + 1} of {slides.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSlideNav("prev")}
                  disabled={!canGoPrev || isCheckpointActive}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    !canGoPrev || isCheckpointActive
                      ? "cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700"
                  }`}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleSlideNav("next")}
                  disabled={!canGoNext || isCheckpointActive}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    !canGoNext || isCheckpointActive
                      ? "cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-800">
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
                    <p className="leading-relaxed">{children}</p>
                  ),
                  li: ({ children }) => (
                    <li className="ml-4 list-disc leading-relaxed">
                      {children}
                    </li>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-2 list-decimal ml-6">{children}</ol>
                  ),
                  code: ({ children, className }) => {
                    // Handle TikZ graphics
                    if (className?.includes("language-tikz")) {
                      return (
                        <div className="flex justify-center my-6 overflow-x-auto">
                          <script
                            type="text/tikz"
                            dangerouslySetInnerHTML={{
                              __html: String(children),
                            }}
                          />
                        </div>
                      );
                    }

                    // Inline code - don't apply styles if it's math (KaTeX will handle it)
                    if (className?.includes("language-math")) {
                      return <code>{children}</code>;
                    }
                    return (
                      <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-sm font-mono text-indigo-900">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm">
                      {children}
                    </pre>
                  ),
                }}
              >
                {processLatex(activeSlide.bodyMd)}
              </ReactMarkdown>
            </div>
          </div>

          {hasAssessment && !isCheckpointActive && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={beginCheckpoint}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100"
              >
                {isFinalSlide
                  ? "Start final assessment"
                  : "Check understanding"}
              </button>
            </div>
          )}
        </section>
      )}

      {isMounted &&
        hasAssessment &&
        isCheckpointActive &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-indigo-200 bg-white px-8 py-10 text-base shadow-2xl sm:px-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {isFinalSlide ? "Class assessment" : "Checkpoint"}
                  </p>
                  <div className="mt-1 text-base font-semibold leading-snug text-indigo-900">
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
                          <span className="inline">{children}</span>
                        ),
                      }}
                    >
                      {processLatex(assessment?.prompt ?? "")}
                    </ReactMarkdown>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exitCheckpoint}
                  className="text-xs font-semibold text-indigo-500 transition hover:text-indigo-700 shrink-0"
                >
                  Back to lesson
                </button>
              </div>

              {hasChoiceAssessment ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
                  {assessment?.options?.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrectAnswer = index === assessment.answerIndex;
                    const showAsCorrect = showFeedback && isCorrectAnswer;
                    const showAsIncorrect =
                      showFeedback && isSelected && !isCorrect;

                    return (
                      <button
                        type="button"
                        key={`checkpoint-option-${index}`}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showFeedback}
                        className={`w-full rounded-lg border-2 p-5 text-left text-base transition ${
                          showAsCorrect
                            ? "border-emerald-500 bg-emerald-50"
                            : showAsIncorrect
                            ? "border-rose-500 bg-rose-50"
                            : isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-indigo-200 bg-white hover:border-indigo-400"
                        } ${
                          showFeedback ? "cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0 mt-0.5 ${
                              showAsCorrect
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : showAsIncorrect
                                ? "border-rose-600 bg-rose-600 text-white"
                                : isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-indigo-200 text-indigo-500"
                            }`}
                          >
                            {showAsCorrect
                              ? "✓"
                              : showAsIncorrect
                              ? "✗"
                              : isSelected
                              ? "●"
                              : ""}
                          </div>
                          <div className="flex-1 text-indigo-900 leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[
                                [
                                  rehypeKatex,
                                  {
                                    strict: false,
                                    trust: true,
                                    throwOnError: false,
                                  },
                                ],
                              ]}
                              components={{
                                p: ({ children }) => (
                                  <span className="inline">{children}</span>
                                ),
                              }}
                            >
                              {processLatex(option)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                  <p>
                    Take a moment to compose your response. When you are ready,
                    send your thinking to the tutor chat so it can guide you
                    forward.
                  </p>
                </div>
              )}

              {hasChoiceAssessment && !showFeedback && (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className={`mt-4 w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition ${
                    selectedAnswer === null
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-indigo-700"
                  }`}
                >
                  Check answer
                </button>
              )}

              {hasChoiceAssessment && showFeedback && (
                <div
                  className={`mt-4 rounded-lg border p-4 text-sm ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  <p className="mb-2 font-semibold">
                    {isCorrect ? "Great job!" : "Let's review together."}
                  </p>
                  <div>
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
                          <p className="inline">{children}</p>
                        ),
                      }}
                    >
                      {processLatex(
                        isCorrect
                          ? assessment?.correctFeedback ??
                              "Tell the tutor how you solved it so you can reinforce the idea."
                          : assessment?.incorrectFeedback ??
                              "Share with the tutor where it felt tricky, then try again with their help."
                      )}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-indigo-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={exitCheckpoint}
                  className="font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  Return to content
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canAdvance) {
                      handleSubmitAnswer();
                      return;
                    }
                    advanceAfterCheckpoint();
                  }}
                  disabled={!canAdvance}
                  className={`inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    canAdvance
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isFinalSlide ? "Complete lesson" : "Next slide"}
                </button>
              </div>

              <p className="mt-2 text-xs text-indigo-500">
                After you answer, tell the tutor what you chose so it can
                celebrate wins or help with the next step.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
