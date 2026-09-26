
from __future__ import annotations

import base64
from datetime import datetime
from io import BytesIO
import re

import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from rapidocr_onnxruntime import RapidOCR
    _RAPID_OCR = RapidOCR()
except Exception:
    _RAPID_OCR = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

from ..database import settings

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}

DATE_PATTERNS = [
    # 1. Month name patterns: e.g. 25-NOV-2026, 25 NOV 26, NOV 2026, 15 OCT 2027
    re.compile(r"\b(?:(\d{1,2})[-/\s.])?([A-Za-z]{3,9})[-/\s.](20\d{2}|\d{2})\b", re.I),
    # 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b"),
    # 3. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    re.compile(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b"),
    # 4. DD-MM-YY or DD/MM/YY
    re.compile(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b"),
    # 5. MM/YYYY or MM-YYYY
    re.compile(r"\b(\d{1,2})[-/.](20\d{2})\b"),
]


def _parse_date(text: str) -> tuple[datetime | None, float]:
    text_clean = text.replace("\n", " ").strip()

    # 1. Month name: e.g. 25 NOV 2026
    m1 = DATE_PATTERNS[0].search(text_clean)
    if m1:
        d_str, mon_str, y_str = m1.groups()
        mon = MONTHS.get(mon_str.lower()) or MONTHS.get(mon_str[:3].lower())
        if mon:
            y = int(y_str)
            if y < 100:
                y += 2000
            d = int(d_str) if d_str else 1
            if 2024 <= y <= 2045:
                try:
                    return datetime(y, mon, d), 0.95
                except ValueError:
                    pass

    # 2. YYYY-MM-DD
    m2 = DATE_PATTERNS[1].search(text_clean)
    if m2:
        y, m, d = map(int, m2.groups())
        if 2024 <= y <= 2045 and 1 <= m <= 12 and 1 <= d <= 31:
            try:
                return datetime(y, m, d), 0.93
            except ValueError:
                pass

    # 3. DD-MM-YYYY
    m3 = DATE_PATTERNS[2].search(text_clean)
    if m3:
        p1, p2, y = map(int, m3.groups())
        if 2024 <= y <= 2045:
            # Determine if p1 is day and p2 is month, or vice-versa
            if 1 <= p2 <= 12 and 1 <= p1 <= 31:
                try:
                    return datetime(y, p2, p1), 0.90
                except ValueError:
                    pass
            elif 1 <= p1 <= 12 and 1 <= p2 <= 31:
                try:
                    return datetime(y, p1, p2), 0.85
                except ValueError:
                    pass

    # 4. DD-MM-YY (2-digit year)
    m4 = DATE_PATTERNS[3].search(text_clean)
    if m4:
        p1, p2, yy = map(int, m4.groups())
        y = 2000 + yy
        if 2024 <= y <= 2045:
            if 1 <= p2 <= 12 and 1 <= p1 <= 31:
                try:
                    return datetime(y, p2, p1), 0.85
                except ValueError:
                    pass

    # 5. MM/YYYY
    m5 = DATE_PATTERNS[4].search(text_clean)
    if m5:
        m, y = map(int, m5.groups())
        if 2024 <= y <= 2045 and 1 <= m <= 12:
            try:
                return datetime(y, m, 1), 0.80
            except ValueError:
                pass

    return None, 0.0


def scan_expiry(raw: bytes) -> tuple[str, datetime | None, float, str | None]:
    """
    Takes raw image bytes (JPEG, PNG, WebP) from camera capture or upload,
    applies OpenCV preprocessing, runs OCR, and extracts the expiry date.

    Returns:
        (extracted_text, expiry_datetime, confidence_score, date_str_iso)
    """
    if not raw:
        raise ValueError("No image data provided for scanning")

    # Decode image using OpenCV
    cv_image = None
    if cv2 is not None:
        np_arr = np.frombuffer(raw, np.uint8)
        cv_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if cv_image is None:
        try:
            pil_img = Image.open(BytesIO(raw)).convert("RGB")
            cv_image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR) if cv2 is not None else None
        except Exception as exc:
            raise ValueError("The captured image could not be decoded") from exc

    recognized_lines = []

    # Stage 1: Try RapidOCR directly on the camera frame
    if _RAPID_OCR is not None and cv_image is not None:
        try:
            res, _ = _RAPID_OCR(cv_image)
            if res:
                for item in res:
                    recognized_lines.append(item[1])
        except Exception:
            pass

    full_text = "\n".join(recognized_lines)
    parsed_date, conf = _parse_date(full_text)
    if parsed_date:
        date_str = parsed_date.strftime("%Y-%m-%d")
        return full_text, parsed_date, conf, date_str

    # Stage 2: OpenCV Preprocessing variants if first pass didn't detect an expiry date
    if cv_image is not None and cv2 is not None:
        # Convert to Grayscale
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

        # CLAHE (Contrast Limited Adaptive Histogram Equalization) for varied camera lighting
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        contrast = clahe.apply(gray)

        # Gaussian blur + Otsu thresholding
        blur = cv2.GaussianBlur(contrast, (3, 3), 0)
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Morphological closing to bridge broken inkjet/dot-matrix printed dates
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        dilated = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        variants = [contrast, thresh, dilated]

        for variant in variants:
            # Try RapidOCR on preprocessed variant
            if _RAPID_OCR is not None:
                try:
                    res, _ = _RAPID_OCR(variant)
                    if res:
                        variant_lines = [item[1] for item in res]
                        variant_text = "\n".join(variant_lines)
                        dt, c = _parse_date(variant_text)
                        if dt:
                            all_text = f"{full_text}\n{variant_text}".strip()
                            return all_text, dt, max(conf, c), dt.strftime("%Y-%m-%d")
                        recognized_lines.extend(variant_lines)
                except Exception:
                    pass

            # Try PyTesseract fallback if available
            if pytesseract is not None:
                try:
                    if settings.OCR_TESSERACT_CMD:
                        pytesseract.pytesseract.tesseract_cmd = settings.OCR_TESSERACT_CMD
                    tess_text = pytesseract.image_to_string(variant, config="--psm 6")
                    if tess_text:
                        dt, c = _parse_date(tess_text)
                        if dt:
                            all_text = f"{full_text}\n{tess_text}".strip()
                            return all_text, dt, max(conf, c), dt.strftime("%Y-%m-%d")
                        recognized_lines.append(tess_text)
                except Exception:
                    pass

    # Fallback to combined text analysis
    combined_text = "\n".join(dict.fromkeys(recognized_lines))
    final_date, final_conf = _parse_date(combined_text)
    date_str = final_date.strftime("%Y-%m-%d") if final_date else None
    return combined_text, final_date, final_conf, date_str
