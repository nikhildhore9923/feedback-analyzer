from flask import Flask, request, jsonify
from textblob import TextBlob
import os

app = Flask(__name__)

def classify_sentiment(text):
    """
    TextBlob gives a 'polarity' score from -1 (very negative) to +1 (very positive).
    We turn that number into a human label.
    """
    polarity = TextBlob(text).sentiment.polarity

    if polarity > 0.1:
        sentiment = "Positive"
    elif polarity < -0.1:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return sentiment, polarity


def tag_aspect(text):
    """
    Simple rule-based aspect tagging (Feature 2 from the plan).
    Real NLP projects often start rule-based before upgrading to ML - totally fair
    to say that in an interview.
    """
    text_lower = text.lower()
    if any(word in text_lower for word in ["late", "delivery", "shipping", "arrived", "delayed"]):
        return "Delivery"
    if any(word in text_lower for word in ["price", "expensive", "cheap", "cost", "value"]):
        return "Pricing"
    if any(word in text_lower for word in ["support", "staff", "service", "helpful", "rude"]):
        return "Customer Service"
    if any(word in text_lower for word in ["quality", "broken", "build", "material", "durable"]):
        return "Product Quality"
    return "General"


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    sentiment, polarity = classify_sentiment(text)
    aspect = tag_aspect(text)

    return jsonify({
        "sentiment": sentiment,
        "polarity": round(polarity, 3),
        "aspect": aspect
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Python ML service is running"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
