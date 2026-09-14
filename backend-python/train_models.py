import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

print("Loading dataset...")
df = pd.read_csv("training_data.csv")

print(f"Dataset loaded with {len(df)} rows.")

# Split the dataset into training and testing sets to evaluate accuracy
X_train, X_test, y_sent_train, y_sent_test, y_asp_train, y_asp_test = train_test_split(
    df['text'], df['sentiment'], df['aspect'], test_size=0.2, random_state=42
)

# 1. Train Sentiment Model
print("\n--- Training Sentiment Analysis Model ---")
sentiment_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 3))),
    ('clf', LogisticRegression(C=10.0, random_state=42, multi_class='multinomial', max_iter=1000))
])
sentiment_pipeline.fit(X_train, y_sent_train)

# Evaluate Sentiment Model
sent_preds = sentiment_pipeline.predict(X_test)
sent_acc = accuracy_score(y_sent_test, sent_preds)
print(f"Sentiment Model Accuracy: {sent_acc * 100:.2f}%")
print("Sentiment Classification Report:")
print(classification_report(y_sent_test, sent_preds))

# 2. Train Aspect/Category Model
print("\n--- Training Topic Detection Model ---")
aspect_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 3))),
    ('clf', LogisticRegression(C=10.0, random_state=42, multi_class='multinomial', max_iter=1000))
])
aspect_pipeline.fit(X_train, y_asp_train)

# Evaluate Aspect Model
asp_preds = aspect_pipeline.predict(X_test)
asp_acc = accuracy_score(y_asp_test, asp_preds)
print(f"Aspect Model Accuracy: {asp_acc * 100:.2f}%")
print("Aspect Classification Report:")
print(classification_report(y_asp_test, asp_preds))

# Ensure models directory exists
os.makedirs('models', exist_ok=True)

# 3. Export Models
joblib.dump(sentiment_pipeline, 'models/sentiment_model.pkl')
joblib.dump(aspect_pipeline, 'models/aspect_model.pkl')

print("\nModels successfully trained and saved to the 'models' directory.")
