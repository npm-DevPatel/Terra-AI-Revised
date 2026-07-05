import threading
import time
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int, max_entries: int = 512):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._lock = threading.Lock()
        self._data: dict[str, tuple[float, T]] = {}

    def get(self, key: str) -> T | None:
        now = time.time()
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None

            expires_at, value = entry
            if expires_at <= now:
                self._data.pop(key, None)
                return None
            return value

    def set(self, key: str, value: T) -> T:
        expires_at = time.time() + self.ttl_seconds
        with self._lock:
            self._data[key] = (expires_at, value)
            self._prune_locked()
        return value

    def get_or_set(self, key: str, factory: Callable[[], T]) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached

        value = factory()
        return self.set(key, value)

    def status(self) -> dict[str, int]:
        now = time.time()
        with self._lock:
            expired = [key for key, (expires_at, _) in self._data.items() if expires_at <= now]
            for key in expired:
                self._data.pop(key, None)
            return {
                "entries": len(self._data),
                "ttl_seconds": self.ttl_seconds,
                "max_entries": self.max_entries,
            }

    def _prune_locked(self) -> None:
        now = time.time()
        expired = [key for key, (expires_at, _) in self._data.items() if expires_at <= now]
        for key in expired:
            self._data.pop(key, None)

        overflow = len(self._data) - self.max_entries
        if overflow <= 0:
            return

        oldest = sorted(self._data.items(), key=lambda item: item[1][0])[:overflow]
        for key, _ in oldest:
            self._data.pop(key, None)
