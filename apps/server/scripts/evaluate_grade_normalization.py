import asyncio
import dspy
import sys
import os
from typing import List, Tuple

# Ensure the app directory is in the path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.domains.subjects.prompts import LocalizeGradeLevel
from app.settings import Settings
from app.config.llm import configure_llm

# Test Cases: (Country, Input Grade, Expected Substring/Format)
# We check for substring because "JSS 1" vs "JSS 1 (Junior Secondary School)" might vary, 
# but the core term must be present.
TEST_CASES: List[Tuple[str, str, str]] = [
    # Nigeria
    ("Nigeria", "Grade 7", "JSS 1"),
    ("Nigeria", "Grade 8", "JSS 2"),
    ("Nigeria", "Grade 9", "JSS 3"),
    ("Nigeria", "Grade 10", "SSS 1"), # Senior Secondary 1
    ("Nigeria", "Grade 11", "SSS 2"),
    ("Nigeria", "Grade 12", "SSS 3"),
    ("Nigeria", "Grade 1", "Primary 1"),
    ("Nigeria", "Grade 6", "Primary 6"),

    # UK
    ("UK", "Grade 1", "Year 2"), 
    ("UK", "Grade 10", "Year 11"), 
    ("UK", "Grade 12", "Year 13"), # Sixth Form
    ("UK", "Year 6", "Year 6"),

    # US
    ("US", "Grade 9", "9th Grade"), 
    ("US", "Grade 12", "12th Grade"),
    ("US", "Kindergarten", "Kindergarten"),

    # Ghana
    ("Ghana", "Grade 7", "JHS 1"), 
    ("Ghana", "Grade 9", "JHS 3"),
    ("Ghana", "Grade 10", "SHS 1"),

    # Kenya
    ("Kenya", "Grade 1", "Grade 1"),
    ("Kenya", "Grade 8", "Standard 8"), # or Grade 8 in CBC
    ("Kenya", "Grade 9", "Form 1"), # 8-4-4 system vs CBC transition is complex, testing for common mapping
]

async def evaluate(predictor_class, name):
    print(f"\nEvaluating {name} on {len(TEST_CASES)} cases...\n")
    print(f"{'Country':<10} | {'Input':<10} | {'Expected':<15} | {'Actual':<25} | {'Result'}")
    print("-" * 80)
    
    passed = 0
    predictor = predictor_class(LocalizeGradeLevel)
    
    for country, inp_grade, expected in TEST_CASES:
        try:
            pred = predictor(country=country, grade_level=inp_grade)
            actual = pred.normalized_grade_level
            
            # Loose matching for robust eval
            is_pass = expected.lower() in actual.lower() or actual.lower() in expected.lower()
            
            result = "PASS" if is_pass else "FAIL"
            if is_pass:
                passed += 1
                
            print(f"{country:<10} | {inp_grade:<10} | {expected:<15} | {actual:<25} | {result}")
            
        except Exception as e:
            print(f"{country:<10} | {inp_grade:<10} | {expected:<15} | ERROR: {e}")

    accuracy = (passed / len(TEST_CASES)) * 100
    print("-" * 80)
    print(f"Accuracy ({name}): {accuracy:.2f}% ({passed}/{len(TEST_CASES)})")
    return accuracy

async def main():
    print("Initializing settings and LM...")
    settings = Settings()
    # Ensure basic settings for local dev
    settings.strands_model_id = settings.strands_model_id or "amazon.nova-lite-v1:0"
    configure_llm(settings)
    
    acc_predict = await evaluate(dspy.Predict, "No-CoT (Predict)")
    acc_cot = await evaluate(dspy.ChainOfThought, "CoT (ChainOfThought)")
    
    print("\nComparison:")
    print(f"No-CoT: {acc_predict:.2f}%")
    print(f"CoT:    {acc_cot:.2f}%")


if __name__ == "__main__":
    asyncio.run(main())
