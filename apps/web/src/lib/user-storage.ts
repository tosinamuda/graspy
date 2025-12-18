/**
 * User Profile LocalStorage Management
 * Handles saving and retrieving user data from browser localStorage
 */

import { setLocaleCookie } from "./locale-cookie";
import type { GradeLevelValue } from "./GRADE_LEVELS";

export interface UserProfile {
  id: string;
  country: string;
  language: string;
  gradeLevel: string;
  gradeLevelBand: GradeLevelValue | "";
  educationStatus: "in_school" | "out_of_school" | "";
  knowsGradeLevel: boolean | null;
  schoolGrade: string;
  ageRange: string;
  preferredSubjects: string[];
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

const USER_PROFILE_KEY = "graspy_user_profile";

/**
 * Generate a simple unique ID
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function withDefaults(profile: Partial<UserProfile>): UserProfile {
  const normalizedBand = (() => {
    const provided = profile.gradeLevelBand;
    if (typeof provided === "string" && provided) {
      return provided as GradeLevelValue | "";
    }
    const candidate = (profile.gradeLevel ?? "").toLowerCase();
    if (
      candidate === "beginner" ||
      candidate === "elementary" ||
      candidate === "middle" ||
      candidate === "high"
    ) {
      return candidate as GradeLevelValue;
    }
    return "";
  })();

  return {
    id: profile.id ?? generateUserId(),
    country: profile.country ?? "",
    language: profile.language ?? "",
    gradeLevel: profile.gradeLevel ?? "",
    gradeLevelBand: normalizedBand,
    educationStatus: profile.educationStatus ?? "",
    knowsGradeLevel:
      typeof profile.knowsGradeLevel === "boolean"
        ? profile.knowsGradeLevel
        : null,
    schoolGrade: profile.schoolGrade ?? "",
    ageRange: profile.ageRange ?? "",
    preferredSubjects: Array.isArray(profile.preferredSubjects)
      ? profile.preferredSubjects
      : [],
    createdAt: profile.createdAt ?? new Date().toISOString(),
    updatedAt: profile.updatedAt ?? new Date().toISOString(),
    onboardingCompleted: profile.onboardingCompleted ?? false,
  };
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = getUserProfile();

  const base: Partial<UserProfile> = {
    ...existing,
    ...profile,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedProfile = withDefaults(base);

  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

  // Also save language to cookie for server-side access
  if (updatedProfile.language) {
    setLocaleCookie(updatedProfile.language);
  }

  return updatedProfile;
}

/**
 * Get user profile from localStorage
 */
export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<UserProfile>;
    return withDefaults(parsed);
  } catch (error) {
    console.error("Error reading user profile:", error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  const profile = getUserProfile();
  return profile?.onboardingCompleted ?? false;
}

/**
 * Clear user profile (for testing or reset)
 */
export function clearUserProfile(): void {
  localStorage.removeItem(USER_PROFILE_KEY);
}

/**
 * Update specific fields in user profile
 */
export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  return saveUserProfile(updates);
}
