import pandas as pd

from config import (
    RAW_DATA_PATH,
    FEATURES,
    TARGET
)


def load_data(path=RAW_DATA_PATH):
    """
    Load the Excel dataset.
    """

    data = pd.read_excel(path)

    return data


def validate_data(data):
    """
    Validate required columns.
    """

    required_columns = FEATURES + [TARGET]

    missing_columns = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing_columns:

        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    return True