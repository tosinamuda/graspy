
import asyncio
import json
from unittest.mock import MagicMock, patch
import sys
import os

# Adjust path finding
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from app.domains.curriculum.service import CurriculumService
from app.domains.curriculum.prompts import CurriculumSubjectInput

# Mock Responses
MOCK_TOPICS_ENGLISH = {
    "math": ["Algebra", "Geometry"],
    "science": ["Biology", "Physics"]
}

MOCK_TRANSLATED_TOPICS_ALGEBRA = ["Aljebra (Yo)", "Gimometri (Yo)"]
MOCK_TRANSLATED_TOPICS_SCIENCE = ["Bayologi (Yo)", "Fisiksi (Yo)"]

async def run_verification():
    print("--- Starting Curriculum Translation Verification ---")
    # Mock DSPy settings/LM to avoid real calls
    with patch("dspy.settings") as mock_settings, \
         patch("app.domains.curriculum.service.get_n_atlas_lm", return_value=MagicMock()) as mock_n_atlas:
        
        service = CurriculumService()
        
        # Mock Generation (English)
        mock_gen_topics_ret = MagicMock()
        mock_gen_topics_ret.topics = MOCK_TOPICS_ENGLISH
        service.module.generate_topics = MagicMock(return_value=mock_gen_topics_ret)
        
        # Mock Translation
        def mock_translate_side_effect(topics, subject, target_language):
            ret = MagicMock()
            if "Algebra" in topics:
                ret.translated_topics = MOCK_TRANSLATED_TOPICS_ALGEBRA
            else:
                ret.translated_topics = MOCK_TRANSLATED_TOPICS_SCIENCE
            return ret
            
        service.module.translate_topics = MagicMock(side_effect=mock_translate_side_effect)

        print("\n[Test] Generating Curriculum for language='Yoruba'")
        
        input_subjects = [CurriculumSubjectInput(id="math", label="Math"), CurriculumSubjectInput(id="science", label="Science")]
        
        # Call generate directly (not stream for simplicity, logic is shared)
        result = await service.generate(
            country="Nigeria",
            language="Yoruba",
            grade_level="Elementary",
            subjects=input_subjects
        )
        
        # VERIFICATION
        
        # 1. Check Generation Language
        gen_call_args = service.module.generate_topics.call_args
        # generate_topics(country, language, grade_level, input_subjects)
        gen_lang = gen_call_args[1]["language"]
        if gen_lang == "English":
            print("✅ Generation used 'English'.")
        else:
            print(f"❌ Generation used '{gen_lang}'.")
            
        # 2. Check Translation Calls
        if service.module.translate_topics.called:
             print(f"✅ Translation called {service.module.translate_topics.call_count} times.")
        else:
             print("❌ Translation NOT called.")
             
        # 3. Check Result Content
        topics_math = result["topics"].get("math", [])
        if topics_math == MOCK_TRANSLATED_TOPICS_ALGEBRA:
            print(f"✅ Math Topics are translated: {topics_math}")
        else:
            print(f"❌ Math Topics mismatch. Got: {topics_math}")

        topics_science = result["topics"].get("science", [])
        if topics_science == MOCK_TRANSLATED_TOPICS_SCIENCE:
             print(f"✅ Science Topics are translated: {topics_science}")
        else:
             print(f"❌ Science Topics mismatch. Got: {topics_science}")

if __name__ == "__main__":
    asyncio.run(run_verification())
