from __future__ import annotations

import asyncio
import contextlib
import json

from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..dependencies import (
    get_curriculum_service,
    get_lesson_service,
    get_settings,
    get_subject_service,
    get_tutor_service,
    get_study_service,
    get_user_service,
)
from ..schemas import (
    CurriculumRequest,
    CurriculumResponse,
    CurriculumStreamEvent,
    ErrorResponse,
    HealthResponse,
    LessonRequest,
    LessonResponse,
    SubjectGenerationRequest,
    SubjectStreamEvent,
    TutorChatRequest,
    TutorChatResponse,
    StudyChatRequest,
    StudyChatResponse,
    UsersResponse,
    UserCreate,
    UserUpdate,
)
from ..domains.curriculum.service import CurriculumService
from ..domains.lesson.service_staged import LessonService
from ..domains.subjects.service import SubjectService
from ..domains.tutor.service import TutorService
from ..domains.study.service import StudyService
from ..domains.user.service import UserService
from ..settings import Settings

api_router = APIRouter()

CACHE_CONTROL_HEADER = "public, max-age=3600"


@api_router.get("/health", response_model=HealthResponse, tags=["meta"])
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        details={
            "environment": settings.environment,
            "strandsAvailable": not settings.strands_force_fallback,
        },
    )


@api_router.get("/users/all", response_model=UsersResponse, tags=["users"])
async def list_users(user_service: UserService = Depends(get_user_service)) -> UsersResponse:
    users = await user_service.list_users()
    return UsersResponse(users=users)


@api_router.post("/users/add", status_code=201, tags=["users"])
async def add_user(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service),
) -> Response:
    await user_service.add_user(payload)
    return Response(status_code=201)


@api_router.put("/users/update", status_code=200, tags=["users"])
async def update_user(
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service),
) -> Response:
    await user_service.update_user(payload)
    return Response(status_code=200)


@api_router.delete("/users/delete/{user_id}", status_code=200, tags=["users"])
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
) -> Response:
    await user_service.delete_user(user_id)
    return Response(status_code=200)


@api_router.post(
    "/curriculum/tutor-chat",
    response_model=TutorChatResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["curriculum"],
)
async def tutor_chat(
    payload: TutorChatRequest,
    tutor_service: TutorService = Depends(get_tutor_service),
) -> TutorChatResponse:
    if not payload.message.strip() or not payload.subject.strip() or not payload.language.strip():
        raise HTTPException(status_code=400, detail="message, subject, and language are required")

    return await tutor_service.chat(payload)


@api_router.post(
    "/study/chat",
    response_model=StudyChatResponse,
    tags=["study"],
)
async def study_chat(
    payload: StudyChatRequest,
    study_service: StudyService = Depends(get_study_service),
) -> StudyChatResponse:
    result = await study_service.chat(
        history=payload.history, 
        message=payload.message, 
        language=payload.language
    )
    return StudyChatResponse(answer=result["answer"])


@api_router.post(
    "/curriculum/generate",
    response_model=CurriculumResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
    tags=["curriculum"],
)
async def generate_curriculum(
    payload: CurriculumRequest,
    curriculum_service: CurriculumService = Depends(get_curriculum_service),
) -> CurriculumResponse:
    response = await curriculum_service.generate_curriculum(payload)
    return response


@api_router.get(
    "/curriculum/generate-stream",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
    tags=["curriculum"],
)
async def generate_curriculum_stream(
    country: str = Query(...),
    language: str = Query(...),
    grade_level: str | None = Query(None, alias="gradeLevel"),
    subjects: list[str] | None = Query(None, alias="subject"),
    curriculum_service: CurriculumService = Depends(get_curriculum_service),
) -> EventSourceResponse:
    request_payload = CurriculumRequest(
        country=country,
        language=language,
        gradeLevel=grade_level,
        subjects=subjects,
    )

    async def event_publisher():
        queue: asyncio.Queue[dict | None] = asyncio.Queue()

        async def pump_stream():
            try:
                subjects_list = []
                if request_payload.subjects:
                    for s in request_payload.subjects:
                        if hasattr(s, "id"):
                            subjects_list.append(s.id)
                        else:
                            subjects_list.append(str(s))

                # Unpack payload as service expects individual arguments
                async for event in curriculum_service.generate_stream(
                    country=request_payload.country,
                    language=request_payload.language,
                    grade_level=request_payload.grade_level,
                    subjects=subjects_list
                    # Note: CurriculumRequest subjects is List[CurriculumSubjectInput] or List[str] depending on parsing.
                    # Service expects dict or string? Checking service def: List[Union[str, CurriculumSubjectInput, dict]].
                    # Let's pass request_payload.subjects directly if schema matches, or unpack if needed.
                    # Service `generate` handles list of strings or dicts.
                    # Schema has `subjects: Optional[List[CurriculumSubjectInput | str]]`.
                ):
                    await queue.put(
                        {
                            "event": "message",
                            "data": event
                        }
                    )

# ... (skipping to next chunk) ...

            finally:
                await queue.put(None)

        async def heartbeat():
            try:
                while True:
                    await asyncio.sleep(20)
                    await queue.put({"event": "ping", "data": "keepalive"})
            except asyncio.CancelledError:
                pass

        producer = asyncio.create_task(pump_stream())
        ping_task = asyncio.create_task(heartbeat())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    yield {"data": "[DONE]"}
                    break
                yield item
        finally:
            producer.cancel()
            ping_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await producer
            with contextlib.suppress(asyncio.CancelledError):
                await ping_task

    return EventSourceResponse(
        event_publisher(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@api_router.post(
    "/curriculum/lesson",
    response_model=LessonResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
    tags=["lessons"],
)
async def generate_lesson(
    payload: LessonRequest,
    response: Response,
    lesson_service: LessonService = Depends(get_lesson_service),
) -> LessonResponse:
    result = await lesson_service.generate_lesson(
        country=payload.country,
        language=payload.language,
        subject=payload.subject,
        topic=payload.topic,
        grade_level=payload.grade_level or "Standard"
    )
    response.headers["Cache-Control"] = CACHE_CONTROL_HEADER
    response.headers["X-Cache"] = "MISS"
    return result


@api_router.get(
    "/curriculum/lesson",
    response_model=LessonResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["lessons"],
)
async def get_lesson(
    response: Response,
    lesson_service: LessonService = Depends(get_lesson_service),
    country: str = Query(...),
    language: str = Query(...),
    subject: str = Query(...),
    topic: str = Query(...),
    grade_level: str | None = Query(None, alias="gradeLevel"),
    grade: str | None = Query(None, alias="grade"),
    index: int = Query(0),
    total_topics: int = Query(1, alias="totalTopics"),
) -> LessonResponse:
    final_grade_level = grade_level or grade

    lesson_request = LessonRequest(
        country=country,
        language=language,
        subject=subject,
        topic=topic,
        gradeLevel=final_grade_level,
        topicIndex=index,
        totalTopics=total_topics,
    )

    result = await lesson_service.generate_lesson(lesson_request)
    response.headers["Cache-Control"] = CACHE_CONTROL_HEADER
    response.headers["X-Cache"] = "MISS"
    return result


@api_router.get(
    "/curriculum/lesson/stream",
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    tags=["lessons"],
)
async def stream_lesson(
    lesson_service: LessonService = Depends(get_lesson_service),
    country: str = Query(...),
    language: str = Query(...),
    subject: str = Query(...),
    topic: str = Query(...),
    grade_level: str | None = Query(None, alias="gradeLevel"),
    grade: str | None = Query(None, alias="grade"),
    index: int = Query(0),
    total_topics: int = Query(1, alias="totalTopics"),
) -> EventSourceResponse:
    final_grade_level = grade_level or grade

    request_payload = LessonRequest(
        country=country,
        language=language,
        subject=subject,
        topic=topic,
        gradeLevel=final_grade_level,
        topicIndex=index,
        totalTopics=total_topics,
    )

    async def event_publisher():
        queue: asyncio.Queue[dict | None] = asyncio.Queue()

        async def pump_stream():
            try:
                async for event in lesson_service.generate_stream(
                    country=request_payload.country,
                    language=request_payload.language,
                    subject=request_payload.subject,
                    topic=request_payload.topic,
                    grade_level=request_payload.grade_level
                ):

                    await queue.put(
                        {
                            "event": "message",
                            "data": event,
                        },
                    )
            except HTTPException as exc:
                await queue.put(
                    {
                        "event": "message",
                        "data": json.dumps(
                            {
                                "type": "error",
                                "phase": "error",
                                "message": exc.detail if isinstance(exc.detail, str) else "Lesson stream failed",
                            },
                        ),
                    },
                )
            except Exception as exc:  # noqa: BLE001
                await queue.put(
                    {
                        "event": "message",
                        "data": json.dumps(
                            {
                                "type": "error",
                                "phase": "error",
                                "message": str(exc) or "Lesson stream failed",
                            },
                        ),
                    },
                )
            finally:
                await queue.put(None)

        async def heartbeat():
            try:
                while True:
                    await asyncio.sleep(20)
                    await queue.put({"event": "ping", "data": "keepalive"})
            except asyncio.CancelledError:
                pass

        producer = asyncio.create_task(pump_stream())
        ping_task = asyncio.create_task(heartbeat())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    yield {"data": "[DONE]"}
                    break
                yield item
        finally:
            producer.cancel()
            ping_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await producer
            with contextlib.suppress(asyncio.CancelledError):
                await ping_task

    return EventSourceResponse(
        event_publisher(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@api_router.get(
    "/subjects/generate-stream",
    tags=["subjects"],
)
async def generate_subjects_stream(
    country: str = Query(...),
    language: str = Query(...),
    grade_level: str | None = Query(None, alias="gradeLevel"),
    subject_service: SubjectService = Depends(get_subject_service),
) -> EventSourceResponse:
    request_payload = SubjectGenerationRequest(
        country=country,
        language=language,
        gradeLevel=grade_level,
    )

    async def event_publisher():
        async for event in subject_service.generate_stream(
            country=request_payload.country,
            language=request_payload.language,
            grade_level=request_payload.grade_level
        ):
            yield {
                "event": "message",
                "data": event
            }
        yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(
        event_publisher(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
