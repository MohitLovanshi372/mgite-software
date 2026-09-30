"""
Root gender_normalization utility module.
Provides direct access to GenderNormalizer and normalize_feminine_gender.
"""

from .core.voice.gender_normalization import GenderNormalizer, normalize_feminine_gender

__all__ = ["GenderNormalizer", "normalize_feminine_gender"]
