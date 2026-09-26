import sys
from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


SRC_DIR = Path(__file__).resolve().parent
sys.path.append(str(SRC_DIR))


from config import (
    PROCESSED_DATA_PATH,
    MODEL_PATH,
    FEATURES,
    TARGET,
    TEST_SIZE,
    RANDOM_STATE
)

from utils import print_section


def main():

    print_section("MODEL EVALUATION")

    # =========================
    # 1. LOAD DATA
    # =========================

    data = pd.read_csv(
        PROCESSED_DATA_PATH
    )

    X = data[FEATURES]

    y = data[TARGET]

    # =========================
    # 2. SAME TRAIN/TEST SPLIT
    # =========================

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE
        )
    )

    # =========================
    # 3. LOAD MODEL
    # =========================

    model = joblib.load(
        MODEL_PATH
    )

    print(
        "Model loaded successfully."
    )

    # =========================
    # 4. PREDICTIONS
    # =========================

    predictions = model.predict(
        X_test
    )

    # =========================
    # 5. METRICS
    # =========================

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions
    )

    # =========================
    # 6. DISPLAY RESULTS
    # =========================

    print()

    print(
        f"MAE  : {mae:.2f}"
    )

    print(
        f"RMSE : {rmse:.2f}"
    )

    print(
        f"R²   : {r2:.4f}"
    )

    print()

    print(
        f"Average prediction error: "
        f"{mae:.2f} consumers"
    )

    print_section(
        "EVALUATION COMPLETE"
    )


if __name__ == "__main__":
    main()