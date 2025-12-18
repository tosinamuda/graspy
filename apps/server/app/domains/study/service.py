import dspy
from .prompts import StudyChat
from .tools import Calculator, CurrentTime
from ...config.llm import get_lm_for_locale

class StudyAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.tools = [Calculator(), CurrentTime()]
        self.react = dspy.ReAct(StudyChat, tools=self.tools)

    def forward(self, history: list, question: str, language: str):
        # Format history string
        history_str = ""
        for msg in history:
            role = msg.get("sender", "user")
            content = msg.get("content", "")
            history_str += f"{role}: {content}\n"
            
        return self.react(history=history_str, question=question, language=language)

class StudyService:
    def __init__(self):
        self.module = StudyAgent()

    async def chat(self, history: list, message: str, language: str) -> dict:
        """
        Chat with the Study Agent.
        Returns:
            dict: {"answer": str}
        """
        lm = get_lm_for_locale(language)
        # Use context manager if a specific LM is returned (e.g. N-Atlas for local languages)
        # Otherwise uses the default configured LM (e.g. Bedrock/OpenRouter)
        context_manager = dspy.context(lm=lm) if lm else dspy.context()
        
        with context_manager:
            prediction = self.module(history=history, question=message, language=language)
            
        return {
            "answer": prediction.answer
        }
