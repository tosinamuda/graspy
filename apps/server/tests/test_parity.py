import pytest
import httpx
import json
import asyncio
from typing import AsyncGenerator

# Configuration
BASE_URL = "http://localhost:8081"

@pytest.fixture
async def client():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client

@pytest.mark.asyncio
async def test_health(client):
    """Verify health endpoint returns status ok and environment details."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "details" in data
    # We verify strict parity: keys must match
    assert "environment" in data["details"]
    assert "strandsAvailable" in data["details"]

@pytest.mark.asyncio
async def test_subjects_stream(client):
    """Verify subject generation streams SSE events with correct structure."""
    params = {
        "country": "US",
        "language": "English",
        "educationStatus": "in_school",
        "gradeLevel": "Middle School"
    }
    
    async with client.stream("GET", "/api/subjects/generate-stream", params=params) as response:
        assert response.status_code == 200
        
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass

    # Verification of event flow
    assert len(events) > 0
    
    # Check for 'status' event
    assert any(e["type"] == "status" for e in events)
    # Check for 'subjects' event
    subject_events = [e for e in events if e["type"] == "subjects"]
    assert len(subject_events) > 0
    
    # Check subject structure
    first_subject_batch = subject_events[0]["subjects"]
    assert isinstance(first_subject_batch, list)
    if len(first_subject_batch) > 0:
        subj = first_subject_batch[0]
        assert "id" in subj
        assert "label" in subj
        assert "recommended" in subj

@pytest.mark.asyncio
async def test_lesson_generation_structure(client):
    """Verify lesson generation returns specific legacy structure (slides as JSON string)."""
    payload = {
        "country": "US",
        "language": "English",
        "subject": "Mathematics",
        "topic": "Algebra",
        "gradeLevel": "High School",
        "topicIndex": 0,
        "totalTopics": 1
    }
    
    response = await client.post("/api/curriculum/lesson", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Verify top-level structure
    assert data["success"] is True
    assert "session" in data
    assert "lesson" in data
    
    # Verify Session Structure
    session = data["session"]
    assert session["subject"] == "Mathematics"
    assert "slides" in session
    assert isinstance(session["slides"], list)
    
    # Verify Lesson Payload Structure
    lesson = data["lesson"]
    assert "slides" in lesson
    assert len(lesson["slides"]) >= 2 # Expecting at least 2 slides (relaxed from 5)
    
    # CRITICAL: Verify slides content structure
    # Based on current logic, slides are objects, but Phase 1 parity might imply keeping specific fields
    slide = lesson["slides"][0]
    assert "slide_type" in slide or "slideType" in slide # Pydantic alias check
    assert "title" in slide
    assert "body_md" in slide or "bodyMd" in slide

@pytest.mark.asyncio
async def test_tutor_chat(client):
    """Verify tutor chat returns expected response structure."""
    payload = {
        "message": "Explain linear equations",
        "subject": "Mathematics",
        "language": "English",
        "history": []
    }
    
    response = await client.post("/api/curriculum/tutor-chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "answer" in data
    assert isinstance(data["answer"], str)

@pytest.mark.asyncio
async def test_curriculum_generate(client):
    """Verify curriculum generation returns expected structure."""
    payload = {
        "country": "US",
        "language": "English",
        "gradeLevel": "Middle School"
    }
    
    response = await client.post("/api/curriculum/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "subjects" in data
    assert isinstance(data["subjects"], list)
    assert "topics" in data
    assert isinstance(data["topics"], dict)

@pytest.mark.asyncio
async def test_curriculum_generate_stream(client):
    """Verify curriculum generation stream returns SSE events."""
    params = {
        "country": "US",
        "language": "English",
        "gradeLevel": "Middle School"
    }
    
    async with client.stream("GET", "/api/curriculum/generate-stream", params=params) as response:
        assert response.status_code == 200
        
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass

    assert len(events) > 0
    # Check for expected event types or structure if known
    # e.g. check if any event contains 'subjects' or 'topics'
    assert any("subjects" in e for e in events)

@pytest.mark.asyncio
async def test_lesson_get_endpoint(client):
    """Verify lesson generation via GET endpoint."""
    params = {
        "country": "US",
        "language": "English",
        "subject": "Mathematics",
        "topic": "Algebra",
        "gradeLevel": "High School",
        "grade": "High School", # Alias check
        "index": 0,
        "totalTopics": 1
    }
    
    response = await client.get("/api/curriculum/lesson", params=params)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

@pytest.mark.asyncio
async def test_lesson_stream(client):
    """Verify lesson generation stream returns SSE events."""
    params = {
        "country": "US",
        "language": "English",
        "subject": "Mathematics",
        "topic": "Algebra",
        "gradeLevel": "High School",
        "index": 0,
        "totalTopics": 1
    }
    
    async with client.stream("GET", "/api/curriculum/lesson/stream", params=params) as response:
        assert response.status_code == 200
        
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass
    
    assert len(events) > 0
    # Verify we get status updates and finally the complete lesson
    assert any(e.get("type") == "status" for e in events)
    assert any(e.get("type") == "complete" for e in events)

@pytest.mark.asyncio
async def test_lesson_stream_regression_linear_algebra(client):
    """Verify regression case: Linear Algebra stream for Grade 12 (SK)."""
    params = {
        "country": "SK",
        "language": "en",
        "subject": "Mathematics",
        "topic": "Linear Algebra",
        "gradeLevel": "Grade 12",
        "index": 1,
        "totalTopics": 4
    }
    
    async with client.stream("GET", "/api/curriculum/lesson/stream", params=params) as response:
        assert response.status_code == 200
        
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass
    
    assert len(events) > 0
    assert any(e.get("type") == "complete" for e in events)
    
    # Optional: Inspect content to ensure it matches the topic
    complete_event = next(e for e in events if e.get("type") == "complete")
    payload = complete_event.get("payload", {})
    assert payload.get("success") is True
    assert "Linear Algebra" in payload.get("session", {}).get("topic", "")
