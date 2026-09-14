import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import os

# Create a small synthetic dataset tailored for customer feedback
# In a real scenario, you would load this from a CSV (e.g., IMDB or Amazon reviews)
data = {
    "text": [
        "Absolutely love this product, it works flawlessly!",
        "Terrible experience. The item arrived broken and customer service was rude.",
        "It's okay, not great but gets the job done.",
        "Fast shipping and great packaging. Highly recommended.",
        "Waste of money. Do not buy this.",
        "The pricing is a bit high for what it is, but the quality is decent.",
        "I am very disappointed with the delivery time.",
        "Best purchase I've made all year!",
        "The app keeps crashing every time I try to log in.",
        "It's exactly as described.",
        "This product is good.",
        "This product is bad.",
        "I hate this.",
        "I love this so much.",
        "Great quality and affordable.",
        "Awful, just terrible.",
        "It is fine, neither good nor bad.",
        "Amazing customer support!",
        "The delivery was late by a week.",
        "Very expensive for such cheap material.",
        "Fantastic product!",
        "This product is ok.",
        "It's just ok, nothing special.",
        "An absolutely fantastic and excellent experience."
    ],
    "sentiment": [
        "Positive",
        "Negative",
        "Neutral",
        "Positive",
        "Negative",
        "Neutral",
        "Negative",
        "Positive",
        "Negative",
        "Neutral",
        "Positive",
        "Negative",
        "Negative",
        "Positive",
        "Positive",
        "Negative",
        "Neutral",
        "Positive",
        "Negative",
        "Negative",
        "Positive",
        "Neutral",
        "Neutral",
        "Positive"
    ],
    "aspect": [
        "Product Quality",
        "Customer Service",
        "General",
        "Delivery",
        "Pricing",
        "Pricing",
        "Delivery",
        "General",
        "App/Website",
        "General",
        "Product Quality",
        "Product Quality",
        "General",
        "General",
        "Product Quality",
        "General",
        "General",
        "Customer Service",
        "Delivery",
        "Pricing",
        "Product Quality",
        "General",
        "General",
        "General"
    ]
}

df = pd.DataFrame(data)

# 1. Train Sentiment Model
print("Training Sentiment Analysis Model (TF-IDF + Logistic Regression)...")
sentiment_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
    ('clf', LogisticRegression(random_state=42, multi_class='multinomial', max_iter=200))
])
sentiment_pipeline.fit(df['text'], df['sentiment'])

# 2. Train Aspect/Category Model
print("Training Topic Detection Model (TF-IDF + Logistic Regression)...")
aspect_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
    ('clf', LogisticRegression(random_state=42, multi_class='multinomial', max_iter=200))
])
aspect_pipeline.fit(df['text'], df['aspect'])

# Ensure models directory exists
os.makedirs('models', exist_ok=True)

# 3. Export Models
joblib.dump(sentiment_pipeline, 'models/sentiment_model.pkl')
joblib.dump(aspect_pipeline, 'models/aspect_model.pkl')

print("Models successfully trained and saved to the 'models' directory.")
print("Run this script anytime to retrain with new data.")
