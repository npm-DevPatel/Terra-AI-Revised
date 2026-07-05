import threading

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

_SESSION = None
_LOCK = threading.Lock()


def get_http_session() -> requests.Session:
    global _SESSION
    if _SESSION is not None:
        return _SESSION

    with _LOCK:
        if _SESSION is not None:
            return _SESSION

        session = requests.Session()
        retry = Retry(
            total=2,
            connect=2,
            read=2,
            backoff_factor=0.4,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET", "POST"}),
            raise_on_status=False,
        )
        adapter = HTTPAdapter(pool_connections=32, pool_maxsize=32, max_retries=retry)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        session.headers.update({"Connection": "keep-alive"})
        _SESSION = session
        return _SESSION
