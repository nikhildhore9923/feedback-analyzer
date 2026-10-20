import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

print("=== PULSE ML MODEL TRAINING PIPELINE ===")

# ==============================================================================
# 1. TRAIN IMPROVED SENTIMENT ANALYSIS MODEL (ON REAL CUSTOMER FEEDBACK)
# ==============================================================================
print("\n--- 1. Training Improved Sentiment Analysis Model ---")
train_sentiment_path = "../misc/train_real_sentiment.csv"
if not os.path.exists(train_sentiment_path):
    train_sentiment_path = "misc/train_real_sentiment.csv"

df_sent = pd.read_csv(train_sentiment_path)
print(f"Loaded real sentiment training set: {len(df_sent)} records.")
print("Class breakdown:")
print(df_sent['sentiment'].value_counts())

sentiment_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.9,
        sublinear_tf=True
    )),
    ('clf', LogisticRegression(
        C=1.0,
        max_iter=1000,
        random_state=42,
        class_weight='balanced'
    ))
])

# 5-Fold Stratified Cross-Validation strictly inside training set
print("\nPerforming 5-Fold Stratified Cross-Validation on training data...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(sentiment_pipeline, df_sent['text'], df_sent['sentiment'], cv=cv, scoring='accuracy')
print(f"5-Fold CV Accuracy: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")

print("Fitting final sentiment pipeline on full training pool...")
sentiment_pipeline.fit(df_sent['text'], df_sent['sentiment'])

# ==============================================================================
# 2. TRAIN ASPECT / CATEGORY MODEL (FOR PULSE TOPIC DETECTION)
# ==============================================================================
print("\n--- 2. Training Aspect / Topic Detection Model ---")
aspect_data_path = "../misc/training_data.csv"
if not os.path.exists(aspect_data_path):
    aspect_data_path = "misc/training_data.csv"

df_asp = pd.read_csv(aspect_data_path)
print(f"Loaded aspect training data: {len(df_asp)} records.")

aspect_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 3))),
    ('clf', LogisticRegression(C=10.0, random_state=42, multi_class='multinomial', max_iter=1000))
])
aspect_pipeline.fit(df_asp['text'], df_asp['aspect'])
print("Aspect model successfully trained.")

# ==============================================================================
# 3. EXPORT SERIALIZED ARTIFACTS
# ==============================================================================
os.makedirs('models', exist_ok=True)
os.makedirs('../models', exist_ok=True)

# Export to backend-python/models/ and root models/
joblib.dump(sentiment_pipeline, 'models/sentiment_model.pkl')
joblib.dump(aspect_pipeline, 'models/aspect_model.pkl')
joblib.dump(sentiment_pipeline, '../models/sentiment_model.pkl')
joblib.dump(aspect_pipeline, '../models/aspect_model.pkl')

print("\nModels successfully exported to 'models/' and '../models/' directories.")
print("Training phase complete.")
