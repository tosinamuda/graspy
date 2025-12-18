from typing import Dict

COUNTRY_MAP: Dict[str, str] = {
    "NG": "Nigeria",
    "US": "United States",
    "GB": "United Kingdom",
    "GH": "Ghana",
    "KE": "Kenya",
    "ZA": "South Africa",
    "CN": "China",
    "IN": "India",
    "BR": "Brazil",
    "FR": "France",
    "DE": "Germany",
    "ES": "Spain",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
}

LANGUAGE_MAP: Dict[str, str] = {
    "en": "English",
    "yo": "Yoruba",
    "ha": "Hausa",
    "ig": "Igbo",
    "fr": "French",
    "es": "Spanish",
    "ar": "Arabic",
    "sw": "Swahili",
    "zh": "Chinese",
    "hi": "Hindi",
    "pt": "Portuguese",
}

def get_country_name(code: str) -> str:
    """Get full country name from 2-letter code, or return code if not found."""
    return COUNTRY_MAP.get(code.upper(), code)

def get_language_name(code: str) -> str:
    """Get full language name from code, or return code if not found."""
    return LANGUAGE_MAP.get(code.lower(), code)
