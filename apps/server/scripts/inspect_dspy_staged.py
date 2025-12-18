import asyncio
import dspy
import sys
import json
from app.domains.lesson.service_staged import LessonService
from app.settings import Settings
from app.config.llm import configure_llm

# Mock the settings and LLM configuration for inspection purposes
# We want to see what is sent to the LLM, so we need a real-ish environment or a spy.
# Since we are just inspecting the prompt construction, we can try to run it.

async def main():
    print("Initializing settings and LM...")
    settings = Settings()
    # Ensure basic settings for local dev if env vars missing
    settings.strands_model_id = settings.strands_model_id or "amazon.nova-lite-v1:0"
    
    configure_llm(settings)
    
    service = LessonService()
    
    print("\nGenerating Lesson (Drafting)...")
    try:
        # Generate a small lesson part
        # We catch exceptions because we mainly want to see the PROMPT, 
        # even if it fails later or we don't care about the result.
        # Use simple inputs
        result = await service.generate_lesson(
            country="Nigeria",
            language="Yoruba",
            subject="Ìtàn-ìsọ̀rọ̀",
            topic="Ìtàn-ìsọ̀rọ̀ Yorùbá JSS 2",
            grade_level="JSS 2"
        )
        print("Generation Success!")
    except Exception as e:
        print(f"Generation hit an error (expected if mock env or no creds): {e}")

    # INSPECT HISTORY
    print("\n\n" + "="*80)
    print("LAST DSPy PROMPT SENT TO LLM:")
    print("="*80)
    
    if dspy.settings.lm and dspy.settings.lm.history:
        # We want to see all interactions to check the chain
        for i, interaction in enumerate(dspy.settings.lm.history):
             print(f"\n--- Interaction {i+1} ---")
             if 'messages' in interaction:
                 for msg in interaction['messages']:
                     role = msg.get('role', 'unknown').upper()
                     content = msg.get('content', '')
                     print(f"[{role}]:\n{content}\n")
             elif 'prompt' in interaction:
                 print(interaction['prompt'])
             else:
                 print(json.dumps(interaction, indent=2, default=str))
                 
             print("-" * 40)
             if 'response' in interaction:
                 resp = interaction['response']
                 if hasattr(resp, 'choices'):
                      print(f"RESPONSE: {resp.choices[0].message.content[:200]}...")
                 else:
                      print(f"RESPONSE: {str(resp)[:200]}...")

    else:
        print("No history found. Did the generation run?")

if __name__ == "__main__":
    asyncio.run(main())
