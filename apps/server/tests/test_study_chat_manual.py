import asyncio
import sys
import os

# Add project root to path (assuming running from root)
sys.path.append(os.getcwd())

from apps.server.app.domains.study.service import StudyService
from apps.server.app.settings import get_settings
from apps.server.app.config.llm import configure_llm

async def main():
    settings = get_settings()
    configure_llm(settings)
    
    service = StudyService()
    history = []
    
    # Test 1: Math with Calculator (English)
    print("--- Test 1: English Math (Calculator) ---")
    question = "Calculate 25 * 4 + 10"
    print(f"User: {question}")
    try:
        res = await service.chat(history=history, message=question, language="English")
        print(f"Agent: {res['answer']}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 2: General Question (Pidgin / N-Atlas)
    print("\n--- Test 2: Pidgin Question (N-Atlas) ---")
    question = "Abeg explain wetin be noun for me."
    print(f"User: {question}")
    try:
        res = await service.chat(history=history, message=question, language="Pidgin")
        print(f"Agent: {res['answer']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
