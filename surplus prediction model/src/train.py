import sys
from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline


# Allow imports from src
SRC_DIR = Path(__file__).resolve().parent
sys.path.append(str(SRC_DIR))


from config import (
    RAW_DATA_PATH,
    PROCESSED_DATA_PATH,
    MODEL_PATH,
    FEATURES,
    TARGET,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    TEST_SIZE,
    RANDOM_STATE,
    N_ESTIMATORS
)

from data_loader import (
    load_data,
    validate_data
)

from preprocessing import (
    create_preprocessor
)

from utils import (
    create_directories,
    print_section
)


def main():

    # =========================
    # 1. CREATE DIRECTORIES
    # =========================

    create_directories(
        PROCESSED_DATA_PATH.parent,
        MODEL_PATH.parent
    )

    print_section("LOADING DATA")

    # =========================
    # 2. LOAD DATA
    # =========================

    data = load_data()

    print(
        f"Dataset shape: {data.shape}"
    )

    # =========================
    # 3. VALIDATE
    # =========================

    validate_data(data)

    print("Dataset validation passed.")

    # =========================
    # 4. REMOVE UNNECESSARY COLUMNS
    # =========================

    # Date is kept only for reference,
    # not used directly as a feature.

    if "Date" in data.columns:

        data = data.drop(
            columns=["Date"]
        )

    # =========================
    # 5. REMOVE DUPLICATES
    # =========================

    before = len(data)

    data = data.drop_duplicates()

    after = len(data)

    print(
        f"Duplicates removed: {before - after}"
    )

    # =========================
    # 6. HANDLE MISSING VALUES
    # =========================

    print(
        f"Missing values before cleaning:"
    )

    print(
        data.isnull().sum()
    )

    data = data.dropna()

    print(
        f"Rows after cleaning: {len(data)}"
    )

    # =========================
    # 7. SAVE CLEANED DATA
    # =========================

    data.to_csv(
        PROCESSED_DATA_PATH,
        index=False
    )

    print(
        f"Cleaned dataset saved to:"
        f"\n{PROCESSED_DATA_PATH}"
    )

    # =========================
    # 8. FEATURES AND TARGET
    # =========================

    X = data[FEATURES]

    y = data[TARGET]

    print(
        f"\nFeatures:\n{FEATURES}"
    )

    print(
        f"\nTarget: {TARGET}"
    )

    # =========================
    # 9. TRAIN TEST SPLIT
    # =========================

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE
        )
    )

    print(
        f"\nTraining samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    # =========================
    # 10. PREPROCESSOR
    # =========================

    preprocessor = create_preprocessor(
        CATEGORICAL_FEATURES,
        NUMERICAL_FEATURES
    )

    # =========================
    # 11. RANDOM FOREST
    # =========================

    model = RandomForestRegressor(

        n_estimators=N_ESTIMATORS,

        random_state=RANDOM_STATE,

        n_jobs=-1,

        max_features="sqrt"
    )

    # =========================
    # 12. COMPLETE PIPELINE
    # =========================

    pipeline = Pipeline(
        steps=[

            (
                "preprocessor",
                preprocessor
            ),

            (
                "model",
                model
            )
        ]
    )

    # =========================
    # 13. TRAIN
    # =========================

    print_section("TRAINING MODEL")

    pipeline.fit(
        X_train,
        y_train
    )

    print(
        "Random Forest training completed."
    )

    # =========================
    # 14. SAVE MODEL
    # =========================

    joblib.dump(
        pipeline,
        MODEL_PATH
    )

    print(
        f"\nModel saved successfully:"
        f"\n{MODEL_PATH}"
    )

    print_section("TRAINING COMPLETE")


if __name__ == "__main__":
    main()