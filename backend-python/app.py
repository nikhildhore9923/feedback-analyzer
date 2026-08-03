from flask import Flask, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os

app = Flask(__name__)
analyzer = SentimentIntensityAnalyzer()

# VADER's built-in lexicon is tuned for general social media text (tweets, comments)
# and under-weights some words that are extremely common - and extremely telling -
# in product reviews specifically. This custom lexicon corrects for that gap.
# Scores follow VADER's own -4 to +4 convention before we normalize.
DOMAIN_LEXICON = {
    "defective": -3.0,
    "faulty": -3.0,
    "malfunctioning": -3.0,
    "broken": -2.8,
    "useless": -2.5,
    "waste": -2.3,
    "refund": -1.5,
    "scam": -3.5,
    "durable": 2.0,
    "reliable": 2.0,
    "flawless": 3.0,
    "seamless": 2.2,
}

def classify_sentiment(text):
    """
    VADER (Valence Aware Dictionary and sEntiment Reasoner) is tuned specifically
    for short, informal text - reviews, tweets, comments - which is exactly what
    customer feedback looks like. Unlike TextBlob, it correctly handles:
      - negation ("not good" scores negative, not neutral)
      - intensifiers ("very bad" scores more negative than "bad")

    We then layer in DOMAIN_LEXICON: VADER's general lexicon still misses some
    product-review-specific words (e.g. "defective"), so we feed those words into
    VADER's own lexicon dictionary before scoring - this is the officially
    supported way to extend VADER, not a hack.

    polarity_scores() returns a dict with neg/neu/pos/compound.
    'compound' is a single normalized score from -1 to +1 - the one we use.
    """
    scores = analyzer.polarity_scores(text)
    polarity = scores["compound"]

    if polarity > 0.05:
        sentiment = "Positive"
    elif polarity < -0.05:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return sentiment, polarity


# Register the domain words directly into VADER's lexicon at startup,
# so they're considered alongside VADER's ~7,500 built-in words on every call.
analyzer.lexicon.update(DOMAIN_LEXICON)


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