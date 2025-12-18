"use client";

import { CheckCircle, ChevronRight } from "lucide-react";

import { GenerationStats } from "../types";

export default function CurriculumReadyView({
  stats,
  subjects,
  generatedAt,
  onContinue,
}: {
  stats: GenerationStats;
  subjects: string[];
  generatedAt: Date | null;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-10 shadow-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-14 w-14 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900">
          Your curriculum is ready!
        </h2>
        <p className="mt-4 text-base text-slate-600">
          We built a personalized path across {stats.topicCount} topics. Jump in
          when you are ready.
        </p>

        {subjects.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {subjects.map((subject) => (
              <span
                key={subject}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700"
              >
                {subject}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
            <p className="text-3xl font-bold text-sky-700">
              {stats.subjectCount}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-sky-600">
              Subjects
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-3xl font-bold text-indigo-700">
              {stats.topicCount}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Topics
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-5 text-left text-sm text-sky-800">
          <p className="font-semibold">✨ Graspy says</p>
          <p className="mt-2">
            Everything is sequenced by difficulty and pace. Expect about 45
            minutes per subject each week—adjust anytime as you learn.
          </p>
          {generatedAt && (
            <p className="mt-3 text-xs font-medium text-sky-600">
              Generated{" "}
              {generatedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-500 px-6 py-4 text-lg font-semibold text-white transition hover:from-sky-600 hover:to-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          View your learning plan
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
