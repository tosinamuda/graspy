
from typing import AsyncGenerator, List, Dict, Any
import dspy
import json
import asyncio
import re
from .prompts_staged import (
    GenerateLessonPlan, 
    GenerateSlide, 
    GeneratePracticeQuestion, 
    TranslateLessonSlide,
    TranslateLessonPractice,
    LessonPlan, 
    SlideSpec
)
from .prompts import LessonContent, LessonSlide, LessonPractice
from ...config.llm import get_lm_for_locale, get_n_atlas_lm
from ...utils.locale import get_country_name, get_language_name

class StagedLessonGenerator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.plan_generator = dspy.ChainOfThought(GenerateLessonPlan)
        self.slide_generator = dspy.ChainOfThought(GenerateSlide)
        self.practice_generator = dspy.ChainOfThought(GeneratePracticeQuestion)
        self.translate_slide = dspy.ChainOfThought(TranslateLessonSlide)
        self.translate_practice = dspy.ChainOfThought(TranslateLessonPractice)

    def generate_plan(self, country: str, language: str, subject: str, topic: str, grade_level: str) -> LessonPlan:
        pred = self.plan_generator(
            country=country,
            language=language,
            subject=subject,
            topic=topic,
            grade_level=grade_level
        )
        return pred.plan

    def generate_slide(
        self, 
        slide_spec: SlideSpec, 
        subject: str, 
        topic: str, 
        grade_level: str, 
        language: str, 
        previous_context: str,
        country: str
    ) -> LessonSlide:
        pred = self.slide_generator(
            subject=subject,
            topic=topic,
            grade_level=grade_level,
            language=language,
            country=country,
            slide_spec=slide_spec,
            previous_context=previous_context
        )
        return pred.slide

    def generate_practice(
        self, 
        subject: str, 
        topic: str, 
        grade_level: str, 
        language: str, 
        country: str,
        lesson_summary: str
    ) -> LessonPractice:
        pred = self.practice_generator(
            subject=subject,
            topic=topic,
            grade_level=grade_level,
            language=language,
            country=country,
            lesson_summary=lesson_summary
        )
        return pred.practice

    def translate_slide_content(self, slide: LessonSlide, language: str) -> LessonSlide:
        pred = self.translate_slide(
            slide_content=slide,
            target_language=language
        )
        return pred.translated_slide

    def translate_practice_content(self, practice: LessonPractice, language: str) -> LessonPractice:
        pred = self.translate_practice(
            practice_content=practice,
            target_language=language
        )
        return pred.translated_practice

class LessonService:
    def __init__(self):
        self.module = StagedLessonGenerator()

    def _build_context_summary(self, slides: List[LessonSlide]) -> str:
        if not slides:
            return "This is the first slide of the lesson."
        
        summary = "Previous slides covered:\n"
        for i, slide in enumerate(slides):
            summary += f"{i+1}. {slide.title}: {slide.assessment.prompt}\n"
        return summary

    async def generate_lesson(
        self,
        country: str,
        language: str,
        subject: str,
        topic: str,
        grade_level: str
    ) -> dict:
        """
        Generate a full lesson session.
        """
        # Determine LM context
        lm = get_lm_for_locale(language)
        context_manager = dspy.context(lm=lm) if lm else dspy.context()

        language_context = language
    
        with context_manager:
            # 1. Generate Plan
            plan = self.module.generate_plan(country, language_context, subject, topic, grade_level)
            
            # 2. Generate Slides
            slides = []
            context = ""
            for slide_spec in plan.slide_specs: 
                slide = self.module.generate_slide(
                    slide_spec=slide_spec,
                    subject=subject,
                    topic=topic,
                    grade_level=grade_level,
                    language=language_context,
                    previous_context=context,
                    country=country
                )
                slides.append(slide)
                context += f"\n\nSlide: {slide.title}\n{slide.body_md}"

            # 3. Generate Practice
            practice = self.module.generate_practice(
                subject=subject,
                topic=topic,
                grade_level=grade_level,
                language=language_context,
                country=country,
                lesson_summary=context
            )
            
            # 4. Construct Final Object
            return {
                "success": True,
                "session": {
                    "id": f"{subject}-{topic}".lower().replace(" ", "-"),
                    "subject": subject,
                    "topic": topic,
                    "topicIndex": 0,
                    "totalTopics": 1,
                    "explanation": "Lesson generated by AI (Staged)",
                    "practice": practice.dict(),
                    "slides": [s.dict() for s in slides],
                    "phase": "learning",
                    "metadata": {
                        "country": country,
                        "language": language,
                        "gradeLevel": grade_level,
                        "generator": "google-adk-dspy-staged",
                        "learningObjectives": plan.learning_objectives
                    }
                },
                "lesson": {
                    "title": f"{topic} - {grade_level}",
                    "content": f"Lesson plan for {topic}",
                    "keyPoints": plan.key_points,
                    "slides": [s.dict() for s in slides],
                    "examples": [],
                    "practice": practice.dict(),
                    "progress": {"current": 0, "total": len(slides) + 1}
                }
            }

    async def generate_stream(
        self, country: str, language: str, subject: str, topic: str, grade_level: str
    ) -> AsyncGenerator[str, None]:
        """
        Stream the generation process, yielding events for each stage.
        """
        try:
            # Determine LM context
            lm = get_lm_for_locale(language)
            context_manager = dspy.context(lm=lm) if lm else dspy.context()
            
            # Convert codes to names for the prompt
            # country_name = get_country_name(country) # Removed as input is now full name
            country_name = country
            # language_name = get_language_name(language) # Revert
            
            NIGERIAN_LANGUAGES = ["yoruba", "hausa", "igbo"]
            target_language = language
            generation_language = language
            should_translate = language.lower() in NIGERIAN_LANGUAGES

            if should_translate:
                generation_language = "English"
            
            translation_lm = get_n_atlas_lm()
        
            with context_manager:
                yield json.dumps({
                    "type": "status", 
                    "phase": "planning",
                    "message": "Creating lesson plan..."
                })
                
                # 1. Generate Plan
                
                plan = await asyncio.to_thread(
                    self.module.generate_plan, 
                    country_name, generation_language, subject, topic, grade_level
                )
                self._log_interaction(f"PLAN GENERATION ({subject} - {topic})")
                
                yield json.dumps({
                    "type": "plan", 
                    "phase": "generating_slides",
                    "payload": plan.model_dump(by_alias=True),
                    "message": f"Plan created: {len(plan.slide_specs)} slides"
                })
                
                # 2. Generate Slides
                slides = []
                english_slides = []
                for i, spec in enumerate(plan.slide_specs):
                    try:
                        yield json.dumps({
                            "type": "status", 
                            "phase": "generating_slides",
                            "message": f"Generating slide {i+1}/{len(plan.slide_specs)}: {spec.title}..."
                        })
                        
                        # Build context from ENGLISH slides to keep the LLM focused
                        context = self._build_context_summary(english_slides)
                    
                        # Run blocking DSPy call in a thread
                        slide = await asyncio.to_thread(
                            self.module.generate_slide,
                            spec, subject, topic, grade_level, generation_language, context, country_name
                        )
                        self._log_interaction(f"SLIDE {i+1} GENERATION")
                        
                        # Store English copy for context
                        english_slides.append(slide.model_copy(deep=True))
                        
                        # Translation Step if needed
                        if should_translate and translation_lm:
                            yield json.dumps({
                                "type": "status",
                                "phase": "generating_slides",
                                "message": f"Translating slide {i+1} to {target_language}..."
                            })
                            
                            # Use N-Atlas context
                            print(f"[Translation] Translating Slide {i+1} with model: {translation_lm.model}", flush=True)
                            with dspy.context(lm=translation_lm):
                                 slide = await asyncio.to_thread(
                                     self.module.translate_slide_content,
                                     slide, target_language
                                 )
                            print(f"[Translation] Slide {i+1} Output (Title: {slide.title}):\n{slide.body_md[:200]}...", flush=True)
                            self._log_interaction(f"SLIDE {i+1} TRANSLATION")
                        
                        # 0. Apply Proxy Replacement
                        if slide.body_md:
                             slide.body_md = slide.body_md.replace("@@", "\\")
                        if slide.assessment and slide.assessment.options:
                             slide.assessment.options = [opt.replace("@@", "\\") for opt in slide.assessment.options]
    
                        # Clean LaTeX double escaping if present
                        if slide.body_md:
                            slide.body_md = self._repair_content(slide.body_md)
                        if slide.assessment and slide.assessment.options:
                            slide.assessment.options = [self._repair_content(opt) for opt in slide.assessment.options]
                        
                        slides.append(slide)
                        
                        yield json.dumps({
                            "type": "slide", 
                            "phase": "generating_slides",
                            "payload": slide.model_dump(by_alias=True),
                            "index": i,
                            "total": len(plan.slide_specs)
                        })
                    except Exception as e:
                        print(f"Error generating slide {i}: {e}")
                        # Yield error but continue to next slide so the UI doesn't hang
                        yield json.dumps({
                            "type": "error",
                            "phase": "generating_slides",
                            "message": f"Failed to load slide {i+1}: {str(e)}"
                        })
                        # Use a placeholder slide or just skip? 
                        # If we skip, indices might look weird in the UI if it expects contiguous 0..N
                        # But the frontend likely iterates what it receives.
                        # Ideally we could return a placeholder slide.
                        pass
                    
                # 3. Generate Practice
                yield json.dumps({
                    "type": "status", 
                    "phase": "slides_ready",
                    "message": "Slides ready. Finishing touches..."
                })
                    
                yield json.dumps({
                    "type": "status", 
                    "phase": "generating_practice",
                    "message": "Generating practice question..."
                })
                
                lesson_summary = self._build_context_summary(english_slides)
                
                # Run blocking DSPy call in a thread
                practice = await asyncio.to_thread(
                    self.module.generate_practice,
                    subject, topic, grade_level, generation_language, country_name, lesson_summary
                )
                self._log_interaction("PRACTICE GENERATION")

                # Translation Step for Practice
                if should_translate and translation_lm:
                     yield json.dumps({
                         "type": "status",
                         "phase": "generating_practice",
                         "message": f"Translating practice question to {target_language}..."
                     })
                     with dspy.context(lm=translation_lm):
                         practice = await asyncio.to_thread(
                             self.module.translate_practice_content,
                             practice, target_language
                         )
                     self._log_interaction("PRACTICE TRANSLATION")
                
                # Clean LaTeX in practice question
                if practice.options:
                    practice.options = [self._repair_content(opt.replace("@@", "\\")) for opt in practice.options]
                
                yield json.dumps({
                    "type": "practice", 
                    "phase": "complete",
                    "payload": practice.model_dump(by_alias=True)
                })
                
                # 4. Complete
                result = {
                    "success": True,
                    "session": {
                        "id": f"{subject}-{topic}".lower().replace(" ", "-"),
                        "subject": subject,
                        "topic": topic,
                        "topicIndex": 0,
                        "totalTopics": 1,
                        "explanation": "Lesson generated by AI (Staged)",
                        "practice": practice.model_dump(by_alias=True),
                        "slides": [s.model_dump(by_alias=True) for s in slides],
                        "phase": "learning",
                        "metadata": {
                            "country": country,
                            "language": language,
                            "gradeLevel": grade_level,
                            "generator": "google-adk-dspy-staged",
                            "learningObjectives": plan.learning_objectives
                        }
                    },
                    "lesson": {
                        "title": f"{topic} - {grade_level}",
                        "content": f"Lesson plan for {topic}",
                        "keyPoints": plan.key_points,
                        "slides": [s.model_dump(by_alias=True) for s in slides],
                        "examples": [],
                        "practice": practice.model_dump(by_alias=True),
                        "progress": {"current": 0, "total": len(slides) + 1}
                    }
                }
                
                yield json.dumps({
                    "type": "complete", 
                    "phase": "complete",
                    "payload": result
                })
            
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "phase": "error",
                "message": str(e)
            })
            raise e
            
    def _log_interaction(self, stage: str):
        """
        Log the last DSPy interaction for debugging/monitoring.
        """
        if not (dspy.settings.lm and dspy.settings.lm.history):
            print(f"\n[DSPy LOG] {stage}: No history found.")
            return

        last_interaction = dspy.settings.lm.history[-1]
        
        print(f"\n{'='*40}")
        print(f" DSPy LOG: {stage} ")
        print(f"{'='*40}")
        
        # INPUT
        print(">> INPUT (PROMPT/MESSAGES):")
        if 'messages' in last_interaction:
            for msg in last_interaction['messages']:
                role = msg.get('role', 'unknown').upper()
                content = msg.get('content', '')
                # Truncate very long content for sanity if needed, but user wants to monitor.
                print(f"[{role}]: {content[:200]}..." if len(content) > 50000 else f"[{role}]:\n{content}")
        elif 'prompt' in last_interaction:
             print(last_interaction['prompt'])
        if 'usage' in last_interaction:
            print(f">> TOKEN USAGE: {last_interaction['usage']}")
        
        print(f"\n{'-'*20}")
        
        # OUTPUT
        print(">> OUTPUT (RESPONSE):")
        response = last_interaction.get('response')
        if response:
            if hasattr(response, 'choices'):
                 print(response.choices[0].message.content)
            elif isinstance(response, dict) and 'choices' in response:
                 print(response['choices'][0]['message']['content'])
            else:
                 print(str(response))
        else:
             print("[No response object]")
             
        print(f"{'='*40}\n") 

    def _repair_content(self, text: str) -> str:
        """
        Robustly repair content (LaTeX and Markdown) from LLM output.
        1. Fixes common JSON escape corruptions (e.g. \\t parsed as tab).
        2. Normalizes delimiters ($$, \\[, \\() to <latex-block/inline> tags.
        3. Fixes formatting issues like newlines inside bold tags.
        """
        if not text:
            return text

        # 0. Apply Proxy Replacement
        # The prompt instructs LLM to use @@ instead of \ to avoid JSON escaping issues.
        text = text.replace("@@", "\\")

        # 1. Generic Fallback Repairs (for common control chars -> escapes)
        # This handles cases where LLM output single backslashes in JSON (e.g. "\text" -> tab character).
        # We replace the control character with an escaped backslash if followed by a letter.
        # \b (Backspace) -> \\b, \f (Formfeed) -> \\f, \r (Carriage Return) -> \\r, \t (Tab) -> \\t
        text = re.sub(r'[\x08\x0c\r\t](?=[a-zA-Z])', lambda m: '\\' + {'\x08':'b', '\x0c':'f', '\r':'r', '\t':'t'}[m.group(0)], text)
        
        # Note: We do NOT repair \n (newlines) because they are ambiguous (could be formatting).
        # We rely on the "@@" proxy strategy (e.g. @@nabla) to handle newline-starting commands safely.

        # 2. Normalize Delimiters
        # Replace $$...$$ with <latex-block>...</latex-block>
        # Use regex to match paired $$...$$ (non-greedy)
        text = re.sub(r'\$\$(.*?)\$\$', r'<latex-block>\1</latex-block>', text, flags=re.DOTALL)
        
        # Replace \[...\] with <latex-block>...</latex-block>
        text = re.sub(r'\\\[(.*?)\\\]', r'<latex-block>\1</latex-block>', text, flags=re.DOTALL)
        
        # Replace \(...\) with <latex-inline>...</latex-inline>
        text = re.sub(r'\\\((.*?)\\\)', r'<latex-inline>\1</latex-inline>', text, flags=re.DOTALL)
        
        # Replace single $...$ with <latex-inline>...</latex-inline>
        # Negative lookbehind to avoid matching \$ (literal dollar)
        # Avoid matching $$ (handled above) - actually checking non-greedy above handles it?
        # If we have $$...$$, the first pass consumes outputting <longer_tag>.
        # So $...$ regex won't see $$ unless it was unmatched.
        # We need to be careful about currency. But in math context, $ is math.
        text = re.sub(r'(?<!\\)\$(.*?)(?<!\\)\$', r'<latex-inline>\1</latex-inline>', text, flags=re.DOTALL)

        # 3. Fix Markdown formatting
        # Move trailing newlines out of bold tags: **Title:\n** -> **Title:**\n
        text = re.sub(r'\*\*(?P<content>.*?)\n\s*\*\*', r'**\g<content>**\n', text)

        # 4. Wrap TikZ environments in code blocks for frontend rendering
        # Match \begin{tikzpicture} ... \end{tikzpicture}
        # Use simple regex, assuming balanced environment (no nested tikzpictures usually)
        text = re.sub(
            r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})', 
            r'\n```tikz\n\1\n```\n', 
            text, 
            flags=re.DOTALL
        )

        return text
