from __future__ import annotations

import dspy
import logging
import litellm
from typing import Optional

from ..settings import Settings

logger = logging.getLogger("dspy")

def configure_llm(settings: Settings) -> None:
    """
    Configure DSPy with the proper LM backend using LiteLLM/Bedrock.
    """
    # Fix for Bedrock not supporting 'response_format' (enforced by dspy)
    litellm.drop_params = True
    
    model_id = settings.strands_model_id or "amazon.nova-lite-v1:0"
    
    # Ensure region is set in env for boto3/litellm if not already
    # (Settings class handles env var population, so we assume it's done)

    # Prefix with 'bedrock/' for litellm if not present, though dspy might handle it differently depending on the LM class.
    # We will use dspy.LM which uses litellm under the hood in dspy v3 (recheck this assumption or use dspy.AWSBedrock if preferred).
    # dspy v3 uses dspy.LM as a generic wrapper usually.
    
    # However, to be safe and explicit with Bedrock through LiteLLM:
    full_model_id = f"bedrock/{model_id}" if not model_id.startswith("bedrock/") else model_id

    logger.info(f"Configuring DSPy with model: {full_model_id}")

    lm = dspy.LM(
        model=full_model_id,
        max_tokens=settings.strands_max_tokens or 8192,
        temperature=settings.strands_default_temperature or 0.7,
    )
    
    dspy.settings.configure(lm=lm, experimental=True)
    
    logger.info("DSPy configuration complete.")


def get_n_atlas_lm() -> Optional[dspy.LM]:
    """
    Get the N-Atlas LM instance on demand.
    Instantiates a new dspy.LM object using current settings.
    """
    from ..settings import get_settings
    settings = get_settings()
    
    if not settings.n_atlas_api_base:
        return None
        
    try:
        lm = dspy.LM(
            model=settings.n_atlas_model_id,
            api_base=settings.n_atlas_api_base,
            api_key="EMPTY",  # vLLM on Modal usually requires dummy key or none
            max_tokens=4096,  # Conservative default
            temperature=0.7,
        )
        return lm
    except Exception as e:
        logger.error(f"Failed to instantiate N-Atlas LM: {e}", exc_info=True)
        return None


def get_lm_for_locale(language: str) -> Optional[dspy.LM]:
    """
    Get the appropriate LM for the given locale.
    Returns n_atlas_lm for Nigerian languages (Yoruba, Hausa, Igbo) and other low-resource languages, None otherwise.
    """
    # Check for full language names (case-insensitive for robustness)
    target_languages = ["yoruba", "hausa", "igbo", "pidgin"]
    if language.lower() in target_languages:
        return get_n_atlas_lm()
    return None

