
import asyncio
import json
import logging
from unittest.mock import MagicMock, patch

# Adjust path to find app modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from app.domains.lesson.service_staged import LessonService, StagedLessonGenerator
from app.domains.lesson.prompts_staged import LessonPlan, SlideSpec
from app.domains.lesson.prompts import LessonSlide, LessonPractice, LessonSlideAssessment

# Mock Data
MOCK_PLAN = LessonPlan(
    learningObjectives=["Obj 1", "Obj 2", "Obj 3"],
    keyPoints=["Point 1", "Point 2", "Point 3"],
    slideSpecs=[
        SlideSpec(slideType="concept_introduction", title="Intro Slide", keyConcept="Concept 1"),
        SlideSpec(slideType="worked_example", title="Example Slide", keyConcept="Concept 2"),
        SlideSpec(slideType="synthesis", title="Review Slide", keyConcept="Review")
    ]
)

MOCK_SLIDE = LessonSlide(
    slideType="concept_introduction",
    title="Mock Slide Title",
    bodyMd="Mock Body content.",
    assessment=LessonSlideAssessment(
        prompt="Mock Question?",
        options=["A", "B", "C", "D"],
        answerIndex=0,
        correctFeedback="Correct!",
        incorrectFeedback="Incorrect."
    )
)

MOCK_TRANSLATED_SLIDE = LessonSlide(
    slideType="concept_introduction",
    title="Mock Slide Title (Yoruba)",
    bodyMd="Mock Body content (Yoruba).",
    assessment=LessonSlideAssessment(
        prompt="Mock Question (Yoruba)?",
        options=["A (Yo)", "B (Yo)", "C (Yo)", "D (Yo)"],
        answerIndex=0,
        correctFeedback="Correct! (Yo)",
        incorrectFeedback="Incorrect. (Yo)"
    )
)

MOCK_PRACTICE = LessonPractice(
    question="Mock Practice Question?",
    options=["Op1", "Op2", "Op3", "Op4"],
    answerIndex=0,
    correctFeedback="Correct!",
    incorrectFeedback="Incorrect."
)

MOCK_TRANSLATED_PRACTICE = LessonPractice(
    question="Mock Practice Question (Yoruba)?",
    options=["Op1 (Yo)", "Op2 (Yo)", "Op3 (Yo)", "Op4 (Yo)"],
    answerIndex=0,
    correctFeedback="Correct! (Yo)",
    incorrectFeedback="Incorrect. (Yo)"
)

async def run_verification():
    print("--- Starting Translation Workflow Verification ---")
    
    # Mock DSPy settings/LM to avoid real calls
    with patch("dspy.settings") as mock_settings, \
         patch("app.domains.lesson.service_staged.get_lm_for_locale") as mock_get_lm, \
         patch("app.domains.lesson.service_staged.get_n_atlas_lm", return_value=MagicMock()) as mock_n_atlas:
        
        # Setup Service
        service = LessonService()
        
        # Mock Generators
        # We need to mock the internal module's methods directly because they are what's called in service
        service.module.generate_plan = MagicMock(return_value=MOCK_PLAN)
        service.module.generate_slide = MagicMock(return_value=MOCK_SLIDE)
        service.module.generate_practice = MagicMock(return_value=MOCK_PRACTICE)
        
        # Mock Translators
        service.module.translate_slide_content = MagicMock(return_value=MOCK_TRANSLATED_SLIDE)
        service.module.translate_practice_content = MagicMock(return_value=MOCK_TRANSLATED_PRACTICE)

        print("\n[Test] Generating with language='Yoruba' (Should trigger translation)")
        
        events = []
        async for event_str in service.generate_stream(
            country="Nigeria",
            language="Yoruba",
            subject="Math",
            topic="Algebra",
            grade_level="Elementary"
        ):
            event = json.loads(event_str)
            events.append(event)
            if event["type"] == "status":
                print(f"Status: {event['message']}")
            elif event["type"] == "slide":
                print(f"Generated Slide: {event['payload']['title']}")
        
        # VERIFICATION CHECKS
        
        # 1. Check Plan Generation Language
        # Expect "English" because Yoruba triggers translation flow
        call_args = service.module.generate_plan.call_args
        # format: args=(country, language, subject...) 
        # definition: generate_plan(self, country, language, subject, topic, grade_level)
        gen_lang_arg = call_args[0][1] 
        if gen_lang_arg == "English":
            print("✅ Plan Generation used 'English' as expected.")
        else:
            print(f"❌ Plan Generation used '{gen_lang_arg}', expected 'English'.")

        # 2. Check Slide Generation Language
        call_args_slide = service.module.generate_slide.call_args
        # definition: generate_slide(spec, subject, topic, grade_level, language, ...)
        gen_lang_slide_arg = call_args_slide[0][4]
        if gen_lang_slide_arg == "English":
            print("✅ Slide Generation used 'English' as expected.")
        else:
            print(f"❌ Slide Generation used '{gen_lang_slide_arg}', expected 'English'.")
            
        # 3. Check Translation Calls
        if service.module.translate_slide_content.called:
            print(f"✅ Slide Translation called {service.module.translate_slide_content.call_count} times.")
            # Check target language
            trans_lang = service.module.translate_slide_content.call_args[0][1]
            if trans_lang == "Yoruba":
                 print("✅ Slide Translation target is 'Yoruba'.")
            else:
                 print(f"❌ Slide Translation target is '{trans_lang}'.")
        else:
            print("❌ Slide Translation was NOT called.")

        # 4. Check Practice Translation
        if service.module.translate_practice_content.called:
             print("✅ Practice Translation called.")
        else:
             print("❌ Practice Translation was NOT called.")

        print("\n--- Verification Complete ---")

if __name__ == "__main__":
    asyncio.run(run_verification())
