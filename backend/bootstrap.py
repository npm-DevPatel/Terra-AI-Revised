import threading
import time

from spatial.groundwater import groundwater_status, warm_groundwater_data

_STATE_LOCK = threading.Lock()
_STATE = {
    "started": False,
    "completed": False,
    "started_at": None,
    "completed_at": None,
    "last_error": None,
}


def _set_state(**updates):
    with _STATE_LOCK:
        _STATE.update(updates)


def warmup_status() -> dict:
    with _STATE_LOCK:
        snapshot = dict(_STATE)

    components = {
        "groundwater": groundwater_status(),
    }
    ready = all(component.get("ready", False) for component in components.values())
    snapshot["components"] = components
    snapshot["ready"] = ready
    return snapshot


def _run_warmup() -> None:
    try:
        warm_groundwater_data()
    except Exception as exc:
        _set_state(last_error=str(exc))
    finally:
        _set_state(completed=True, completed_at=time.time())


def start_background_warmup(wait: bool = False) -> None:
    with _STATE_LOCK:
        if _STATE["started"]:
            return
        _STATE.update(started=True, completed=False, started_at=time.time(), completed_at=None, last_error=None)

    if wait:
        _run_warmup()
        return

    thread = threading.Thread(target=_run_warmup, name="terra-warmup", daemon=True)
    thread.start()
