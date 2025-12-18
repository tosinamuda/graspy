"use client";
import { EducationStatus, StepKey, GenerationTimelineStep } from "./types";

export const SUBJECT_SELECTION_LIMIT = 15;
export const EDUCATION_OPTIONS: Array<{
  id: EducationStatus;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "in_school",
    title: "Yes, I attend school",
    description: "Match lessons to my classroom level and keep me on track.",
    icon: "🏫",
  },
  {
    id: "out_of_school",
    title: "No, I'm learning independently",
    description:
      "Help me pick the right level and support my own learning path.",
    icon: "🌍",
  },
];
export const GRADE_KNOWLEDGE_OPTIONS: Array<{
  id: "knows" | "needs_help";
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "knows",
    title: "I know my grade level",
    description: "Choose the grade or class that fits me best.",
    icon: "📘",
  },
  {
    id: "needs_help",
    title: "Help me choose",
    description: "Use my age to pick a helpful starting point.",
    icon: "🧭",
  },
];
export const STEP_TITLES: Record<StepKey, string> = {
  profile: "Tell us about yourself",
  subjects: "Great! Pick what you want to learn first.",
};
export const STEP_DESCRIPTIONS: Partial<Record<StepKey, string>> = {
  profile: "We use this to personalize your learning experience.",
  subjects:
    "We pre-selected a few based on your level—add or change anything you like.",
};
export const GENERATION_STEP_SEQUENCE: GenerationTimelineStep[] = [
  "analyzing",
  "generating",
  "personalizing",
];
export const GENERATION_STEP_META: Record<
  GenerationTimelineStep,
  { label: string; description: string }
> = {
  analyzing: {
    label: "Analyzing your profile",
    description: "Understanding your learning preferences and level",
  },
  generating: {
    label: "Generating curricula",
    description: "Building personalized lesson sequences",
  },
  personalizing: {
    label: "Personalizing your path",
    description: "Optimizing pacing and topic flow",
  },
};
