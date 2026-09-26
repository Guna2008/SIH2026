import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# FILES
# ============================================================

DATASET_PATH = "FoodWise_Final_Training_Dataset_2500.csv"
MODEL_OUTPUT_PATH = "foodwise_improved_model.pkl"


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATASET_PATH)

print("\nDataset loaded successfully.")
print("Rows:", len(df))


# ============================================================
# FEATURE ENGINEERING
# ============================================================

# 1. Veg / Non-Veg compatibility
df["food_type_match"] = np.where(
    df["veg_nonveg"].eq("Veg"),
    df["accepts_veg"],
    df["accepts_nonveg"],
).astype(int)


# 2. Capacity eligibility
df["capacity_ok"] = (
    df["food_quantity"] <= df["recipient_capacity"]
).astype(int)


# 3. Food quantity relative to available recipient capacity
df["quantity_ratio"] = (
    df["food_quantity"]
    / df["recipient_capacity"].replace(0, np.nan)
).fillna(999.0)


# 4. Food Bank minimum quantity rule
df["minimum_quantity_ok"] = np.where(
    df["recipient_type"].eq("FOOD_BANK"),
    df["food_quantity"] >= df["min_food_required"],
    True,
).astype(int)


# 5. Distance eligibility
df["distance_ok"] = np.where(
    df["recipient_type"].eq("FOOD_BANK"),
    df["distance_km"] <= df["max_distance_km"],
    df["distance_km"] <= 15.0,
).astype(int)


# 6. Capacity left after accepting the food
df["capacity_remaining"] = (
    df["recipient_capacity"] - df["food_quantity"]
)


# 7. Approximate minutes required per road km
df["travel_efficiency"] = (
    df["travel_time_min"]
    / df["distance_km"].clip(lower=0.5)
)


# 8. Combined hard-rule eligibility feature
df["basic_eligible"] = (
    (df["food_type_match"] == 1)
    & (df["capacity_ok"] == 1)
    & (df["minimum_quantity_ok"] == 1)
    & (df["distance_ok"] == 1)
    & (df["pickup_available"] == 1)
).astype(int)


# ============================================================
# MODEL INPUT FEATURES
# ============================================================

FEATURES = [
    "veg_nonveg",
    "recipient_type",
    "food_quantity",
    "recipient_capacity",
    "pickup_available",
    "min_food_required",
    "max_distance_km",
    "distance_km",
    "travel_time_min",
    "food_type_match",
    "capacity_ok",
    "quantity_ratio",
    "minimum_quantity_ok",
    "distance_ok",
    "capacity_remaining",
    "travel_efficiency",
    "basic_eligible",
]

TARGET = "match_success"

CATEGORICAL_FEATURES = [
    "veg_nonveg",
    "recipient_type",
]

NUMERIC_FEATURES = [
    feature
    for feature in FEATURES
    if feature not in CATEGORICAL_FEATURES
]

X = df[FEATURES].copy()
y = df[TARGET].astype(int)


# ============================================================
# PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            CATEGORICAL_FEATURES,
        ),
        (
            "numeric",
            "passthrough",
            NUMERIC_FEATURES,
        ),
    ]
)


# ============================================================
# RANDOM FOREST
# ============================================================

classifier = RandomForestClassifier(
    n_estimators=800,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1,
)


pipeline = Pipeline([
    ("preprocessing", preprocessor),
    ("model", classifier),
])


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


# ============================================================
# TRAIN
# ============================================================

pipeline.fit(
    X_train,
    y_train,
)

print("\nModel trained successfully.")


# ============================================================
# EVALUATE
# ============================================================

probabilities = pipeline.predict_proba(
    X_test
)[:, 1]

# Threshold used only for evaluation.
# Live recommendation ranks eligible recipients by probability.
THRESHOLD = 0.60

predictions = (
    probabilities >= THRESHOLD
).astype(int)


accuracy = accuracy_score(
    y_test,
    predictions,
)

auc = roc_auc_score(
    y_test,
    probabilities,
)


print(
    "\nAccuracy:",
    round(
        accuracy * 100,
        2,
    ),
    "%",
)

print(
    "ROC-AUC:",
    round(
        auc,
        4,
    ),
)

print(
    "\nConfusion Matrix:"
)

print(
    confusion_matrix(
        y_test,
        predictions,
    )
)

print(
    "\nClassification Report:"
)

print(
    classification_report(
        y_test,
        predictions,
        digits=4,
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    pipeline,
    MODEL_OUTPUT_PATH,
)

print(
    "\nModel saved as:",
    MODEL_OUTPUT_PATH,
)
