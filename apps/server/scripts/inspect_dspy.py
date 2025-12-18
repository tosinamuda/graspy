import asyncio
import dspy
import sys
import json
from app.domains.lesson.service import LessonService
from app.settings import Settings
from app.config.llm import configure_llm

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
        result = await service.generate_lesson(
            country="US",
            language="en",
            subject="Mathematics",
            topic="Linear Equations",
            grade_level="High School"
        )
        print("Generation Success!")
    except Exception as e:
        print(f"Generation hit an error (expected if mock env): {e}")

    # INSPECT HISTORY
    print("\n\n" + "="*80)
    print("LAST DSPy PROMPT SENT TO LLM:")
    print("="*80)
    
    if dspy.settings.lm and dspy.settings.lm.history:
        last_interaction = dspy.settings.lm.history[-1]
        
        print("\n" + "="*80)
        print(" INPUT (PROMPT / MESSAGES) ")
        print("="*80)
        
        # Handle different history formats (dspy v2 vs v3 vs litellm)
        if 'messages' in last_interaction:
            for msg in last_interaction['messages']:
                role = msg.get('role', 'unknown').upper()
                content = msg.get('content', '')
                print(f"[{role}]:\n{content}\n")
        elif 'prompt' in last_interaction:
            print(last_interaction['prompt'])
        else:
            print(json.dumps(last_interaction, indent=2, default=str))

        print("\n" + "="*80)
        print(" OUTPUT (RESPONSE) ")
        print("="*80)
        
        # Try to find response/choices
        response = last_interaction.get('response')
        if response:
            # LiteLLM / OpenAI format often has 'choices' -> 'message' -> 'content'
            if hasattr(response, 'choices'):
                print(response.choices[0].message.content)
            elif isinstance(response, dict) and 'choices' in response:
                 print(response['choices'][0]['message']['content'])
            else:
                print(str(response))
        else:
             print("No response found in history item.")
             
        print("\n" + "="*80)
        print(f"Usage: {last_interaction.get('usage', 'Unknown')}")
    else:
        print("No history found. Did the generation run?")

if __name__ == "__main__":
    asyncio.run(main())
