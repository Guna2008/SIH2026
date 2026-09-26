from pathlib import Path


# =========================
# PROJECT DIRECTORIES
# =========================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

MODEL_DIR = BASE_DIR / "models"


# =========================
# FILE PATHS
# =========================

RAW_DATA_PATH = (
    RAW_DATA_DIR / "food_consumption_dataset.xlsx"
)

PROCESSED_DATA_PATH = (
    PROCESSED_DATA_DIR / "food_consumption_cleaned.csv"
)

MODEL_PATH = (
    MODEL_DIR / "food_consumer_model.pkl"
)


# =========================
# TARGET
# =========================

TARGET = "Persons_Consumed"


# =========================
# FEATURES
# =========================

CATEGORICAL_FEATURES = [
    "Day_of_Week",
    "Meal_Type",
    "Dish",
    "Special_Day"
]

NUMERICAL_FEATURES = [
    "Total_Students",
    "Students_on_Leave"
]

FEATURES = (
    CATEGORICAL_FEATURES +
    NUMERICAL_FEATURES
)


# =========================
# MODEL SETTINGS
# =========================

TEST_SIZE = 0.20

RANDOM_STATE = 42

N_ESTIMATORS = 300