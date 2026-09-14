from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import numpy as np

app = FastAPI(
    title="Pulse Feedback Intelligence API",
    description="Machine Learning service for sentiment analysis and topic detection.",
    version="2.0.0"
)

# Load models at startup
SENTIMENT_MODEL_PATH = "models/sentiment_model.pkl"
ASPECT_MODEL_PATH = "models/aspect_model.pkl"

sentiment_model = None
aspect_model = None

@app.on_event("startup")
def load_models():
    global sentiment_model, aspect_model
    if os.path.exists(SENTIMENT_MODEL_PATH):
        sentiment_model = joblib.load(SENTIMENT_MODEL_PATH)
    if os.path.exists(ASPECT_MODEL_PATH):
        aspect_model = joblib.load(ASPECT_MODEL_PATH)
    print("Models loaded successfully.")

class FeedbackRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    sentiment: str
    confidence: float
    severity: float
    aspect: str

def calculate_severity(sentiment: str, confidence: float) -> float:
    """
    Severity is a derived metric. 
    If sentiment is Negative, severity is proportional to confidence.
    Otherwise, severity is 0.
    """
    if sentiment == "Negative":
        return float(np.round(confidence, 3))
    return 0.0

@app.post("/predict", response_model=PredictionResponse)
def predict(request: FeedbackRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    if not sentiment_model or not aspect_model:
        raise HTTPException(status_code=503, detail="Models not loaded. Please run train_models.py first.")

    text = [request.text]

    # Predict Sentiment
    sentiment_pred = sentiment_model.predict(text)[0]
    sentiment_probs = sentiment_model.predict_proba(text)[0]
    confidence = float(np.max(sentiment_probs))

    # Predict Aspect (Topic Detection)
    aspect_pred = aspect_model.predict(text)[0]

    severity = calculate_severity(sentiment_pred, confidence)

    return PredictionResponse(
        sentiment=sentiment_pred,
        confidence=round(confidence, 3),
        severity=severity,
        aspect=aspect_pred
    )

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "FastAPI ML service is running", "models_loaded": bool(sentiment_model and aspect_model)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)