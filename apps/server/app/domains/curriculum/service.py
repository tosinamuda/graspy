from typing import AsyncGenerator, List, Union, Dict
import dspy
import json
from .prompts import GenerateCurriculum, CurriculumSubjectInput, GenerateCurriculumTopics, TranslateCurriculumTopics
from ...utils.locale import get_country_name, get_language_name
from ...config.llm import get_lm_for_locale, get_n_atlas_lm

class CurriculumGenerator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate = dspy.ChainOfThought(GenerateCurriculum)
        self.generate_topics = dspy.ChainOfThought(GenerateCurriculumTopics)
        self.translate_topics = dspy.ChainOfThought(TranslateCurriculumTopics)
        
    def forward(self, country: str, language: str, grade_level: str, input_subjects: list[CurriculumSubjectInput]):
        # This default forward is for the main generation, but we'll call specific sub-modules in service
        return self.generate(country=country, language=language, grade_level=grade_level, input_subjects=input_subjects)

class CurriculumService:
    def __init__(self):
        self.module = CurriculumGenerator()

    async def generate(self, country: str, language: str, grade_level: str, subjects: List[Union[str, CurriculumSubjectInput, dict]] = None) -> dict:
        # Determine LM context
        lm = get_lm_for_locale(language)
        context_manager = dspy.context(lm=lm) if lm else dspy.context()
        
        # Normalize subjects to CurriculumSubjectInput
        normalized_subjects: List[CurriculumSubjectInput] = []
        if subjects:
            for s in subjects:
                # Handle direct match (internal usage)
                if isinstance(s, CurriculumSubjectInput):
                    normalized_subjects.append(s)
                # Handle dicts
                elif isinstance(s, dict):
                    normalized_subjects.append(CurriculumSubjectInput(**s))
                # Handle Pydantic models from schemas (duck typing / attribute access)
                elif hasattr(s, "id") and hasattr(s, "label"):
                     normalized_subjects.append(CurriculumSubjectInput(id=s.id, label=s.label))
                # Handle strings
                elif isinstance(s, str):
                    if "|" in s:
                         parts = s.split("|")
                         # Assuming format: label|id (as per user example "isiro|math")
                         label = parts[0].strip()
                         slug = parts[1].strip()
                         normalized_subjects.append(CurriculumSubjectInput(id=slug, label=label))
                    else:
                        # Fallback for plain strings: use string as both ID and Label
                        normalized_subjects.append(CurriculumSubjectInput(id=s, label=s))

        out_subjects = []
        out_topics = {}

        NIGERIAN_LANGUAGES = ["yoruba", "hausa", "igbo"]
        target_language = language
        generation_language = language
        should_translate = language.lower() in NIGERIAN_LANGUAGES

        if should_translate:
            generation_language = "English"

        translation_lm = get_n_atlas_lm()
        print(f"[CurriculumService] Generating. Country={country}, Lang={language}, ShouldTranslate={should_translate}, HasNAtlas={translation_lm is not None}", flush=True)

        with context_manager:
            if normalized_subjects:
                # Optimized path: Only generate topics
                prediction = self.module.generate_topics(
                    country=country,
                    language=generation_language,
                    grade_level=grade_level,
                    input_subjects=normalized_subjects
                )
                
                topics_map = prediction.topics
                generated_slugs = list(topics_map.keys())

                # Reconcile subjects: Use generated slugs if counts match (handles English-ifying), else fallback
                if len(generated_slugs) == len(normalized_subjects):
                    for i, sub in enumerate(normalized_subjects):
                        # Use the slug from the LLM response (likely English) to match the topics map key
                        # But keep the original localized Label
                        out_subjects.append({"name": sub.label, "slug": generated_slugs[i]})
                else:
                    # Fallback: Use input IDs (might mismatch topics if LLM changed keys)
                    for sub in normalized_subjects:
                        out_subjects.append({"name": sub.label, "slug": sub.id})
                
                # Translation Step
                if should_translate and translation_lm:
                    # We need to translate topics for EACH subject
                    # Using a loop here as our signature handles a list.
                    # We switch context to N-Atlas
                    with dspy.context(lm=translation_lm):
                        new_topics_map = {}
                        for slug, topics in topics_map.items():
                             print(f"\n[Translation Log] Original Topics (English) for {slug} (Count: {len(topics)}): {topics}", flush=True)
                             trans_pred = self.module.translate_topics(
                                 topics=topics,
                                 subject=slug,
                                 target_language=target_language
                             )
                             print(f"[Translation Log] Translated Topics ({target_language}) for {slug} (Count: {len(trans_pred.translated_topics)}): {trans_pred.translated_topics}", flush=True)
                             new_topics_map[slug] = trans_pred.translated_topics
                        topics_map = new_topics_map

                # Use generated (and translated) topics map, ensuring uniqueness per subject
                out_topics = {
                    k: list(dict.fromkeys(v)) 
                    for k, v in topics_map.items()
                }
                
            else:
                # Full generation path
                prediction = self.module.generate(
                    country=country,
                    language=generation_language,
                    grade_level=grade_level,
                    input_subjects=[]
                )
                
                # Process full generation result
                # If translation needed, we translate the topics of each item
                 
                for item in prediction.curriculum:
                    out_subjects.append({"name": item.subject_label, "slug": item.subject_slug})
                    
                    item_topics = item.topics
                    
                    if should_translate and item_topics and translation_lm:
                         with dspy.context(lm=translation_lm):
                             print(f"\n[Translation Log] Original Topics (English) for {item.subject_slug} (Count: {len(item_topics)}): {item_topics}", flush=True)
                             trans_pred = self.module.translate_topics(
                                 topics=item_topics,
                                 subject=item.subject_slug,
                                 target_language=target_language
                             )
                             print(f"[Translation Log] Translated Topics ({target_language}) for {item.subject_slug} (Count: {len(trans_pred.translated_topics)}): {trans_pred.translated_topics}", flush=True)
                             item_topics = trans_pred.translated_topics

                    if item_topics:
                         # Deduplicate topics while preserving order
                         out_topics[item.subject_slug] = list(dict.fromkeys(item_topics))
                 
        return {
            "subjects": out_subjects,
            "topics": out_topics,
            "currentStep": "curriculum_generated"
        }

    async def generate_stream(
        self, country: str, language: str, grade_level: str, subjects: List[str] = None
    ) -> AsyncGenerator[str, None]:
        # Yield initial status
        yield json.dumps({"type": "status", "message": "Designing curriculum..."})
        
        result = await self.generate(country, language, grade_level, subjects or [])
        
        # Stream the result
        yield json.dumps({"type": "result", "subjects": result["subjects"], "topics": result["topics"]})
