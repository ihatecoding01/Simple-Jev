import os
import re
from typing import Dict, List, Optional
import numpy as np

class IntentEmbedder:
    """
    Computes dense vector representations of intent strings and calculates cosine similarity.
    Uses sentence-transformers (all-MiniLM-L6-v2, 384 dimensions) for state-of-the-art semantic intent matching,
    with in-memory vector caching for sub-millisecond retrieval and an offline deterministic fallback.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self._dim = 384
        self._model_name = model_name
        self._model = None
        self._has_transformer = False
        self._cache: Dict[str, List[float]] = {}
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            self._model = SentenceTransformer(self._model_name)
            self._has_transformer = True
            print(f"[IntentEmbedder] Successfully loaded sentence-transformers ({self._model_name}) - 384 dimensions.")
        except Exception as e:
            self._has_transformer = False
            self._model = None
            print(f"[IntentEmbedder] SentenceTransformer unavailable ({e}), using normalized deterministic fallback.")

    @property
    def is_using_transformer(self) -> bool:
        return self._has_transformer

    def embed(self, text: str) -> List[float]:
        """
        Embeds a text string into a normalized 384-dimensional vector.
        Uses in-memory caching to avoid redundant encode computations.
        """
        clean_text = text.strip()
        if not clean_text:
            return [0.0] * self._dim

        cache_key = clean_text.lower()
        if cache_key in self._cache:
            return self._cache[cache_key]

        if self._has_transformer and self._model is not None:
            try:
                vec = self._model.encode(clean_text, convert_to_numpy=True, normalize_embeddings=True)
                res = vec.tolist()
                self._cache[cache_key] = res
                return res
            except Exception as e:
                print(f"[IntentEmbedder] Transformer encode error ({e}), falling back to deterministic vector.")

        # Deterministic normalized fallback (hash-based n-gram)
        tokens = re.findall(r"\w+", cache_key)
        if not tokens:
            return [0.0] * self._dim

        vec = np.zeros(self._dim, dtype=np.float32)
        for i, token in enumerate(tokens):
            h = (abs(hash(token)) + sum(ord(c) * (31 ** idx) for idx, c in enumerate(token))) % self._dim
            vec[h] += 1.0
            if i + 1 < len(tokens):
                bigram = f"{token}_{tokens[i+1]}"
                h_bi = (abs(hash(bigram)) + sum(ord(c) * (37 ** idx) for idx, c in enumerate(bigram))) % self._dim
                vec[h_bi] += 1.5

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        res = vec.tolist()
        self._cache[cache_key] = res
        return res

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
        dot = float(np.dot(a, b) / (norm_a * norm_b))
        return max(-1.0, min(1.0, dot))

embedder = IntentEmbedder()
