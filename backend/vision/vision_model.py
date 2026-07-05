import os
import threading
from pathlib import Path
from typing import Optional

from ultralytics import YOLO
from ultralytics.utils import SETTINGS
from ultralytics.utils.downloads import attempt_download_asset

_MODEL: Optional[YOLO] = None
_MODEL_LOCK = threading.Lock()
_RESOLVED_MODEL_PATH: Optional[str] = None


def _get_conf() -> float:
	try:
		return float(os.getenv("TERRA_YOLO_CONF", "0.15"))
	except Exception:
		return 0.15


def _get_imgsz() -> int:
	try:
		return int(os.getenv("TERRA_YOLO_IMGSZ", "640"))
	except Exception:
		return 640


def get_model() -> YOLO:
	"""Lazy-load a YOLO segmentation model and keep it cached in-process."""

	global _MODEL, _RESOLVED_MODEL_PATH
	if _MODEL is not None:
		return _MODEL

	with _MODEL_LOCK:
		if _MODEL is not None:
			return _MODEL

		model_name = os.getenv("TERRA_YOLO_MODEL", "yolov8n-seg.pt")
		resolved_model = _resolve_model_path(model_name)
		_RESOLVED_MODEL_PATH = resolved_model
		_MODEL = YOLO(resolved_model)
	return _MODEL


def warm_model() -> YOLO:
	return get_model()


def vision_model_status() -> dict:
	return {
		"ready": _MODEL is not None,
		"model": os.getenv("TERRA_YOLO_MODEL", "yolov8n-seg.pt"),
		"resolved_model": _RESOLVED_MODEL_PATH,
	}


def _resolve_model_path(model_name: str) -> str:
	if os.path.exists(model_name) and _is_lfs_pointer(model_name):
		fallback_name = os.path.basename(model_name)
		target_path = str(Path(SETTINGS["weights_dir"]) / fallback_name)
		print(
			f"[Terra AI] Local model file '{model_name}' is a Git LFS pointer. "
			f"Resolving '{fallback_name}' into '{target_path}' from Ultralytics assets instead."
		)
		return attempt_download_asset(target_path)

	if not os.path.exists(model_name):
		return attempt_download_asset(model_name)

	return model_name


def _is_lfs_pointer(path: str) -> bool:
	try:
		with open(path, "r", encoding="utf-8") as handle:
			first_line = handle.readline().strip()
		return first_line == "version https://git-lfs.github.com/spec/v1"
	except Exception:
		return False


def predict(rgb_image):
	"""Run segmentation prediction on an RGB numpy array."""

	model = get_model()

	conf = _get_conf()
	imgsz = _get_imgsz()
	device = os.getenv("TERRA_YOLO_DEVICE")  # e.g. 'cpu', '0'

	pred_kwargs = {
		"conf": conf,
		"imgsz": imgsz,
		"retina_masks": True,
		"verbose": False,
	}
	if device:
		pred_kwargs["device"] = device

	results = model.predict(rgb_image, **pred_kwargs)
	return results[0]
