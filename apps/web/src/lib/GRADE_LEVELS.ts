export const GRADE_LEVELS = [
  { value: "beginner", label: "Beginner (Ages 6-8)", ageRange: "6-8" },
  { value: "elementary", label: "Elementary (Ages 9-11)", ageRange: "9-11" },
  { value: "middle", label: "Middle (Ages 12-14)", ageRange: "12-14" },
  { value: "high", label: "High (Ages 15-17)", ageRange: "15-17" },
];

export type GradeLevelValue = (typeof GRADE_LEVELS)[number]["value"];

export interface SchoolGradeOption {
  value: string;
  label: string;
  description: string;
  gradeLevel: GradeLevelValue;
}

export const SCHOOL_GRADE_OPTIONS: SchoolGradeOption[] = [
  {
    value: "grade_1",
    label: "Grade 1",
    description: "Ages 6-7",
    gradeLevel: "beginner",
  },
  {
    value: "grade_2",
    label: "Grade 2",
    description: "Ages 7-8",
    gradeLevel: "beginner",
  },
  {
    value: "grade_3",
    label: "Grade 3",
    description: "Ages 8-9",
    gradeLevel: "beginner",
  },
  {
    value: "grade_4",
    label: "Grade 4",
    description: "Ages 9-10",
    gradeLevel: "elementary",
  },
  {
    value: "grade_5",
    label: "Grade 5",
    description: "Ages 10-11",
    gradeLevel: "elementary",
  },
  {
    value: "grade_6",
    label: "Grade 6",
    description: "Ages 11-12",
    gradeLevel: "elementary",
  },
  {
    value: "grade_7",
    label: "Grade 7",
    description: "Ages 12-13",
    gradeLevel: "middle",
  },
  {
    value: "grade_8",
    label: "Grade 8",
    description: "Ages 13-14",
    gradeLevel: "middle",
  },
  {
    value: "grade_9",
    label: "Grade 9",
    description: "Ages 14-15",
    gradeLevel: "middle",
  },
  {
    value: "grade_10",
    label: "Grade 10",
    description: "Ages 15-16",
    gradeLevel: "high",
  },
  {
    value: "grade_11",
    label: "Grade 11",
    description: "Ages 16-17",
    gradeLevel: "high",
  },
  {
    value: "grade_12",
    label: "Grade 12",
    description: "Ages 17-18",
    gradeLevel: "high",
  },
];

export interface AgeGroupOption {
  value: string;
  label: string;
  description: string;
  gradeLevel: GradeLevelValue;
  defaultSchoolGrade?: string;
}

export const AGE_GROUP_OPTIONS: AgeGroupOption[] = [
  {
    value: "6-8",
    label: "Ages 6-8",
    description: "Fun games, stories, and early skills",
    gradeLevel: "beginner",
    defaultSchoolGrade: "grade_2",
  },
  {
    value: "9-11",
    label: "Ages 9-11",
    description: "Projects, experiments, and creative thinking",
    gradeLevel: "elementary",
    defaultSchoolGrade: "grade_5",
  },
  {
    value: "12-14",
    label: "Ages 12-14",
    description: "Deeper concepts and problem solving",
    gradeLevel: "middle",
    defaultSchoolGrade: "grade_8",
  },
  {
    value: "15-17",
    label: "Ages 15-17",
    description: "Exam prep and future-ready skills",
    gradeLevel: "high",
    defaultSchoolGrade: "grade_11",
  },
  {
    value: "18_plus",
    label: "Ages 18+",
    description: "Career, college, and practical skills",
    gradeLevel: "high",
    defaultSchoolGrade: "grade_12",
  },
];

export interface SubjectOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const SUBJECT_OPTIONS: SubjectOption[] = [
  {
    id: "mathematics",
    label: "Mathematics",
    description: "Numbers, problem solving, and logical thinking",
    icon: "🔢",
  },
  {
    id: "literacy",
    label: "Reading & Writing",
    description: "Stories, comprehension, and clear communication",
    icon: "📚",
  },
  {
    id: "science",
    label: "Science",
    description: "Experiments, discovery, and how the world works",
    icon: "🔬",
  },
  {
    id: "social_studies",
    label: "Social Studies",
    description: "Communities, history, and world cultures",
    icon: "🌍",
  },
  {
    id: "digital_skills",
    label: "Digital Skills",
    description: "Computers, internet safety, and coding basics",
    icon: "💻",
  },
  {
    id: "creative_arts",
    label: "Creative Arts",
    description: "Art, music, and creative expression",
    icon: "🎨",
  },
  {
    id: "health_wellness",
    label: "Health & Wellness",
    description: "Body, mind, and staying active",
    icon: "🧠",
  },
  {
    id: "entrepreneurship",
    label: "Entrepreneurship",
    description: "Money smarts, leadership, and building ideas",
    icon: "💡",
  },
];

export const SUBJECT_RECOMMENDATIONS: Record<GradeLevelValue, string[]> = {
  beginner: ["mathematics", "literacy", "science"],
  elementary: ["mathematics", "literacy", "science", "social_studies"],
  middle: ["mathematics", "science", "social_studies", "digital_skills"],
  high: ["mathematics", "science", "digital_skills", "entrepreneurship"],
};
