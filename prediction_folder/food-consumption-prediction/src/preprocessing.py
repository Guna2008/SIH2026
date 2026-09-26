from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder


def create_preprocessor(
    categorical_features,
    numerical_features
):
    """
    Create preprocessing pipeline.

    Categorical:
        One-Hot Encoding

    Numerical:
        Passed through unchanged
    """

    preprocessor = ColumnTransformer(
        transformers=[

            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical_features
            ),

            (
                "numerical",
                "passthrough",
                numerical_features
            )
        ]
    )

    return preprocessor