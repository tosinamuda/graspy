from typing import List, Optional
import dspy
from pydantic import BaseModel, Field

class TutorChatResponse(BaseModel):
    answer: str = Field(..., description="Helpful, encouraging response using Markdown and custom latex tags")
    follow_ups: List[str] = Field(default_factory=list, description="2-3 short follow-up questions to deepen understanding", alias="followUps")

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "To solve this, use the quadratic formula: <latex-block>x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</latex-block>. Let's identify <latex-inline>a</latex-inline>, <latex-inline>b</latex-inline>, and <latex-inline>c</latex-inline> from your equation.",
                "followUps": ["What is the value of <latex-inline>a</latex-inline>?", "Can you simplify the radical?"]
            }
        }

class TutorChat(dspy.Signature):
    """
    Act as a helpful and encouraging tutor. Answer the student's question about the subject.
    
    OUTPUT FORMAT:
    - Return valid JSON
    - Use Markdown formatting within text content

    LANGUAGE Rules:
    - Respond strictly in the specified `language`.
    - Adapt the tone to be culturally appropriate for the `country` if provided.
    
    MATH/CHEMISTRY NOTATION:
    Wrap all mathematical and chemical expressions in custom tags:
    - <latex-inline>...</latex-inline> for inline expressions
    - <latex-block>...</latex-block> for displayed equations or multi-line expressions
    
    Use standard LaTeX syntax inside the tags (e.g., \\frac{}{}, \\ce{} for chemistry).
    Do not use $, \\(, or \\[ as delimiters. Do not wrap plain text in these tags.
    
    EXAMPLE: "The answer is <latex-inline>x^2</latex-inline> or <latex-inline>\\ce{H2O}</latex-inline>."
    """
    
    subject: str = dspy.InputField(desc="The academic subject being discussed")
    language: str = dspy.InputField(desc="The language of interaction")
    history: List[dict] = dspy.InputField(desc="Chat history")
    message: str = dspy.InputField(desc="Student's new message")
    
    response: TutorChatResponse = dspy.OutputField()


