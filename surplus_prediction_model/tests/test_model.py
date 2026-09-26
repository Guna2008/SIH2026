import sys
from pathlib import Path

import pandas as pd
import joblib


PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

SRC_DIR = PROJECT_ROOT / "src"

sys.path.append(
    str(SRC_DIR)
)


from config import MODEL_PATH


def test_model_exists():

    assert MODEL_PATH.exists(), (
        "Model file does not exist. "
        "Run train.py first."
    )


def test_model_prediction():

    model = joblib.load(
        MODEL_PATH
    )

    test_data = pd.DataFrame([
        {
            "Day_of_Week": "Monday",

            "Meal_Type": "Breakfast",

            "Dish": "Idli",

            "Special_Day": "No",

            "Total_Students": 1000,

            "Students_on_Leave": 40
        }
    ])

    prediction = model.predict(
        test_data
    )

    assert len(prediction) == 1

    assert prediction[0] >= 0

    assert prediction[0] <= 1000

    print(
        f"Test prediction: "
        f"{prediction[0]:.0f}"
    )


if __name__ == "__main__":

    test_model_exists()

    test_model_prediction()

    print(
        "All tests passed!"
    )