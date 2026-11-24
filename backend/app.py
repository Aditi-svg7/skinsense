from pydantic import BaseModel
from analyzer import analyze_ingredients
import io
import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
import pytesseract

# Tesseract configuration
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )



app = FastAPI(
    title="SkinSense API",
    description="AI-powered skincare ingredient analyzer",
    version="0.2.0"
)


# Allow our React development server to communicate with Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to SkinSense API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "SkinSense"
    }



@app.post("/api/ocr")
async def extract_ingredients(file: UploadFile = File(...)):

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 10 MB."
        )

    try:
        # Step 1: Decode the uploaded image
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid or unreadable image."
            )

        # Step 2: Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Step 3: Enlarge image for better character recognition
        height, width = gray.shape

        if width < 2500:
            scale = 2500 / width
            gray = cv2.resize(
                gray,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

        # Step 4: Improve contrast
        gray = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8)
        ).apply(gray)

        # Step 5: Adaptive thresholding
        processed = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            41,
            11
        )

        # Step 6: OCR with explicit page segmentation mode
        extracted_text = pytesseract.image_to_string(
            processed,
            lang="eng",
            config="--oem 3 --psm 6"
        )

        extracted_text = extracted_text.strip()

        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail="No readable text found. Try another photograph."
            )

        return {
            "filename": file.filename,
            "extracted_text": extracted_text,
            "status": "success"
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(error)}"
        )

# Request structure for ingredient analysis
class AnalysisRequest(BaseModel):
    extracted_text: str
    skin_type: str
    concerns: list[str] = []


@app.post("/api/analyze")
def analyze_product(request: AnalysisRequest):

    allowed_skin_types = {
        "dry",
        "oily",
        "combination",
        "normal",
        "sensitive"
    }

    skin_type = request.skin_type.lower().strip()

    if skin_type not in allowed_skin_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid skin type."
        )

    if not request.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Ingredient text cannot be empty."
        )

    result = analyze_ingredients(
        text=request.extracted_text,
        skin_type=skin_type,
        concerns=request.concerns
    )

    return result
