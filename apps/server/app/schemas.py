from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field, PositiveInt


class User(BaseModel):
    id: PositiveInt
    name: str
    email: str
    created: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    name: str
    email: str


class UserUpdate(BaseModel):
    id: PositiveInt
    name: str
    email: str


class UsersResponse(BaseModel):
    users: List[User]


class CurriculumSubjectInput(BaseModel):
    id: str = Field(description="English slug/ID of the subject")
    label: str = Field(description="Localized label of the subject")

class CurriculumRequest(BaseModel):
    country: str = Field(description="Full name of the country (e.g. Nigeria)")
    language: str = Field(description="Full name of the language (e.g. Yoruba)")
    grade_level: Optional[str] = Field(default=None, alias="gradeLevel", description="Grade level (e.g. Grade 2, JSS 1, Year 5, Middle School)")
    subjects: Optional[List[CurriculumSubjectInput | str]] = None 

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "country": "Nigeria",
                "language": "English",
                "gradeLevel": "middle school",
                "subjects": [
                    {"id": "mathematics", "label": "Mathematics"},
                    {"id": "civic_education", "label": "Civic Education"}
                ],
            }
        },
    }


class CurriculumSubject(BaseModel):
    name: str
    slug: str


class CurriculumResponse(BaseModel):
    subjects: List[CurriculumSubject]
    topics: Dict[str, List[str]] = Field(default_factory=dict)
    current_step: str = Field(alias="currentStep")
    error: Optional[str] = None

    model_config = {"populate_by_name": True}


class CurriculumStreamEvent(CurriculumResponse):
    pass


class CurriculumSubjects(BaseModel):
    subjects: List[str] = Field(min_length=3, max_length=12)

    model_config = {"extra": "forbid"}


class CurriculumTopics(BaseModel):
    topics: List[str] = Field(min_length=5, max_length=7)

    model_config = {"extra": "forbid"}


class LessonRequest(BaseModel):
    country: str = Field(description="Full name of the country (e.g. Kenya)")
    language: str = Field(description="Full name of the language (e.g. Swahili)")
    subject: str
    topic: str
    grade_level: Optional[str] = Field(default=None, alias="gradeLevel")
    topic_index: int = Field(default=0, alias="topicIndex")
    total_topics: int = Field(default=1, alias="totalTopics")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "country": "Kenya",
                "language": "Swahili",
                "subject": "Mathematics",
                "topic": "Algebraic Expressions",
                "gradeLevel": "middle school",
                "topicIndex": 0,
                "totalTopics": 5,
            }
        },
    }


class LessonPractice(BaseModel):
    question: str
    options: List[str] = Field(min_length=2, max_length=5)
    answer_index: int = Field(alias="answerIndex")
    correct_feedback: str = Field(alias="correctFeedback")
    incorrect_feedback: str = Field(alias="incorrectFeedback")

    model_config = {"populate_by_name": True, "extra": "forbid"}


class LessonSlideAssessment(BaseModel):
    type: Literal["choice"] = "choice"
    prompt: str
    options: List[str] = Field(min_length=2, max_length=5)
    answer_index: int = Field(alias="answerIndex")
    correct_feedback: str = Field(alias="correctFeedback")
    incorrect_feedback: str = Field(alias="incorrectFeedback")

    model_config = {"populate_by_name": True, "extra": "forbid"}


class LessonSlide(BaseModel):
    slide_type: Literal[
        "concept_introduction",
        "worked_example",
        "scaffolded_problem",
        "misconception",
        "synthesis",
    ] = Field(alias="slideType")
    title: str
    body_md: str = Field(alias="bodyMd")
    assessment: LessonSlideAssessment

    model_config = {"populate_by_name": True, "extra": "forbid"}


class LessonProgress(BaseModel):
    current: int
    total: int


class LessonMetadata(BaseModel):
    country: str
    language: str
    grade_level: Optional[str] = Field(default=None, alias="gradeLevel")
    generator: str
    learning_objectives: List[str] = Field(default_factory=list, alias="learningObjectives")

    model_config = {"populate_by_name": True}


class LessonSession(BaseModel):
    id: str
    subject: str
    topic: str
    topic_index: int = Field(alias="topicIndex")
    total_topics: int = Field(alias="totalTopics")
    explanation: str
    practice: LessonPractice
    slides: List[LessonSlide] = Field(default_factory=list)
    phase: str
    metadata: LessonMetadata

    model_config = {"populate_by_name": True}


class LessonPayload(BaseModel):
    title: str
    content: str
    key_points: List[str] = Field(alias="keyPoints")
    slides: List[LessonSlide] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)
    practice: LessonPractice
    progress: LessonProgress

    model_config = {"populate_by_name": True}


class LessonResponse(BaseModel):
    success: bool = True
    session: LessonSession
    lesson: LessonPayload


class LessonStreamEvent(BaseModel):
    type: Literal["status", "complete", "error"]
    phase: Optional[
        Literal[
            "initializing",
            "generating_slides",
            "slides_ready",
            "generating_practice",
            "complete",
            "error",
        ]
    ] = None
    message: Optional[str] = None
    data: Optional[LessonResponse] = Field(default=None, alias="payload")

    model_config = {"populate_by_name": True}


class LessonSlidesPayload(BaseModel):
    overview: str
    learning_objectives: List[str] = Field(
        default_factory=list,
        alias="learningObjectives",
        min_length=3,
        max_length=3,
    )
    slides: List[LessonSlide] = Field(min_length=5, max_length=5)

    model_config = {"populate_by_name": True, "extra": "forbid"}


class LessonPracticePayload(BaseModel):
    question: str
    options: List[str] = Field(min_length=2, max_length=5)
    correct_option_index: int
    correct_feedback: str
    incorrect_feedback: str

    model_config = {"extra": "forbid"}


class LessonAgentResponse(BaseModel):
    slides: LessonSlidesPayload
    practice: LessonPracticePayload

    model_config = {"populate_by_name": True}


class ErrorResponse(BaseModel):
    error: str


class HealthResponse(BaseModel):
    status: str
    details: Dict[str, Any]


class SubjectCandidate(BaseModel):
    id: str
    label: str
    recommended: bool = False


class SubjectGenerationRequest(BaseModel):
    country: str
    language: str
    grade_level: Optional[str] = Field(default=None, alias="gradeLevel")

    model_config = {"populate_by_name": True}


class SubjectStreamEvent(BaseModel):
    type: Literal["status", "subjects", "error", "complete"]
    message: Optional[str] = None
    subjects: Optional[List[SubjectCandidate]] = None


class TutorChatHistoryEntry(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TutorChatRequest(BaseModel):
    message: str
    subject: str
    topic: Optional[str] = None
    related_topics: Optional[List[str]] = Field(default=None, alias="relatedTopics")
    language: str
    country: Optional[str] = None
    grade_level: Optional[str] = Field(default=None, alias="gradeLevel")
    history: Optional[List[TutorChatHistoryEntry]] = None

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "message": "Can you explain photosynthesis again?",
                "subject": "Science",
                "topic": "Photosynthesis",
                "relatedTopics": ["Cellular respiration", "Plant nutrition"],
                "language": "English",
                "country": "Nigeria",
                "gradeLevel": "middle",
                "history": [
                    {"role": "assistant", "content": "Photosynthesis is how plants make food."},
                    {"role": "user", "content": "What ingredients do they need?"},
                ],
            }
        },
    }


class TutorChatResponse(BaseModel):
    answer: str
    follow_ups: Optional[List[str]] = Field(default=None, alias="followUps")
    navigation_tip: Optional[str] = Field(default=None, alias="navigationTip")

    model_config = {"populate_by_name": True}


class StudyChatRequest(BaseModel):
    message: str
    language: str
    history: List[Dict[str, str]] = Field(default_factory=list)


class StudyChatResponse(BaseModel):
    answer: str
