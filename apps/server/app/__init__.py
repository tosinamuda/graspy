from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .settings import Settings, get_settings
from .domains.curriculum.service import CurriculumService
from .domains.lesson.service_staged import LessonService
from .domains.subjects.service import SubjectService
from .domains.user.service import UserService
from .domains.tutor.service import TutorService
from .domains.study.service import StudyService
from .config.llm import configure_llm

import logging

# Configure the root strands logger
logging.getLogger("strands").setLevel(logging.DEBUG)

# Add a handler to see the logs
logging.basicConfig(
    format="%(levelname)s | %(name)s | %(message)s", 
    handlers=[logging.StreamHandler()]
)

def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    # Configure LLM (DSPy)
    configure_llm(settings)

    app = FastAPI(
        title="Graspy API",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    allow_origins = settings.cors_origins or ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.settings = settings
    app.state.user_service = UserService(settings=settings)
    app.state.curriculum_service = CurriculumService()
    app.state.lesson_service = LessonService()
    app.state.subject_service = SubjectService()
    app.state.tutor_service = TutorService()
    app.state.study_service = StudyService()

    app.include_router(api_router, prefix="/api")

    return app
