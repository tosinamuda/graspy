import { SUPPORTED_LANGUAGES } from "@/lib/locale";
import type { CurriculumSubject } from "@/lib/curriculum-db";

export type StepKey = "profile" | "subjects";

export type EducationStatus = "in_school" | "out_of_school" | "";

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export interface CurriculumData {
  country: string;
  countryName?: string;
  language: string;
  languageName?: string;
  gradeLevel: string;
  subjects: CurriculumSubject[];
  topics: Record<string, string[]>;
  assessment: {
    nextSubject: string | null;
  };
}

export type AgentLogEntry = {
  id: string;
  timestamp: string;
  label: string;
  payload: string;
};

export type GeneratedSubject = {
  id: string;
  label: string;
  recommended: boolean;
};

export type CompletionPhase = "form" | "generating" | "ready";
export type GenerationTimelineStep =
  | "analyzing"
  | "generating"
  | "personalizing";

export interface GenerationStats {
  subjectCount: number;
  topicCount: number;
}
