"use client";

import Link from "next/link";

import { AutoFlowShowcase } from "@/features/landing/components/AutoFlowShowcase";
import {
  HOW_IT_WORKS_STEPS,
  UNIQUE_POINTS,
  LEARNING_CONTEXTS,
  BETA_STATUS,
} from "../constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div
          className="h-64 w-200 rounded-full bg-sky-200/60 blur-3xl"
          aria-hidden
        />
      </div>

      <header className="sticky top-0 z-10 border-b border-sky-100 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/65">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold tracking-tight text-sky-600">
            graspy
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-full border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Explore the demo
            </Link>
            <Link
              href="mailto:hello@graspy.org"
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Contact us
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-0">
        <section className="relative overflow-hidden border-b border-sky-100 bg-linear-to-b from-sky-50 via-white to-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-32 size-104 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute -right-72 top-20 size-160 rounded-full bg-sky-300/40 blur-[180px]" />
            <div className="absolute left-1/3 top-32 hidden size-72 -translate-x-1/2 rounded-full bg-white/30 blur-3xl sm:block" />
            <div className="absolute -bottom-24 left-1/4 size-88 -translate-x-1/2 rounded-full bg-sky-100/60 blur-[150px]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-5 xl:col-span-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700 shadow-sm shadow-sky-100/60">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-xs text-white">
                    🌱
                  </span>
                  Guided for your context
                </span>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Education that reaches you, wherever you are.
                </h1>
                <p className="max-w-xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl">
                  Learn what you love, in your own language, anywhere you go,
                  even offline. Your learning travels with you.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/app"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  >
                    <span>Explore the demo</span>
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="mailto:hello@graspy.org"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300/70 bg-white px-7 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    Talk with the team
                  </Link>
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <p className="font-medium text-slate-700">
                    Languages live:{" "}
                    <span className="font-semibold text-slate-900">
                      English
                    </span>{" "}
                    |{" "}
                    <span className="font-semibold text-slate-900">Arabic</span>{" "}
                    |{" "}
                    <span className="font-semibold text-slate-900">Yoruba</span>{" "}
                    |{" "}
                    <span className="font-semibold text-slate-900">
                      Others (Beta)
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Pilots:{" "}
                    <span className="font-semibold text-slate-800">
                      3 regions
                    </span>{" "}
                    • Lessons:{" "}
                    <span className="font-semibold text-slate-800">
                      Beta phase
                    </span>
                  </p>
                </div>
              </div>

              <div className="relative flex justify-center lg:col-span-7 lg:justify-end">
                <div className="pointer-events-none absolute -top-20 right-24 hidden h-60 w-60 rounded-full bg-white/30 blur-3xl lg:block" />
                <div className="pointer-events-none absolute bottom-[-6rem] right-6 hidden h-44 w-44 rounded-full bg-sky-400/40 blur-2xl lg:block" />
                <div className="relative isolate w-full max-w-md rounded-[2.5rem] border border-sky-100/80 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 p-8 shadow-[0_40px_80px_-30px_rgba(14,116,144,0.45)]">
                  <div
                    className="absolute inset-0 rounded-[2.3rem] border border-white/20"
                    aria-hidden
                  />
                  <div className="space-y-6 text-white">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                      <span>What learners see</span>
                      <span className="inline-flex items-center gap-1 text-white/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Live loop
                      </span>
                    </div>
                    <AutoFlowShowcase />
                    <p className="text-xs text-white/70">
                      Co-designed with educators testing the beta to feel
                      supportive, hopeful, and culturally familiar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-b border-sky-100 bg-white py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              A simple flow that works online today, with offline rolling out
              during beta.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-sky-100 bg-sky-50  py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              What makes graspy unique.
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Clear strengths, with honest beta status.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {UNIQUE_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 shadow-sm transition hover:border-sky-200 hover:bg-white"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                    {point.status}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-sky-100 bg-white  py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Wherever you learn.
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Short cards that link to tailored support. Pick the path that fits
              your learners today.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {LEARNING_CONTEXTS.map((context) => (
                <div
                  key={context.title}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {context.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {context.summary}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <Link
                      href={context.href}
                      className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700"
                    >
                      {context.ctaLabel ?? "Contact for this use case"}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-linear-to-br from-sky-600 via-sky-700 to-sky-800 py-16 text-white">
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
                Beta status
              </p>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                What&apos;s live and what&apos;s next.
              </h2>
              <p className="text-base text-sky-100">
                Clarity over fluff. Here&apos;s the transparent state of things.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white">Live today</h3>
                <ul className="mt-4 space-y-3 text-sm text-sky-100">
                  {BETA_STATUS.live.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-sky-200">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white">In pilot</h3>
                <ul className="mt-4 space-y-3 text-sm text-sky-100">
                  {BETA_STATUS.pilot.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-sky-200">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white">
                  Coming next
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-sky-100">
                  {BETA_STATUS.next.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-sky-200">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-sm text-sky-200">
              Timelines may shift during beta. We&apos;ll publish changes in
              release notes.
            </p>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-sky-700 bg-sky-900 py-14 text-sky-50"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Ready to bring graspy to your learners?
          </h2>
          <p className="text-base text-sky-100">
            Try the beta demo or reach out. Your feedback now shapes what
            learners see tomorrow.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore the demo
            </Link>
            <Link
              href="mailto:hello@graspy.org"
              className="inline-flex items-center justify-center rounded-full border border-sky-200 px-6 py-3 text-base font-semibold text-sky-50 transition hover:bg-sky-800"
            >
              Contact us
            </Link>
          </div>
          <p className="text-xs text-sky-200">
            We&apos;re listening closely during beta—share your ideas and
            we&apos;ll learn with you.
          </p>
        </div>
      </footer>
    </div>
  );
}
