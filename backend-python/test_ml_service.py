import unittest
import numpy as np
import joblib
import os
from pydantic import BaseModel
from fastapi.testclient import TestClient

# Import the FastAPI app
import sys
sys.path.insert(0, os.path.dirname(__file__))
from app import app, calculate_severity

class TestPulseMLService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertTrue(data.get("models_loaded", False))

    def test_positive_feedback(self):
        text = "Absolutely love this service! The team was super helpful and amazing."
        response = self.client.post("/predict", json={"text": text})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["sentiment"], ["Positive", "Neutral", "Negative"])
        self.assertGreater(data["confidence"], 0.0)
        self.assertLessEqual(data["confidence"], 1.0)
        self.assertIn("aspect", data)
        self.assertEqual(data["severity"], 0.0) # Non-negative should have 0 severity

    def test_negative_feedback(self):
        text = "The product is broken, awful build quality and terrible experience."
        response = self.client.post("/predict", json={"text": text})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sentiment"], "Negative")
        self.assertGreater(data["confidence"], 0.0)
        self.assertGreater(data["severity"], 0.0) # Negative should have severity > 0
        self.assertEqual(data["severity"], data["confidence"])

    def test_neutral_feedback(self):
        text = "The delivery arrived on average time, nothing special."
        response = self.client.post("/predict", json={"text": text})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["sentiment"], ["Positive", "Neutral", "Negative"])
        self.assertIn("aspect", data)

    def test_aspect_detection_categories(self):
        aspect_cases = [
            ("Customer service agent was very polite and helpful.", "Customer Service"),
            ("The delivery was fast, shipping was prompt.", "Delivery"),
            ("The app user interface keeps crashing on the website.", "App/Website"),
            ("The price is too high for the value provided.", "Pricing"),
            ("The build material and product quality are superb.", "Product Quality"),
        ]
        for text, expected_aspect in aspect_cases:
            res = self.client.post("/predict", json={"text": text})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["aspect"], expected_aspect, f"Failed for text: {text}")

    def test_severity_calculation(self):
        self.assertEqual(calculate_severity("Negative", 0.852), 0.852)
        self.assertEqual(calculate_severity("Positive", 0.95), 0.0)
        self.assertEqual(calculate_severity("Neutral", 0.70), 0.0)

    def test_empty_input(self):
        response = self.client.post("/predict", json={"text": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_very_long_input(self):
        long_text = "Good product. " * 500  # ~7000 characters
        response = self.client.post("/predict", json={"text": long_text})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("sentiment", data)
        self.assertIn("confidence", data)

    def test_malformed_input(self):
        # Missing text field
        response = self.client.post("/predict", json={"message": "hello"})
        self.assertEqual(response.status_code, 422) # Unprocessable Entity

if __name__ == "__main__":
    unittest.main()
