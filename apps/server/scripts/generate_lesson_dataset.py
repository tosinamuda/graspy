import asyncio
import json
import os
import sys
from typing import List, Dict, Any
import dspy

# Ensure the app directory is in the path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.domains.lesson.service_staged import StagedLessonGenerator
from app.settings import Settings
from app.config.llm import configure_llm

DATASET_DIR = "data/datasets"
os.makedirs(DATASET_DIR, exist_ok=True)

LESSON_PLANS_FILE = os.path.join(DATASET_DIR, "lesson_plans.jsonl")
SLIDES_FILE = os.path.join(DATASET_DIR, "slides.jsonl")
PRACTICE_FILE = os.path.join(DATASET_DIR, "practice_questions.jsonl")

# Define diverse inputs - using Generic descriptions where appropriate
INPUTS = [
    # English - STEM
    {"subject": "Mathematics", "topic": "Fractions", "grade_level": "Grade 4", "language": "English", "country": "Nigeria"},
    {"subject": "Physics", "topic": "Newton's Laws of Motion", "grade_level": "Grade 10", "language": "English", "country": "Nigeria"},
    {"subject": "Chemistry", "topic": "Periodic Table", "grade_level": "Grade 11", "language": "English", "country": "Nigeria"},
    {"subject": "Biology", "topic": "Photosynthesis", "grade_level": "Grade 8", "language": "English", "country": "Nigeria"},
    
    # English - Humanities
    {"subject": "History", "topic": "The Civil War", "grade_level": "Grade 10", "language": "English", "country": "Nigeria"},
    {"subject": "English Literature", "topic": "Things Fall Apart by Chinua Achebe", "grade_level": "Grade 11", "language": "English", "country": "Nigeria"},

    # Yoruba (Using English topics to test translation)
    {"subject": "Social Studies", "topic": "Family Values", "grade_level": "Grade 3", "language": "Yoruba", "country": "Nigeria"},
    {"subject": "Basic Science", "topic": "Personal Hygiene", "grade_level": "Grade 2", "language": "Yoruba", "country": "Nigeria"},
    {"subject": "Agriculture", "topic": "Farming Tools", "grade_level": "Grade 7", "language": "Yoruba", "country": "Nigeria"},

    # Hausa
    {"subject": "Civic Education", "topic": "National Symbols", "grade_level": "Grade 4", "language": "Hausa", "country": "Nigeria"},
    {"subject": "Mathematics", "topic": "Addition and Subtraction", "grade_level": "Grade 2", "language": "Hausa", "country": "Nigeria"},
    {"subject": "Health Education", "topic": "Malaria Prevention", "grade_level": "Grade 7", "language": "Hausa", "country": "Nigeria"},

    # Igbo
    {"subject": "Social Studies", "topic": "Community Leadership", "grade_level": "Grade 5", "language": "Igbo", "country": "Nigeria"},
    {"subject": "Basic Science", "topic": "Living and Non-Living Things", "grade_level": "Grade 3", "language": "Igbo", "country": "Nigeria"},
    {"subject": "Cultural Creative Arts", "topic": "Traditional Dances", "grade_level": "Grade 7", "language": "Igbo", "country": "Nigeria"},
]

class LocalizeContext(dspy.Signature):
    """
    Translate and adapt the grade level and topic to the target country and language.
    Ensure the grade level matches the country's education system (e.g., in Nigeria, Grade 7 might be JSS 1).
    Translate the topic to the target language if appropriate for the subject/context.
    """
    country: str = dspy.InputField()
    language: str = dspy.InputField()
    raw_grade_level: str = dspy.InputField()
    raw_topic: str = dspy.InputField()
    subject: str = dspy.InputField()
    
    localized_grade_level: str = dspy.OutputField(desc="The grade level adapted to the country's system (e.g. JSS 2)")
    localized_topic: str = dspy.OutputField(desc="The topic translated to the target language")

class ContextAdapter(dspy.Module):
    def __init__(self):
        super().__init__()
        self.adapter = dspy.ChainOfThought(LocalizeContext)
        
    def forward(self, country: str, language: str, raw_grade_level: str, raw_topic: str, subject: str):
        return self.adapter(
            country=country,
            language=language,
            raw_grade_level=raw_grade_level,
            raw_topic=raw_topic,
            subject=subject
        )

def append_jsonl(file_path: str, data: Dict[str, Any]):
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(data) + "\n")

async def main():
    print("Initializing settings and LM...")
    settings = Settings()
    # Ensure basic settings for local dev
    settings.strands_model_id = settings.strands_model_id or "amazon.nova-lite-v1:0"
    configure_llm(settings)
    
    generator = StagedLessonGenerator()
    adapter = ContextAdapter()
    
    print(f"Starting dataset generation for {len(INPUTS)} items...")
    
    for i, inp in enumerate(INPUTS):
        print(f"[{i+1}/{len(INPUTS)}] Processing: {inp['subject']} - {inp['topic']} ({inp['language']})")
        
        try:
            # 0. Localize Context
            print(f"  Localizing context for {inp['grade_level']} / {inp['topic']}...")
            localization = adapter(
                country=inp["country"],
                language=inp["language"],
                raw_grade_level=inp["grade_level"],
                raw_topic=inp["topic"],
                subject=inp["subject"]
            )
            
            localized_grade = localization.localized_grade_level
            localized_topic = localization.localized_topic
            
            print(f"  -> Adapted: {localized_grade} | {localized_topic}")
            
            # Update input for current processing, but keep raw for reference if needed
            # We will use the LOCALIZED values for generation
            
            # 1. Generate Plan
            print("  Generating Plan...")
            plan = generator.generate_plan(
                country=inp["country"], 
                language=inp["language"], 
                subject=inp["subject"], 
                topic=localized_topic, 
                grade_level=localized_grade
            )
            
            # Save Plan Data (Input -> Output)
            # We save the LOCALIZED input as the key, because that's what the model saw.
            # But maybe we also want to capture the translation step in a separate dataset? 
            # For now, let's just save the main lesson generation dataset.
            
            # We store the "localized" values as what was passed to the generator.
            plan_input_context = {
                "subject": inp["subject"],
                "topic": localized_topic,
                "grade_level": localized_grade,
                "language": inp["language"],
                "country": inp["country"]
            }
            
            plan_entry = {
                "input": plan_input_context,
                "output": plan.model_dump(by_alias=True)
            }
            append_jsonl(LESSON_PLANS_FILE, plan_entry)
            
            # 2. Generate Slides
            slides = []
            context = ""
            for j, spec in enumerate(plan.slide_specs):
                print(f"  Generating Slide {j+1}/{len(plan.slide_specs)}...")
                slide = generator.generate_slide(
                    slide_spec=spec,
                    subject=inp["subject"],
                    topic=localized_topic,
                    grade_level=localized_grade,
                    language=inp["language"],
                    previous_context=context,
                    country=inp["country"]
                )
                
                # Save Slide Data
                slide_input = {
                    "slide_spec": spec.model_dump(by_alias=True),
                    "subject": inp["subject"],
                    "topic": localized_topic,
                    "grade_level": localized_grade,
                    "language": inp["language"],
                    "country": inp["country"],
                    "previous_context": context
                }
                slide_entry = {
                    "input": slide_input,
                    "output": slide.model_dump(by_alias=True)
                }
                append_jsonl(SLIDES_FILE, slide_entry)
                
                slides.append(slide)
                context += f"\n\nSlide: {slide.title}\n{slide.body_md}"

            # 3. Generate Practice
            print("  Generating Practice Question...")
            
            lesson_summary = "Previous slides covered:\n"
            for k, s in enumerate(slides):
                lesson_summary += f"{k+1}. {s.title}: {s.assessment.prompt}\n"
                
            practice = generator.generate_practice(
                subject=inp["subject"],
                topic=localized_topic,
                grade_level=localized_grade,
                language=inp["language"],
                country=inp["country"],
                lesson_summary=lesson_summary
            )
            
            practice_input = {
                "subject": inp["subject"],
                "topic": localized_topic,
                "grade_level": localized_grade,
                "language": inp["language"],
                "country": inp["country"],
                "lesson_summary": lesson_summary
            }
            practice_entry = {
                "input": practice_input,
                "output": practice.model_dump(by_alias=True)
            }
            append_jsonl(PRACTICE_FILE, practice_entry)
            
        except Exception as e:
            print(f"Error processing {inp}: {e}")
            import traceback
            traceback.print_exc()
            continue

    print("Dataset generation complete!")
    print(f"Plans: {LESSON_PLANS_FILE}")
    print(f"Slides: {SLIDES_FILE}")
    print(f"Practice: {PRACTICE_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
