import dspy
from .prompts import TutorChat

from ...config.llm import get_lm_for_locale

class TutorBot(dspy.Module):
    def __init__(self):
        super().__init__()
        self.respond = dspy.ChainOfThought(TutorChat)
    
    def forward(self, subject: str, language: str, history: list, message: str):
        return self.respond(subject=subject, language=language, history=history, message=message)

class TutorService:
    def __init__(self):
        self.module = TutorBot()

    async def chat(self, subject: str, language: str, history: list, message: str) -> dict:
        # Determine LM context
        lm = get_lm_for_locale(language)
        context_manager = dspy.context(lm=lm) if lm else dspy.context()

        with context_manager:
            prediction = self.module(
                subject=subject,
                language=language,
                history=history,
                message=message
            )
        
        return {
            "answer": prediction.response.answer,
            "followUps": prediction.response.follow_ups
        }
