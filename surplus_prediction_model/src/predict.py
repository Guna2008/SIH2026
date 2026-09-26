import sys
from pathlib import Path

import pandas as pd
import joblib


SRC_DIR = Path(__file__).resolve().parent
sys.path.append(str(SRC_DIR))


from config import MODEL_PATH


def predict_consumers(
    day,
    meal_type,
    dish,
    special_day,
    total_students,
    students_on_leave
):

    # =========================
    # LOAD MODEL
    # =========================

    model = joblib.load(
        MODEL_PATH
    )

    # =========================
    # CREATE INPUT
    # =========================

    input_data = pd.DataFrame([
        {
            "Day_of_Week": day,

            "Meal_Type": meal_type,

            "Dish": dish,

            "Special_Day": special_day,

            "Total_Students": total_students,

            "Students_on_Leave": students_on_leave
        }
    ])

    # =========================
    # PREDICT
    # =========================

    prediction = model.predict(
        input_data
    )

    consumers = round(
        prediction[0]
    )

    # Prevent impossible values
    consumers = max(
        0,
        min(
            consumers,
            total_students - students_on_leave
        )
    )

    return consumers


def main():

    predicted_consumers = predict_consumers(

        day="Friday",

        meal_type="Lunch",

        dish="Chicken Biryani",

        special_day="No",

        total_students=1000,

        students_on_leave=30
    )

    print(
        f"Predicted Consumers: "
        f"{predicted_consumers}"
    )


if __name__ == "__main__":
    main()