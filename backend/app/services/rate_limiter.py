import time
from typing import Any, Dict
from app.config import settings

class RateLimiterService:
    """
    Session quota tracker keyed by client IP or browser fingerprint.
    Distinguishes expensive cold-starts (consumes quota) from cached/pinned runs (free).
    """

    def __init__(self):
        # Maps client_id -> {"cold_runs": int, "cached_runs": int, "last_reset": float}
        self._buckets: Dict[str, Dict[str, Any]] = {}

    def _get_bucket(self, client_id: str) -> Dict[str, Any]:
        now = time.time()
        bucket = self._buckets.get(client_id)
        if not bucket or (now - bucket.get("last_reset", 0)) > 86400:
            bucket = {
                "cold_runs": 0,
                "cached_runs": 0,
                "last_reset": now
            }
            self._buckets[client_id] = bucket
        return bucket

    def check_and_consume(self, client_id: str, is_cold_run: bool) -> bool:
        """
        Returns True if within quota. Consumes 1 credit if is_cold_run is True.
        """
        bucket = self._get_bucket(client_id)
        if is_cold_run:
            if bucket["cold_runs"] >= settings.DAILY_INQUIRY_LIMIT:
                return False
            bucket["cold_runs"] += 1
        else:
            bucket["cached_runs"] += 1
        return True

    def get_quota_status(self, client_id: str) -> Dict[str, int]:
        bucket = self._get_bucket(client_id)
        cold = bucket["cold_runs"]
        cached = bucket["cached_runs"]
        remaining = max(settings.DAILY_INQUIRY_LIMIT - cold, 0)
        return {
            "daily_limit": settings.DAILY_INQUIRY_LIMIT,
            "remaining": remaining,
            "cold_runs": cold,
            "cached_runs": cached
        }

rate_limiter = RateLimiterService()
