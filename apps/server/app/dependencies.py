from __future__ import annotations

from fastapi import Request

from .domains.curriculum.service import CurriculumService
from .domains.lesson.service import LessonService
from .domains.subjects.service import SubjectService
from .domains.user.service import UserService
from .domains.tutor.service import TutorService
from .domains.study.service import StudyService
from .settings import Settings


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_user_service(request: Request) -> UserService:
    return request.app.state.user_service


def get_curriculum_service(request: Request) -> CurriculumService:
    return request.app.state.curriculum_service


def get_lesson_service(request: Request) -> LessonService:
    return request.app.state.lesson_service


def get_subject_service(request: Request) -> SubjectService:
    return request.app.state.subject_service


def get_tutor_service(request: Request) -> TutorService:
    return request.app.state.tutor_service

def get_study_service(request: Request) -> StudyService:
    return request.app.state.study_service
