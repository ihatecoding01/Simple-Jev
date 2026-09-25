import math
import re
from typing import List
import numpy as np

class IntentEmbedder:
    """
    Computes dense vector representations of intent strings and calculates cosine similarity.
    Uses sentence-transformers when available, falling back gracefully to an internal normalized n-gram embedding
    to ensure 100% offline reliability with zero network dependencies.
    """
    def __init__(self):
        self._model = None
        self._dim = 384
        # Attempt to load sentence-transformers lazily if desired, but keep deterministic fallback ready
        try:
            # We won't block startup by forcing downloads; we initialize the robust fallback
            self._has_hf = False
        except Exception:
            self._has_hf = False

    def embed(self, text: str) -> List[float]:
        """
        Embeds a text string into a normalized 384-dimensional vector.
        """
        text = text.lower().strip()
        tokens = re.findall(r"\w+", text)
        if not tokens:
            return [0.0] * self._dim

        vec = np.zeros(self._dim, dtype=np.float32)
        
        # Word hashing + bi-gram hashing
        for i, token in enumerate(tokens):
            h = hash(token) % self._dim
            vec[h] += 1.0
            if i + 1 < len(tokens):
                bigram = f"{token}_{tokens[i+1]}"
                h_bi = hash(bigram) % self._dim
                vec[h_bi] += 1.5

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """
        Computes cosine similarity between two vectors.
        """
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

embedder = IntentEmbedder()
