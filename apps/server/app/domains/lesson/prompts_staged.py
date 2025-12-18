
from typing import List, Literal, Optional
import dspy
from pydantic import BaseModel, Field
from .prompts import LessonSlide, LessonPractice

class SlideSpec(BaseModel):
    """Specification for a single slide in the lesson plan."""
    slide_type: Literal[
        "concept_introduction",
        "worked_example",
        "scaffolded_problem",
        "misconception",
        "synthesis",
    ] = Field(alias="slideType", description="Pedagogical type")
    title: str = Field(description="Slide title")
    key_concept: str = Field(alias="keyConcept", description="Key concept to cover")

    class Config:
        populate_by_name = True

class LessonPlan(BaseModel):
    """A structured plan for the lesson."""
    learning_objectives: List[str] = Field(alias="learningObjectives", min_length=3, max_length=5, description="Measurable objectives")
    key_points: List[str] = Field(alias="keyPoints", description="3-5 key takeaways")
    slide_specs: List[SlideSpec] = Field(alias="slideSpecs", min_length=3, max_length=6, description="Sequence of slides")

    class Config:
        populate_by_name = True

class GenerateLessonPlan(dspy.Signature):
    """
    Create a pedagogical lesson plan.
    Break down the topic into a logical specific sequence of 3-6 slides.
    Ensure a mix of concept, example, and practice slides.
    """
    country: str = dspy.InputField(desc="Target country for cultural context")
    language: str = dspy.InputField(desc="Language of instruction")
    subject: str = dspy.InputField(desc="The academic subject")
    topic: str = dspy.InputField(desc="Specific topic to teach")
    grade_level: str = dspy.InputField(desc="Target grade level")
    
    plan: LessonPlan = dspy.OutputField(desc="Structured lesson plan with slide specifications")

class GenerateSlide(dspy.Signature):
    """
    Generate a single lesson slide.
    
    CONTENT RULES:
    - Create rich content appropriate for the grade level.
    - Use Markdown.
    - Assessment options: EXACTLY 4.
    
    LANGUAGE & CULTURAL CONTEXT Rules:
    - Generate ALL content in `language`.
    - Use `country` for context.
    
    MATH/CHEMISTRY NOTATION:
    - Target fields: `bodyMd`, `assessment.options`, `assessment.prompt` (REQUIRED), `assessment.correctFeedback`, `assessment.incorrectFeedback`.
    - Use <latex-inline>...</latex-inline> strictly for math/chem.
    - Use <latex-block>...</latex-block> for standout equations.
    - DO NOT use \text{} inside tags.
    
    CORRECT: "Sodium chloride (<latex-inline>\ce{NaCl}</latex-inline>)"
    CORRECT: "<latex-inline>x^2 + y^2 = z^2</latex-inline>"

    RULES:
    1. Use standard LaTeX macros (e.g. \frac, \ce).
    2. LATEX PROXY: Use "@@" instead of "\" for ALL commands to avoid JSON issues.
       Example: "@@frac{a}{b}" -> "\frac{a}{b}".
    3. No delimiters inside tags. 
    4. NO TIKZ/GRAPHICS. 
    """
    
    subject: str = dspy.InputField(desc="The academic subject")
    topic: str = dspy.InputField(desc="Specific topic")
    grade_level: str = dspy.InputField(desc="Target grade level")
    country: str = dspy.InputField(desc="Target country for cultural context")
    language: str = dspy.InputField(desc="Language of instruction. Generate ALL content in this language.")
    
    previous_context: str = dspy.InputField(desc="Summary of what has been taught in previous slides")
    slide_spec: SlideSpec = dspy.InputField(desc="Specification for the slide to generate")
    
    slide: LessonSlide = dspy.OutputField(desc="The generated slide content including assessment")

class GeneratePracticeQuestion(dspy.Signature):
    r"""
    Generate a final practice question to assess the student's understanding of the lesson.
    The question should be challenging but solvable based on the lesson content.
    Provide EXACTLY 4 options.
    Use Markdown for formatting (bold, italics, lists).

    LANGUAGE & CULTURAL CONTEXT Rules:
    - Generate ALL content in the specified `language`.
    - Only use English if the requested language is English.
    - Use the specified `country` to provide culturally relevant context.

    MATH/CHEMISTRY NOTATION:
    - Target fields: `practice.question`, `practice.options`, `practice.correctFeedback`, `practice.incorrectFeedback`.
    - Use <latex-inline>...</latex-inline> strictly for mathematical expressions (e.g., equations, variables) and chemical formulas.
    - Use <latex-block>...</latex-block> for standout equations.
    - DO NOT use these tags for regular text, definitions, or descriptions.
    - DO NOT use \text{} inside these tags for regular sentences.
    
    CORRECT (Mixed): "Sodium chloride (<latex-inline>\ce{NaCl}</latex-inline>) is a salt."
    CORRECT (Pure Math): "<latex-inline>x^2 + y^2 = z^2</latex-inline>"
    CORRECT (Math Option): ["<latex-inline>2x</latex-inline>", "<latex-inline>x^2</latex-inline>"]
    INCORRECT: "<latex-inline>\text{The formula for water is }\ce{H2O}</latex-inline>."
    INCORRECT: "2x" (Missing tags for variable)

    RULES:
    1. Use standard LaTeX macro syntax (e.g., \frac{}{}, \ce{}).
    2. LATEX PROXY: To avoid JSON escaping issues, use "@@" instead of "\" for ALL LaTeX commands.
       - Example: Use "@@frac{a}{b}" instead of "\frac{a}{b}".
       - Example: Use "@@text{Force}" instead of "\text{Force}".
       - We will automatically convert "@@" back to "\" for you.
    3. Do NOT use delimiters inside the tags (no $, \(, or \[). 
    4. NO TIKZ/GRAPHICS: Do NOT use \begin{tikzpicture}, \begin{axis}, or similar. The renderer only supports standard math equations. 
    """
    
    subject: str = dspy.InputField(desc="The academic subject")
    topic: str = dspy.InputField(desc="Specific topic")
    grade_level: str = dspy.InputField(desc="Target grade level")
    country: str = dspy.InputField(desc="Target country for cultural context")
    language: str = dspy.InputField(desc="Language of instruction. Generate ALL content in this language.")
    lesson_summary: str = dspy.InputField(desc="Summary of the lesson content covered")
    
    practice: LessonPractice = dspy.OutputField(desc="Practice question with feedback")

class TranslateLessonSlide(dspy.Signature):
    """
    Translate the content of a lesson slide into the target language.
    
    CRITICAL LATEX RULES:
    1. KEEP ALL <latex-inline>...</latex-inline> and <latex-block>...</latex-block> tags EXACTLY AS IS.
    2. DO NOT TRANSLATE content inside these tags.
    3. DO NOT MODIFY "@@" proxies (e.g. "@@frac", "@@ce") inside these tags.
    
    Ensure pedagogical quality and cultural relevance in the translation.
    """
    
    slide_content: LessonSlide = dspy.InputField(desc="The slide content to translate")
    target_language: str = dspy.InputField(desc="The language to translate into")
    
    translated_slide: LessonSlide = dspy.OutputField(desc="The translated slide content")

class TranslateLessonPractice(dspy.Signature):
    """
    Translate the practice question and feedback into the target language.
    
    CRITICAL LATEX RULES:
    1. KEEP ALL <latex-inline>...</latex-inline> and <latex-block>...</latex-block> tags EXACTLY AS IS.
    2. DO NOT TRANSLATE content inside these tags.
    3. DO NOT MODIFY "@@" proxies.

    STRUCTURE RULES:
    1. You MUST return the COMPLETE object with ALL fields: `question`, `options`, `answerIndex`, `correctFeedback`, `incorrectFeedback`.
    2. `answerIndex` must remain an integer.
    3. Translate the content of `question`, `options`, `correctFeedback`, and `incorrectFeedback`.
    """
    
    practice_content: LessonPractice = dspy.InputField(desc="The practice question to translate")
    target_language: str = dspy.InputField(desc="The language to translate into")
    
    translated_practice: LessonPractice = dspy.OutputField(desc="The translated practice content")
