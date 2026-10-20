import io
import re
import string
import pandas as pd
import requests

DATASET_URL = "https://raw.githubusercontent.com/ruchitgandhi/Twitter-Airline-Sentiment-Analysis/master/Tweets.csv"

def clean_tweet(text: str) -> str:
    # 1. Remove @username handles
    text = re.sub(r"@\w+", "", text)
    # 2. Remove URLs
    text = re.sub(r"https?://\S+", "", text)
    # 3. Collapse extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def normalize_for_overlap(s: str) -> str:
    # Lowercase and strip punctuation and spaces to detect near-duplicates
    return s.lower().translate(str.maketrans("", "", string.punctuation)).replace(" ", "")

def get_words(s: str) -> set:
    return set(re.findall(r"\w+", s.lower()))

def main():
    print("1. Fetching raw Twitter US Airline Sentiment dataset...")
    resp = requests.get(DATASET_URL, timeout=15)
    resp.raise_for_status()
    raw_df = pd.read_csv(io.StringIO(resp.text))
    print(f"   Raw dataset loaded: {len(raw_df)} records.")

    # 2. Clean and map labels
    print("2. Cleaning text and mapping sentiment labels...")
    raw_df["clean_text"] = raw_df["text"].apply(clean_tweet)
    # Filter out empty or trivially short tweets
    df = raw_df[raw_df["clean_text"].str.len() > 10].copy()

    label_map = {
        "negative": "Negative",
        "neutral": "Neutral",
        "positive": "Positive"
    }
    df["sentiment"] = df["airline_sentiment"].map(label_map)
    df = df.dropna(subset=["sentiment"]).copy()

    # Drop exact duplicates within the raw dataset
    initial_count = len(df)
    df = df.drop_duplicates(subset=["clean_text"]).reset_index(drop=True)
    print(f"   Dropped {initial_count - len(df)} duplicate texts. Remaining: {len(df)} records.")

    print("\n   Class distribution of cleaned corpus:")
    print(df["sentiment"].value_counts())

    # 3. Partition Benchmark 1: Balanced Unseen Test Set (900 reviews, 300 per class)
    print("\n3. Creating Benchmark 1: Balanced Unseen Test Set (900 records: 300/class)...")
    balanced_test_indices = df.groupby("sentiment").sample(n=300, random_state=42).index
    balanced_test_df = df.loc[balanced_test_indices].copy()
    remaining_df = df.drop(balanced_test_indices).copy()

    # 4. Partition Benchmark 2: Naturally Distributed Unseen Test Set (1,500 reviews stratified)
    print("4. Creating Benchmark 2: Naturally Distributed Unseen Test Set (1,500 records stratified)...")
    # Natural stratification from remaining data
    stratified_test_indices = remaining_df.groupby("sentiment", group_keys=False).apply(
        lambda x: x.sample(frac=1500 / len(remaining_df), random_state=101)
    ).index[:1500]
    stratified_test_df = remaining_df.loc[stratified_test_indices].copy()
    train_pool_df = remaining_df.drop(stratified_test_indices).copy()

    print(f"   Balanced Test size:    {len(balanced_test_df)}")
    print(f"   Stratified Test size:  {len(stratified_test_df)}")
    print(f"   Candidate Train size:  {len(train_pool_df)}")

    # Verify zero overlap between Benchmark 1 and Benchmark 2
    b1_indices = set(balanced_test_df.index)
    b2_indices = set(stratified_test_df.index)
    tr_indices = set(train_pool_df.index)
    assert len(b1_indices & b2_indices) == 0, "Error: Overlap between Benchmark 1 and Benchmark 2!"
    assert len(b1_indices & tr_indices) == 0, "Error: Overlap between Benchmark 1 and Train!"
    assert len(b2_indices & tr_indices) == 0, "Error: Overlap between Benchmark 2 and Train!"

    # 5. Near-duplicate overlap detection and filtering
    print("\n5. Checking and removing any near-duplicates from the training pool...")
    all_test_texts = pd.concat([balanced_test_df["clean_text"], stratified_test_df["clean_text"]])
    all_test_normalized = set(all_test_texts.apply(normalize_for_overlap))
    all_test_wordsets = [get_words(t) for t in all_test_texts if len(t) > 15]

    # Check normalized text collision
    train_normalized = train_pool_df["clean_text"].apply(normalize_for_overlap)
    collision_mask = train_normalized.isin(all_test_normalized)
    num_norm_collisions = collision_mask.sum()
    print(f"   Found {num_norm_collisions} normalized/punctuation-stripped matches in training pool.")

    # Remove those collisions from training pool to guarantee ZERO near-duplicate leakage
    train_pool_df = train_pool_df[~collision_mask].copy()

    # Check Jaccard word similarity > 0.85
    jaccard_collisions = []
    for idx, row in train_pool_df.iterrows():
        tr_words = get_words(row["clean_text"])
        if len(tr_words) < 4:
            continue
        for te_words in all_test_wordsets:
            jaccard = len(tr_words & te_words) / len(tr_words | te_words)
            if jaccard > 0.85:
                jaccard_collisions.append(idx)
                break

    print(f"   Found {len(jaccard_collisions)} high-Jaccard (>0.85) similar samples in training pool.")
    if jaccard_collisions:
        train_pool_df = train_pool_df.drop(index=jaccard_collisions).copy()

    print(f"   Final sanitized training pool size: {len(train_pool_df)} records.")

    # 6. Save frozen CSVs
    print("\n6. Saving frozen dataset CSVs to disk...")
    # Select clean export columns
    export_cols = ["clean_text", "sentiment"]
    
    balanced_test_df[export_cols].rename(columns={"clean_text": "text"}).to_csv(
        "../misc/test_balanced_900.csv", index=False
    )
    stratified_test_df[export_cols].rename(columns={"clean_text": "text"}).to_csv(
        "../misc/test_natural_stratified.csv", index=False
    )
    train_pool_df[export_cols].rename(columns={"clean_text": "text"}).to_csv(
        "../misc/train_real_sentiment.csv", index=False
    )

    print("   Successfully saved:")
    print("   - misc/test_balanced_900.csv")
    print("   - misc/test_natural_stratified.csv")
    print("   - misc/train_real_sentiment.csv")
    print("\nDone! Dataset preparation complete with 0 near-duplicate leakage.")

if __name__ == "__main__":
    main()
