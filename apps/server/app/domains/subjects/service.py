from typing import AsyncGenerator
import dspy
import json
import logging
from .prompts import GenerateSubjects, SubjectItem, LocalizeGradeLevel
from ...config.llm import get_lm_for_locale

logger = logging.getLogger(__name__)

class SubjectGenerator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.localize = dspy.ChainOfThought(LocalizeGradeLevel)
        self.generate = dspy.ChainOfThought(GenerateSubjects)
    
    def forward(self, country: str, language: str, grade_level: str):
        # 1. Normalize Grade Level
        localization = self.localize(country=country, grade_level=grade_level)
        normalized_grade = localization.normalized_grade_level
        
        # 2. Generate Subjects using normalized grade
        prediction = self.generate(
            country=country, 
            language=language, 
            grade_level=normalized_grade
        )
        
        # Return both so we can pass them back
        return normalized_grade, prediction.subjects

class SubjectService:
    def __init__(self):
        self.module = SubjectGenerator()

    async def generate_stream(
        self, country: str, language: str, grade_level: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate subjects and stream result as SSE events.
        """
        # Yield status event
        yield json.dumps({"type": "status", "message": "Analyzing curriculum standards..."})
        
        print(f"DEBUG: Generating subjects for {country}/{language} ({grade_level})", flush=True)
        
        # Determine LM context
        lm = get_lm_for_locale(language)
        context_manager = dspy.context(lm=lm) if lm else dspy.context()

        with context_manager:
            # dspy.TypedPredictor doesn't strictly stream token-by-token for structured output in the same way,
            # but for Phase 1 parity we can just generate and then yield the result.
            
            normalized_grade, subjects = self.module(
                country=country,
                language=language, 
                grade_level=grade_level
            )
        
        print(f"DEBUG: Normalized '{grade_level}' -> '{normalized_grade}'", flush=True)
        print(f"DEBUG: Generated {len(subjects)} subjects", flush=True)
        
        # Convert Pydantic models to dicts
        subjects_data = [s.model_dump() for s in subjects]
        
        # Yield Normalized Grade first (so frontend can update state)
        yield json.dumps({
            "type": "normalized_grade", 
            "original": grade_level, 
            "normalized": normalized_grade
        })
        
        yield json.dumps({"type": "subjects", "subjects": subjects_data})
        
        # We could also yield a Done event if the client expects it, 
        # but sse-starlette usually handles the stream closure if we return.
