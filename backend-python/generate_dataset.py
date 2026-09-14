import pandas as pd
import random

positive_adjectives = [
    "great", "fantastic", "amazing", "excellent", "good", "perfect", "flawless", "superb", "outstanding", "brilliant", "wonderful", 
    "impressive", "stellar", "phenomenal", "awesome", "love", "loved", "immaculate", "exquisite", "magnificent", "splendid", 
    "glorious", "breathtaking", "marvelous", "exceptional", "first-rate", "top-notch", "superlative", "unparalleled", "unbeatable"
]
negative_adjectives = [
    "terrible", "awful", "bad", "horrible", "worst", "poor", "disappointing", "trash", "garbage", "unacceptable", "dreadful", 
    "useless", "broken", "cheap", "hate", "hated", "atrocious", "abysmal", "appalling", "deplorable", "lousy", "pathetic", 
    "subpar", "inferior", "inadequate", "defective", "horrendous", "repulsive", "revolting", "vile", "disgusting", "unbearable"
]
neutral_adjectives = [
    "okay", "ok", "fine", "average", "mediocre", "standard", "acceptable", "decent", "passable", "fair", 
    "undistinguished", "unremarkable", "run-of-the-mill", "middle-of-the-road", "tolerable", "adequate", "so-so", "bland", "lackluster"
]

aspects = {
    "Product Quality": [
        "The product is {adj}.",
        "I found the item to be {adj}.",
        "Quality is {adj}.",
        "The build material is {adj}.",
        "This product is exactly what I expected, absolutely {adj}.",
        "Honestly, the product feels {adj}."
    ],
    "Customer Service": [
        "Customer service was {adj}.",
        "The support team is {adj}.",
        "My experience with the agent was {adj}.",
        "Support replied immediately, {adj} service.",
        "They ignored my emails, {adj} support."
    ],
    "Delivery": [
        "Delivery was {adj}.",
        "Shipping was {adj}.",
        "The package arrived {adj}.",
        "Logistics and shipping speed were {adj}.",
        "It took forever to arrive, {adj} shipping."
    ],
    "Pricing": [
        "The price is {adj}.",
        "Value for money is {adj}.",
        "For the cost, this is {adj}.",
        "Pricing is absolutely {adj}.",
        "It is too expensive, {adj} value."
    ],
    "App/Website": [
        "The app is {adj}.",
        "The website is {adj}.",
        "Navigation is {adj}.",
        "The user interface is {adj}.",
        "App keeps crashing, {adj} experience."
    ]
}

data = []

def generate_samples(adjectives, sentiment):
    for aspect, templates in aspects.items():
        for template in templates:
            for adj in adjectives:
                # Add basic
                data.append({"text": template.format(adj=adj), "sentiment": sentiment, "aspect": aspect})
                # Add lowercase version
                data.append({"text": template.format(adj=adj).lower(), "sentiment": sentiment, "aspect": aspect})
                # Add punctuation variations
                data.append({"text": template.format(adj=adj).replace(".", "!"), "sentiment": sentiment, "aspect": aspect})

generate_samples(positive_adjectives, "Positive")
generate_samples(negative_adjectives, "Negative")
generate_samples(neutral_adjectives, "Neutral")

# Add some specific negations to teach the model context
negations = [
    ("The product is not good at all.", "Negative", "Product Quality"),
    ("Not great.", "Negative", "General"),
    ("Not bad actually.", "Positive", "General"),
    ("I do not like this.", "Negative", "General"),
    ("Never buying this again.", "Negative", "General"),
    ("It is not working.", "Negative", "Product Quality"),
    ("Far from perfect.", "Negative", "General"),
    ("Not worth the money.", "Negative", "Pricing"),
    ("Didn't arrive on time.", "Negative", "Delivery")
]
for text, sent, asp in negations:
    data.append({"text": text, "sentiment": sent, "aspect": asp})

df = pd.DataFrame(data)
df = df.drop_duplicates().sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv("training_data.csv", index=False)
print(f"Generated {len(df)} realistic training samples!")
