import {
  AGE_GROUP_OPTIONS,
  SCHOOL_GRADE_OPTIONS,
  type GradeLevelValue,
} from "./GRADE_LEVELS";

const DEFAULT_GRADE_DESCRIPTOR = "middle school learners";

const GRADE_BUCKET_DESCRIPTORS: Record<GradeLevelValue, string> = {
  beginner: "early primary learners (ages 6-8)",
  elementary: "upper primary learners (ages 9-11)",
  middle: "middle school learners (ages 12-14)",
  high: "secondary school learners (ages 15-17)",
};

function humanizeIdentifier(value: string): string {
  const spaced = value.replace(/[_-]+/g, " ").trim();
  if (!spaced) {
    return DEFAULT_GRADE_DESCRIPTOR;
  }

  return spaced.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function resolveGradeLevelDescriptor({
  gradeLevel,
  schoolGrade,
  ageRange,
}: {
  gradeLevel?: string | null;
  schoolGrade?: string | null;
  ageRange?: string | null;
}): string {
  if (schoolGrade) {
    const matched = SCHOOL_GRADE_OPTIONS.find(
      (option) => option.value === schoolGrade
    );
    return matched?.label ?? humanizeIdentifier(schoolGrade);
  }

  if (ageRange) {
    const matched = AGE_GROUP_OPTIONS.find(
      (option) => option.value === ageRange
    );
    if (matched) {
      const descriptor = GRADE_BUCKET_DESCRIPTORS[matched.gradeLevel];
      if (descriptor) {
        return descriptor;
      }
      return `${matched.label} learners`;
    }
  }

  if (gradeLevel) {
    const trimmed = gradeLevel.trim();
    if (!trimmed) {
      return DEFAULT_GRADE_DESCRIPTOR;
    }

    const normalized = trimmed.toLowerCase() as GradeLevelValue;
    if (
      Object.prototype.hasOwnProperty.call(GRADE_BUCKET_DESCRIPTORS, normalized)
    ) {
      return (
        GRADE_BUCKET_DESCRIPTORS[normalized as GradeLevelValue] ??
        DEFAULT_GRADE_DESCRIPTOR
      );
    }

    return trimmed;
  }

  return DEFAULT_GRADE_DESCRIPTOR;
}
