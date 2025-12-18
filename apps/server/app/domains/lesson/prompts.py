from typing import List, Literal, Optional, Any
import dspy
from pydantic import BaseModel, Field, model_validator

# Replicate schemas.py models needed for generation to ensure structure

class LessonSlideAssessment(BaseModel):
    type: Literal["choice"] = "choice"
    prompt: str = Field(description="The question or task for the student")
    options: List[str] = Field(min_length=2, max_length=5, description="Provide exactly 3 options. Wrap math in <latex-inline>...</latex-inline>. Use \\ce{} for chemistry inside tags.")
    answer_index: int = Field(alias="answerIndex", description="Zero-based index of the correct answer")
    correct_feedback: str = Field(alias="correctFeedback", description="Encouraging feedback explaining why the answer is correct")
    incorrect_feedback: str = Field(alias="incorrectFeedback", description="Constructive feedback explaining the mistake")

    @model_validator(mode='before')
    @classmethod
    def alias_question_to_prompt(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Fallback: if 'question' is provided but 'prompt' is missing, map it.
            if 'prompt' not in data and 'question' in data:
                data['prompt'] = data['question']
        return data

    class Config:
        populate_by_name = True

class LessonSlide(BaseModel):
    slide_type: Literal[
        "concept_introduction",
        "worked_example",
        "scaffolded_problem",
        "misconception",
        "synthesis",
    ] = Field(alias="slideType", description="The pedagogical type of the slide")
    title: str = Field(description="Concise title of the slide")
    body_md: str = Field(alias="bodyMd", description="Main slide content in Markdown. Use custom latex tags for math. Use \\ce{} for chemical formulas.")
    assessment: LessonSlideAssessment

    class Config:
        populate_by_name = True

class LessonPractice(BaseModel):
    question: str = Field(description="Practice question to reinforce learning")
    options: List[str] = Field(min_length=2, max_length=5, description="Provide exactly 3 options. Wrap math in <latex-inline>...</latex-inline>. Use \\ce{} for chemistry inside tags.")
    answer_index: int = Field(alias="answerIndex", description="Zero-based index of the correct answer")
    correct_feedback: str = Field(alias="correctFeedback", description="Encouraging feedback explaining why the answer is correct")
    incorrect_feedback: str = Field(alias="incorrectFeedback", description="Constructive feedback explaining the mistake")

class LessonContent(BaseModel):
    title: str = Field(description="Overall title of the lesson")
    content: str = Field(description="Brief introduction or summary of the lesson topic")
    key_points: List[str] = Field(alias="keyPoints", description="List of 3-5 key takeaways")
    slides: List[LessonSlide] = Field(min_length=1, description="Generate between 3-5 slides")
    examples: List[str] = Field(default_factory=list)
    practice: LessonPractice

    class Config:
        json_schema_extra = {
            "example": {
                 "title": "Introduction to Matrices",
                 "content": "Matrices are fundamental...",
                 "keyPoints": ["Matrix definition", "Dimensions"],
                 "slides": [
                      {
                           "slideType": "concept_introduction",
                           "title": "Introduction to Matrices",
                           "bodyMd": "A matrix is a rectangular array. For example: <latex-block>\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}</latex-block>",
                           "assessment": {
                                "type": "choice",
                                "prompt": "Identify the dimension of <latex-block>\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}</latex-block>",
                                "options": ["The solution is <latex-inline>x = 5</latex-inline>", "All real numbers", "<latex-inline>x > 0</latex-inline>"],
                                "answerIndex": 1,
                                "correctFeedback": "Correct! It has 2 rows and 1 column.",
                                "incorrectFeedback": "Count the rows and columns."
                           }
                      }
                 ],
                 "examples": [],
                 "practice": {
                     "question": "What is a matrix?",
                     "options": ["A rectangular array", "A circle", "A line"],
                     "answerIndex": 0,
                     "correctFeedback": "Yes",
                     "incorrectFeedback": "No"
                 }
            }
        }

class GenerateSlide(dspy.Signature):
    """
    Generate a specific slide for a lesson.
    
    INSTRUCTIONS:
    1. Content MUST be in the target `language`.
    2. Output strict JSON only.
    3. Do NOT output the JSON schema definition. Output a valid JSON instance.
    4. Ensure `assessment` is fully populated with `prompt`, `options` (2-5 items), `answerIndex`, `correctFeedback`, and `incorrectFeedback`.
    """
    
    country: str = dspy.InputField(desc="Target country for cultural context")
    language: str = dspy.InputField(desc="Language of instruction")
    subject: str = dspy.InputField(desc="The academic subject")
    topic: str = dspy.InputField(desc="Specific topic to teach")
    grade_level: str = dspy.InputField(desc="Target grade level")
    
    slide: LessonSlide = dspy.OutputField(desc="A single lesson slide")

class GenerateLessonContent(dspy.Signature):
    """
    Generate a complete lesson including slides, practice questions, and key points.
    
    OUTPUT FORMAT:
    - Return valid JSON (no markdown code fences, no triple quotes)
    - Use Markdown formatting within text content
    - Every slide must include an assessment object with exactly 3 options

    LANGUAGE Rules:
    - Generate ALL content (titles, body, questions, feedback) in the specified `language`.
    - Only use English if the requested language is English.
    
    MATH/CHEMISTRY NOTATION:
    Wrap all mathematical and chemical expressions in custom tags:
    - <latex-inline>...</latex-inline> for inline expressions
    - <latex-block>...</latex-block> for displayed equations or multi-line expressions
    
    Use standard LaTeX syntax inside the tags (e.g., \\frac{}{}, \\ce{} for chemistry).
    RULES:
    1. Use standard LaTeX macro syntax (e.g., \frac{}{}, \ce{}).
    2. LATEX PROXY: To avoid JSON escaping issues, use "@@" instead of "\" for ALL LaTeX commands.
       - Example: Use "@@frac{a}{b}" instead of "\frac{a}{b}".
       - Example: Use "@@text{Force}" instead of "\text{Force}".
       - We will automatically convert "@@" back to "\" for you.
    3. Do NOT use delimiters inside the tags (no $, \(, or \[).
    4. DIAGRAMS: Use TikZ (@@begin{tikzpicture}) for all graphs and diagrams.
       - Do NOT use @@includegraphics. External images are not supported.
    
    EXAMPLE OPTIONS: ["<latex-inline>x^2</latex-inline>", "Plain text", "<latex-inline>\\ce{H2O}</latex-inline>"]
    """
    
    country: str = dspy.InputField(desc="Target country for cultural context")
    language: str = dspy.InputField(desc="Language of instruction")
    subject: str = dspy.InputField(desc="The academic subject")
    topic: str = dspy.InputField(desc="Specific topic to teach")
    grade_level: str = dspy.InputField(desc="Target grade level")
    
    lesson: LessonContent = dspy.OutputField(desc="Complete lesson content")
