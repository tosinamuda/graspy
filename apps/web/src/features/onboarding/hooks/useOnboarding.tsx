"use client";
import {
  getAllCountries,
  SUPPORTED_LANGUAGES,
  getCountryName,
  getLanguageName,
  getLanguageInfo,
  type Country,
} from "@/lib/locale";
import { type GradeLevelValue, SUBJECT_OPTIONS } from "@/lib/GRADE_LEVELS";
import { type CurriculumRequest, streamCurriculum } from "@/lib/curriculum-api";
import {
  type CurriculumSubject,
  saveCurriculum,
  deleteCurriculum,
} from "@/lib/curriculum-db";
import { resolveGradeLevelDescriptor } from "@/lib/grade-level";
import { useI18n } from "@/lib/i18n-context";
import { detectLocale } from "@/lib/locale-detector";
import { createSlug } from "@/lib/slug";
import { getUserProfile, saveUserProfile } from "@/lib/user-storage";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  GENERATION_STEP_SEQUENCE,
  SUBJECT_SELECTION_LIMIT,
} from "../constants";
import {
  EducationStatus,
  GeneratedSubject,
  SupportedLanguageCode,
  StepKey,
  CompletionPhase,
  GenerationTimelineStep,
  GenerationStats,
} from "../types";

export default function useOnboarding() {
  const router = useRouter();
  const { setLocale } = useI18n();

  const [isClient, setIsClient] = useState(false);
  const [autoDetected, setAutoDetected] = useState({
    country: "",
    language: "",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [educationStatus, setEducationStatus] = useState<EducationStatus>("");
  const [knowsGradeLevel, setKnowsGradeLevel] = useState<boolean | null>(null);
  const [schoolGrade, setSchoolGrade] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevelValue | "">("");
  const gradeLevelDescriptor = useMemo(
    () =>
      resolveGradeLevelDescriptor({
        gradeLevel,
        schoolGrade,
        ageRange,
      }),
    [ageRange, gradeLevel, schoolGrade]
  );

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsSeeded, setSubjectsSeeded] = useState(false);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<
    GeneratedSubject[]
  >([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Auto-detect locale on mount
  useEffect(() => {
    setIsClient(true);

    const existingProfile = getUserProfile();
    if (existingProfile?.onboardingCompleted) {
      router.push("/app/learn");
      return;
    }

    const countries = getAllCountries();
    setAllCountries(countries);

    const detected = detectLocale();
    const countryCode = detected.country !== "UNKNOWN" ? detected.country : "";
    const detectedLang = SUPPORTED_LANGUAGES.includes(
      detected.language as SupportedLanguageCode
    );
    const langCode = detectedLang ? detected.language : "en";

    setAutoDetected({ country: countryCode, language: langCode });
    setCountry(countryCode);
    setLanguage(langCode);
  }, [router]);

  const steps = useMemo<StepKey[]>(() => {
    return ["profile", "subjects"];
  }, []);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(steps.length - 1, 0));
    }
  }, [steps, stepIndex]);

  const currentStep = steps[stepIndex] ?? "profile";

  const countryOptions = useMemo(() => {
    const detectedCode = autoDetected.country;
    const detectedOptions = [];

    if (detectedCode) {
      detectedOptions.push({
        value: detectedCode,
        label: getCountryName(detectedCode),
        group: "Suggested",
      });
    }

    const otherOptions = allCountries
      .filter((c) => c.code !== detectedCode)
      .map((c) => ({
        value: c.code,
        label: getCountryName(c.code),
        group: "All Countries",
      }));

    return [...detectedOptions, ...otherOptions];
  }, [allCountries, autoDetected.country]);

  const languageOptions = useMemo(() => {
    const currentCountry = allCountries.find((c) => c.code === country);
    const suggestedCodes = currentCountry?.languages || [];

    const suggestedOptions = suggestedCodes.map((langCode) => {
      const info = getLanguageInfo(langCode);
      return {
        value: langCode,
        label: `${info.nativeName} (${info.name})`,
        group: "Suggested",
      };
    });

    const suggestedValues = new Set(suggestedCodes);

    // Include all SUPPORTED_LANGUAGES in the "All Languages" group,
    // excluding those already shown in Suggested.
    const allOtherOptions = SUPPORTED_LANGUAGES.filter(
      (langCode) => !suggestedValues.has(langCode)
    ).map((langCode) => {
      const info = getLanguageInfo(langCode);
      return {
        value: langCode,
        label: `${info.nativeName} (${info.name})`,
        group: "All Languages",
      };
    });

    // Sort "All Languages" alphabetically by label for easier searching
    allOtherOptions.sort((a, b) => a.label.localeCompare(b.label));

    return [...suggestedOptions, ...allOtherOptions];
  }, [country, allCountries]);

  const subjectStreamRef = useRef<EventSource | null>(null);
  const availableSubjectsRef = useRef<GeneratedSubject[]>([]);
  const selectedSubjectsRef = useRef<string[]>([]);
  const [subjectsStatusMessage, setSubjectsStatusMessage] = useState("");
  const [subjectsSelectionError, setSubjectsSelectionError] = useState("");
  const [completionPhase, setCompletionPhase] =
    useState<CompletionPhase>("form");
  const [generationStep, setGenerationStep] =
    useState<GenerationTimelineStep>("analyzing");
  const [generationStats, setGenerationStats] =
    useState<GenerationStats | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationCompletedAt, setGenerationCompletedAt] =
    useState<Date | null>(null);
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>(
    []
  );
  const generationRunIdRef = useRef<number | null>(null);
  const lastGenerationRequestRef = useRef<CurriculumRequest | null>(null);
  const gradeLevelDescriptorRef = useRef<string | null>(null);

  const fetchSubjects = useCallback(() => {
    if (!country || !language || !educationStatus) {
      setSubjectsError("Update previous steps to choose subjects.");
      setSubjectsLoading(false);
      setSubjectsStatusMessage("");
      return;
    }

    if (subjectStreamRef.current) {
      subjectStreamRef.current.close();
      subjectStreamRef.current = null;
    }

    setSubjectsLoading(true);
    setSubjectsError(null);
    setSubjectsStatusMessage("Connecting to Graspy's learning guide…");
    setAvailableSubjects([]);
    setSelectedSubjects([]);
    setSubjectsSeeded(false);
    availableSubjectsRef.current = [];
    selectedSubjectsRef.current = [];
    setSubjectsSelectionError("");

    const params = new URLSearchParams({
      country: getCountryName(country) || country,
      language: getLanguageInfo(language)?.name || language,
      educationStatus,
    });

    if (gradeLevelDescriptor) params.append("gradeLevel", gradeLevelDescriptor);
    if (schoolGrade) params.append("schoolGrade", schoolGrade);
    if (ageRange) params.append("ageRange", ageRange);

    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    const endpointBase = apiBase || "/api";
    const endpoint = `${endpointBase}/subjects/generate-stream?${params.toString()}`;

    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        setSubjectsStatusMessage("");
        setSubjectsLoading(false);
        eventSource.close();
        subjectStreamRef.current = null;
        return;
      }

      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "status") {
          setSubjectsStatusMessage(payload.message || "Generating subjects…");
          return;
        }

        if (payload.type === "error") {
          setSubjectsError(
            payload.message || "We could not load subjects. Try again?"
          );
          setSubjectsStatusMessage("");
          setSubjectsLoading(false);
          eventSource.close();
          subjectStreamRef.current = null;
          return;
        }

        if (payload.type === "subjects") {
          setAvailableSubjects((prev) => {
            if (!Array.isArray(payload.subjects)) return prev;
            const existingIds = new Set(prev.map((subject) => subject.id));
            const merged = [...prev];
            for (const rawSubject of payload.subjects as Array<{
              id?: string;
              label?: string;
              recommended?: boolean;
            }>) {
              if (
                !rawSubject ||
                typeof rawSubject.id !== "string" ||
                typeof rawSubject.label !== "string"
              )
                continue;
              if (existingIds.has(rawSubject.id)) continue;
              const nextSubject: GeneratedSubject = {
                id: rawSubject.id,
                label: rawSubject.label,
                recommended: Boolean(rawSubject.recommended),
              };
              merged.push(nextSubject);
              existingIds.add(rawSubject.id);
            }
            availableSubjectsRef.current = merged;
            return merged;
          });
          if (payload.message) {
            setSubjectsStatusMessage(payload.message);
          }
          return;
        }

        if (payload.type === "normalized_grade") {
          // Capture normalized grade from backend (e.g. "Grade 7" -> "JSS 1")
          if (payload.normalized) {
            console.log(
              `[Onboarding] Normalized grade updated: ${payload.original} -> ${payload.normalized}`
            );
            gradeLevelDescriptorRef.current = payload.normalized;
          }
          return;
        }

        if (payload.type === "complete") {
          setSubjectsStatusMessage(payload.message || "Subjects are ready.");
          setSubjectsLoading(false);
          eventSource.close();
          subjectStreamRef.current = null;
        }
      } catch (error) {
        console.error("Failed to parse subject stream event", error);
      }
    };

    eventSource.onerror = () => {
      setSubjectsError("Connection lost while loading subjects. Try again?");
      setSubjectsStatusMessage("");
      setSubjectsLoading(false);
      setSubjectsSelectionError("");
      eventSource.close();
      subjectStreamRef.current = null;
    };

    subjectStreamRef.current = eventSource;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageRange, country, educationStatus, gradeLevel, language, schoolGrade]);

  useEffect(() => {
    if (currentStep === "subjects") {
      fetchSubjects();
    } else if (subjectStreamRef.current) {
      subjectStreamRef.current.close();
      subjectStreamRef.current = null;
      setSubjectsStatusMessage("");
    }
  }, [currentStep, fetchSubjects]);

  useEffect(
    () => () => {
      if (subjectStreamRef.current) {
        subjectStreamRef.current.close();
        subjectStreamRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    availableSubjectsRef.current = availableSubjects;
  }, [availableSubjects]);

  useEffect(() => {
    selectedSubjectsRef.current = selectedSubjects;
  }, [selectedSubjects]);

  // Warm up N-Atlas model for Nigerian languages
  useEffect(() => {
    if (["yo", "ha", "ig"].includes(language)) {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
        /\/$/,
        ""
      );
      const endpointBase = apiBase || "/api";
      // Fire and forget
      fetch(`${endpointBase}/system/warmup?language=${language}`).catch((err) =>
        console.warn("Failed to warm up model", err)
      );
    }
  }, [language]);

  useEffect(() => {
    if (
      currentStep === "subjects" &&
      !subjectsSeeded &&
      !subjectsLoading &&
      !subjectsError &&
      availableSubjects.length > 0
    ) {
      const recommendedInList = availableSubjects
        .filter((subject) => subject.recommended)
        .map((subject) => subject.id);
      if (recommendedInList.length > 0) {
        setSelectedSubjects(recommendedInList);
        selectedSubjectsRef.current = recommendedInList;
      }
      setSubjectsSeeded(true);
    }
  }, [
    availableSubjects,
    currentStep,
    subjectsError,
    subjectsLoading,
    subjectsSeeded,
  ]);

  const progressPercent = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round(((stepIndex + 1) / steps.length) * 100);
  }, [stepIndex, steps.length]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "profile":
        // Valid if country, language, AND schoolGrade are selected
        return Boolean(country && language && schoolGrade);
      case "subjects":
        return (
          !subjectsLoading && !subjectsError && selectedSubjects.length > 0
        );
      default:
        return false;
    }
  }, [
    country,
    currentStep,
    language,
    schoolGrade,
    selectedSubjects.length,
    subjectsError,
    subjectsLoading,
  ]);

  const runGenerationAnimation = useCallback((runId: number) => {
    const advance = async () => {
      for (let index = 1; index < GENERATION_STEP_SEQUENCE.length; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (generationRunIdRef.current !== runId) {
          return;
        }
        const nextStep = GENERATION_STEP_SEQUENCE[index];
        setGenerationStep((prev) => {
          const prevIndex = GENERATION_STEP_SEQUENCE.indexOf(prev);
          return prevIndex < index ? nextStep : prev;
        });
      }
    };
    return advance();
  }, []);

  const runCurriculumGeneration = useCallback(
    async (request: CurriculumRequest, runId: number) => {
      const subjectMap = new Map<string, CurriculumSubject>();
      const topics: Record<string, string[]> = {};
      let nextSubject: CurriculumSubject | null = null;

      const fullCountryName = getCountryName(request.country);
      const fullLanguageName = getLanguageName(request.language);

      // Create a modified request with full names for the API
      const apiRequest = {
        ...request,
        country: fullCountryName,
        language: fullLanguageName,
      };

      const stream = streamCurriculum(apiRequest);

      for await (const chunk of stream) {
        if (generationRunIdRef.current !== runId) {
          return null;
        }

        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (Array.isArray(chunk.subjects)) {
          for (const incoming of chunk.subjects as Array<
            CurriculumSubject | string
          >) {
            if (!incoming) {
              continue;
            }

            if (typeof incoming === "string") {
              const name = incoming.trim();
              if (!name) {
                continue;
              }

              const existing = Array.from(subjectMap.values()).find(
                (subject) => subject.name === name
              );
              if (existing) {
                if (!nextSubject) {
                  nextSubject = existing;
                }
                continue;
              }

              const slug = createSlug(name, new Set(subjectMap.keys()));
              if (subjectMap.has(slug)) {
                continue;
              }

              const subject: CurriculumSubject = { name, slug };
              subjectMap.set(slug, subject);
              if (!nextSubject) {
                nextSubject = subject;
              }
              continue;
            }

            const name = incoming.name?.trim();
            const slug = incoming.slug?.trim();
            if (!name || !slug) {
              continue;
            }

            const existing = subjectMap.get(slug);
            if (existing) {
              if (existing.name !== name) {
                existing.name = name;
              }
              if (!nextSubject) {
                nextSubject = existing;
              }
              continue;
            }

            const subject: CurriculumSubject = { name, slug };
            subjectMap.set(slug, subject);
            if (!nextSubject) {
              nextSubject = subject;
            }
          }
        }

        if (chunk.topics) {
          for (const [key, subjectTopics] of Object.entries(chunk.topics)) {
            if (!Array.isArray(subjectTopics) || subjectTopics.length === 0) {
              continue;
            }

            const subject =
              subjectMap.get(key) ??
              Array.from(subjectMap.values()).find(
                (candidate) => candidate.name === key
              );
            const slugKey = subject ? subject.slug : key;
            topics[slugKey] = subjectTopics;
          }
        }
      }

      if (generationRunIdRef.current !== runId) {
        return null;
      }

      const normalizedSubjects = Array.from(subjectMap.values());

      if (normalizedSubjects.length === 0) {
        throw new Error("No subjects were generated.");
      }

      const totalTopics = Object.values(topics).reduce(
        (count, subjectTopics) => count + subjectTopics.length,
        0
      );

      const countryName = getCountryName(request.country);
      const languageName = getLanguageName(request.language);

      await saveCurriculum({
        country: countryName,
        countryName,
        language: languageName,
        languageName,
        gradeLevel: request.gradeLevel ?? "middle school learners",
        subjects: normalizedSubjects,
        topics,
        assessment: {
          nextSubject: (nextSubject ?? normalizedSubjects[0])?.slug ?? null,
        },
      });

      return {
        subjectCount: normalizedSubjects.length,
        topicCount: totalTopics,
      } satisfies GenerationStats;
    },
    []
  );

  const startGenerationFlow = useCallback(
    async (params: {
      request: CurriculumRequest;
      subjectNames: string[];
      profileSnapshot: {
        country: string;
        language: string;
        educationStatus: EducationStatus;
        knowsGradeLevel: boolean | null;
        schoolGrade: string;
        ageRange: string;
        gradeLevel: GradeLevelValue;
        gradeLevelDescriptor: string;
        preferredSubjects: string[];
      };
    }) => {
      const { request, subjectNames, profileSnapshot } = params;
      const runId = Date.now();
      generationRunIdRef.current = runId;
      lastGenerationRequestRef.current = request;

      setCompletionPhase("generating");
      setGenerationError(null);
      setGenerationStats(null);
      setGenerationStep("analyzing");
      setGenerationCompletedAt(null);
      setSelectedSubjectNames(subjectNames);
      setIsCompleting(true);

      try {
        await setLocale(profileSnapshot.language);
      } catch (error) {
        console.warn("Failed to update locale before generation", error);
      }

      saveUserProfile({
        country: profileSnapshot.country,
        language: profileSnapshot.language,
        educationStatus: profileSnapshot.educationStatus,
        knowsGradeLevel: profileSnapshot.knowsGradeLevel,
        schoolGrade: profileSnapshot.schoolGrade,
        ageRange: profileSnapshot.ageRange,
        gradeLevel: profileSnapshot.gradeLevelDescriptor,
        gradeLevelBand: profileSnapshot.gradeLevel,
        preferredSubjects: profileSnapshot.preferredSubjects,
        onboardingCompleted: false,
      });

      try {
        await deleteCurriculum();
      } catch (error) {
        console.warn("Failed to clear existing curriculum cache", error);
      }

      const animationPromise = runGenerationAnimation(runId);

      try {
        const result = await runCurriculumGeneration(request, runId);
        if (generationRunIdRef.current !== runId || !result) {
          return;
        }

        setGenerationStats(result);

        await animationPromise;

        if (generationRunIdRef.current !== runId) {
          return;
        }

        setGenerationStep("personalizing");
        setGenerationCompletedAt(new Date());
        saveUserProfile({ onboardingCompleted: true });
        setCompletionPhase("ready");
      } catch (error) {
        if (generationRunIdRef.current !== runId) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong while creating your plan.";
        setGenerationError(message);

        generationRunIdRef.current = null;
        setIsCompleting(false);
      } finally {
        if (generationRunIdRef.current === runId) {
          setIsCompleting(false);
          generationRunIdRef.current = null;
        }
      }
    },
    [runCurriculumGeneration, runGenerationAnimation, setLocale]
  );

  const handleGenerationReset = useCallback(() => {
    generationRunIdRef.current = null;
    lastGenerationRequestRef.current = null;
    setCompletionPhase("form");
    setGenerationError(null);
    setGenerationStats(null);
    setGenerationStep("analyzing");
    setGenerationCompletedAt(null);
    setIsCompleting(false);
  }, []);

  const handleRetryGeneration = useCallback(() => {
    if (!lastGenerationRequestRef.current) {
      return;
    }
    void startGenerationFlow({
      request: lastGenerationRequestRef.current,
      subjectNames: selectedSubjectNames,
      profileSnapshot: {
        country,
        language,
        educationStatus,
        knowsGradeLevel,
        schoolGrade,
        ageRange,
        gradeLevel: gradeLevel || "middle",
        gradeLevelDescriptor,
        preferredSubjects: selectedSubjectNames,
      },
    });
  }, [
    ageRange,
    country,
    educationStatus,
    gradeLevel,
    gradeLevelDescriptor,
    knowsGradeLevel,
    language,
    schoolGrade,
    selectedSubjectNames,
    startGenerationFlow,
  ]);

  const handleContinueToDashboard = useCallback(() => {
    router.push("/app/learn");
  }, [router]);

  const handleNext = () => {
    if (!canProceed || isCompleting) return;

    if (stepIndex === steps.length - 1) {
      void handleComplete();
      return;
    }

    // const upcomingStep = steps[Math.min(stepIndex + 1, steps.length - 1)];
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleBack = () => {
    if (stepIndex === 0 || isCompleting) return;
    // const previousStep = steps[Math.max(stepIndex - 1, 0)];
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const toggleSubject = (subjectId: string) => {
    if (subjectsLoading || subjectsError) return;
    setSelectedSubjects((prev) => {
      const exists = prev.includes(subjectId);
      if (!exists && prev.length >= SUBJECT_SELECTION_LIMIT) {
        setSubjectsSelectionError(
          `You can pick up to ${SUBJECT_SELECTION_LIMIT} subjects for a single plan.`
        );

        return prev;
      }
      const next = exists
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId];
      selectedSubjectsRef.current = next;
      if (next.length <= SUBJECT_SELECTION_LIMIT) {
        setSubjectsSelectionError("");
      }

      return next;
    });
  };

  const handleComplete = async () => {
    if (!canProceed || isCompleting) return;

    const subjectLabels = selectedSubjects
      .map(
        (id) =>
          availableSubjects.find((subject) => subject.id === id)?.label ??
          SUBJECT_OPTIONS.find((option) => option.id === id)?.label
      )
      .filter((label): label is string => Boolean(label));

    if (subjectLabels.length === 0) {
      setSubjectsSelectionError("Choose at least one subject to continue.");
      return;
    }

    const finalGradeLevel: GradeLevelValue = gradeLevel || "middle";
    const finalGradeDescriptor =
      gradeLevelDescriptorRef.current ||
      gradeLevelDescriptor ||
      resolveGradeLevelDescriptor({
        gradeLevel: finalGradeLevel,
        schoolGrade,
        ageRange,
      });

    setSubjectsSelectionError("");

    await startGenerationFlow({
      request: {
        country,
        language,
        gradeLevel: finalGradeDescriptor,
        subjects: subjectLabels,
      },
      subjectNames: subjectLabels,
      profileSnapshot: {
        country,
        language,
        educationStatus,
        knowsGradeLevel,
        schoolGrade,
        ageRange,
        gradeLevel: finalGradeLevel,
        gradeLevelDescriptor: finalGradeDescriptor,
        preferredSubjects: subjectLabels,
      },
    });
  };

  return {
    isClient,
    autoDetected,
    stepIndex,
    country,
    setCountry,
    language,
    setLanguage,
    educationStatus,
    setEducationStatus,
    knowsGradeLevel,
    setKnowsGradeLevel,
    schoolGrade,
    setSchoolGrade,
    ageRange,
    setAgeRange,
    gradeLevel,
    setGradeLevel,
    selectedSubjects,
    setSelectedSubjects,
    setSubjectsSeeded,
    allCountries,
    isCompleting,
    availableSubjects,
    subjectsLoading,
    subjectsError,
    steps,
    currentStep,
    countryOptions,
    languageOptions,
    subjectsStatusMessage,
    subjectsSelectionError,
    completionPhase,
    generationStep,
    generationStats,
    generationError,
    generationCompletedAt,
    selectedSubjectNames,
    fetchSubjects,
    progressPercent,
    canProceed,
    handleGenerationReset,
    handleRetryGeneration,
    handleContinueToDashboard,
    handleNext,
    handleBack,
    toggleSubject,
  };
}
