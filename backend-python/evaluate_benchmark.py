import os
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def evaluate_on_benchmark(model, df: pd.DataFrame, benchmark_name: str, model_name: str):
    print(f"\n================================================================================")
    print(f"BENCHMARK: {benchmark_name} | MODEL: {model_name}")
    print(f"Total test samples: {len(df)}")
    print(f"Class distribution: {dict(df['sentiment'].value_counts())}")
    print(f"================================================================================")

    preds = model.predict(df['text'])
    acc = accuracy_score(df['sentiment'], preds)
    labels = ['Negative', 'Neutral', 'Positive']
    
    print(f"\nOverall Accuracy: {acc * 100:.2f}% ({acc:.4f})")
    print("\nClassification Report:")
    print(classification_report(df['sentiment'], preds, labels=labels, digits=4))
    
    cm = confusion_matrix(df['sentiment'], preds, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"True_{l}" for l in labels], columns=[f"Pred_{l}" for l in labels])
    print("Confusion Matrix:")
    print(cm_df)
    return acc, classification_report(df['sentiment'], preds, labels=labels, output_dict=True), cm

def main():
    print("=== PULSE SENTIMENT MODEL EVALUATION SUITE ===")
    
    # 1. Resolve paths
    base_dir = ".." if os.path.exists("../misc") else "."
    
    balanced_path = os.path.join(base_dir, "misc", "test_balanced_900.csv")
    stratified_path = os.path.join(base_dir, "misc", "test_natural_stratified.csv")
    
    baseline_model_path = os.path.join(base_dir, "models", "backup_v1_synthetic", "sentiment_model.pkl")
    improved_model_path = os.path.join(base_dir, "models", "sentiment_model.pkl")
    
    # 2. Load test datasets
    df_balanced = pd.read_csv(balanced_path)
    df_stratified = pd.read_csv(stratified_path)
    
    # 3. Load models
    baseline_model = joblib.load(baseline_model_path)
    improved_model = joblib.load(improved_model_path)
    
    # 4. Run evaluations
    print("\n>>> PART A: EVALUATION ON BALANCED UNSEEN BENCHMARK (900 reviews: 300 per class) <<<")
    evaluate_on_benchmark(baseline_model, df_balanced, "Balanced Unseen Benchmark (900 reviews)", "Baseline Model (Synthetic)")
    evaluate_on_benchmark(improved_model, df_balanced, "Balanced Unseen Benchmark (900 reviews)", "Improved Model (Real Feedback)")
    
    print("\n>>> PART B: EVALUATION ON NATURALLY DISTRIBUTED UNSEEN BENCHMARK (1,500 reviews) <<<")
    evaluate_on_benchmark(baseline_model, df_stratified, "Naturally Distributed Benchmark (1,500 reviews)", "Baseline Model (Synthetic)")
    evaluate_on_benchmark(improved_model, df_stratified, "Naturally Distributed Benchmark (1,500 reviews)", "Improved Model (Real Feedback)")

if __name__ == "__main__":
    main()
