import time
from datetime import datetime
from zoneinfo import ZoneInfo

import joblib
import numpy as np
import pandas as pd
import requests


# ============================================================
# FILES AND CONFIGURATION
# ============================================================

MODEL_PATH = "foodwise_improved_model.pkl"
RECIPIENTS_FILE = "recipients.csv"

# Free public Valhalla demo server using OpenStreetMap road data.
VALHALLA_MATRIX_URL = (
    "https://valhalla1.openstreetmap.de/sources_to_targets"
)

APP_TIMEZONE = ZoneInfo("Asia/Kolkata")

NGO_MAX_DISTANCE_KM = 15.0

# Operational buffers
HANDLING_BUFFER_MIN = 15
SAFETY_BUFFER_MIN = 30

TOP_N = 5

# Public server: keep requests modest.
VALHALLA_BATCH_SIZE = 40
REQUEST_DELAY_SECONDS = 1.1


# ============================================================
# MODEL FEATURES
# Must exactly match foodrecommendation_improved.py
# ============================================================

MODEL_FEATURES = [
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


# ============================================================
# INPUT HELPERS
# ============================================================

def normalize_food_type(value):
    value = str(value).strip().lower()

    if value in {
        "veg",
        "vegetarian",
    }:
        return "Veg"

    if value in {
        "nonveg",
        "non-veg",
        "non veg",
        "nonvegetarian",
        "non-vegetarian",
    }:
        return "Non-Veg"

    raise ValueError(
        "Food type must be Veg or Non-Veg."
    )


def validate_lat_lon(
    latitude,
    longitude,
    label,
):
    latitude = float(latitude)
    longitude = float(longitude)

    if not -90 <= latitude <= 90:
        raise ValueError(
            f"{label} latitude is invalid."
        )

    if not -180 <= longitude <= 180:
        raise ValueError(
            f"{label} longitude is invalid."
        )

    return latitude, longitude


# ============================================================
# OPENSTREETMAP / VALHALLA ROUTING
# ============================================================

def get_valhalla_matrix(
    institution_latitude,
    institution_longitude,
    recipients,
):
    """
    Calculates actual road-route distance and estimated
    driving time from one institution to all recipients.

    Returns:
    {
        recipient_id: {
            "distance_km": float,
            "travel_time_min": int
        }
    }
    """

    (
        institution_latitude,
        institution_longitude,
    ) = validate_lat_lon(
        institution_latitude,
        institution_longitude,
        "Institution",
    )

    routes = {}

    for start_index in range(
        0,
        len(recipients),
        VALHALLA_BATCH_SIZE,
    ):

        batch = (
            recipients.iloc[
                start_index:
                start_index + VALHALLA_BATCH_SIZE
            ]
            .reset_index(drop=True)
        )

        targets = []

        for _, recipient in batch.iterrows():

            recipient_latitude, recipient_longitude = (
                validate_lat_lon(
                    recipient[
                        "recipient_latitude"
                    ],
                    recipient[
                        "recipient_longitude"
                    ],
                    str(
                        recipient[
                            "recipient_id"
                        ]
                    ),
                )
            )

            targets.append({
                "lat":
                    recipient_latitude,

                "lon":
                    recipient_longitude,
            })


        payload = {
            "sources": [
                {
                    "lat":
                        institution_latitude,

                    "lon":
                        institution_longitude,
                }
            ],

            "targets":
                targets,

            "costing":
                "auto",

            "units":
                "kilometers",
        }


        headers = {
            "Content-Type":
                "application/json",

            "User-Agent":
                "FoodWiseAI-College-Prototype/1.0",
        }


        try:

            response = requests.post(
                VALHALLA_MATRIX_URL,
                json=payload,
                headers=headers,
                timeout=35,
            )


            # Retry once if rate-limited.
            if response.status_code == 429:

                print(
                    "Valhalla rate limit reached. "
                    "Retrying..."
                )

                time.sleep(2.0)

                response = requests.post(
                    VALHALLA_MATRIX_URL,
                    json=payload,
                    headers=headers,
                    timeout=35,
                )


            response.raise_for_status()


        except requests.RequestException as error:

            raise RuntimeError(
                "\nCould not retrieve route distance "
                "from Valhalla.\n"
                f"{error}"
            ) from error


        data = response.json()

        matrix = data.get(
            "sources_to_targets",
            [],
        )


        if not matrix:
            continue


        route_row = matrix[0]


        for index, route in enumerate(
            route_row
        ):

            if index >= len(batch):
                break


            recipient_id = str(
                batch.iloc[index][
                    "recipient_id"
                ]
            )


            distance = route.get(
                "distance"
            )

            travel_seconds = route.get(
                "time"
            )


            # Unreachable destination
            if (
                distance is None
                or travel_seconds is None
            ):
                continue


            routes[recipient_id] = {

                "distance_km":
                    round(
                        float(distance),
                        2,
                    ),

                "travel_time_min":
                    int(
                        np.ceil(
                            float(
                                travel_seconds
                            ) / 60.0
                        )
                    ),
            }


        if (
            start_index
            + VALHALLA_BATCH_SIZE
            < len(recipients)
        ):
            time.sleep(
                REQUEST_DELAY_SECONDS
            )


    return routes


# ============================================================
# EXPIRY CHECK
# ============================================================

def calculate_remaining_time(
    expiry_date,
    expiry_time,
):
    """
    User enters expiry date and expiry time.
    Current date/time is obtained automatically.
    """

    expiry_datetime = datetime.strptime(
        f"{expiry_date} {expiry_time}",
        "%Y-%m-%d %H:%M",
    ).replace(
        tzinfo=APP_TIMEZONE
    )


    current_datetime = datetime.now(
        APP_TIMEZONE
    )


    remaining_minutes = (
        expiry_datetime
        - current_datetime
    ).total_seconds() / 60.0


    return remaining_minutes


# ============================================================
# HARD ELIGIBILITY RULES
# ============================================================

def check_hard_rules(
    food,
    recipient,
    remaining_time_min,
):

    food_quantity = float(
        food["food_quantity"]
    )

    capacity = float(
        recipient[
            "recipient_capacity"
        ]
    )

    distance = float(
        recipient[
            "distance_km"
        ]
    )

    travel_time = float(
        recipient[
            "travel_time_min"
        ]
    )

    recipient_type = str(
        recipient[
            "recipient_type"
        ]
    ).strip().upper()


    # --------------------------------------------------------
    # VEG / NON-VEG
    # --------------------------------------------------------

    if food[
        "veg_nonveg"
    ] == "Veg":

        if int(
            recipient[
                "accepts_veg"
            ]
        ) != 1:

            return (
                False,
                "Recipient does not accept Veg food",
            )

    else:

        if int(
            recipient[
                "accepts_nonveg"
            ]
        ) != 1:

            return (
                False,
                "Recipient does not accept Non-Veg food",
            )


    # --------------------------------------------------------
    # CAPACITY
    # --------------------------------------------------------

    if food_quantity > capacity:

        return (
            False,
            "Food quantity exceeds recipient capacity",
        )


    # --------------------------------------------------------
    # PICKUP
    # --------------------------------------------------------

    if int(
        recipient[
            "pickup_available"
        ]
    ) != 1:

        return (
            False,
            "Pickup not available",
        )


    # --------------------------------------------------------
    # FOOD BANK RULES
    # --------------------------------------------------------

    if recipient_type == "FOOD_BANK":

        minimum_food = float(
            recipient[
                "min_food_required"
            ]
        )

        maximum_distance = float(
            recipient[
                "max_distance_km"
            ]
        )


        if food_quantity < minimum_food:

            return (
                False,
                "Below Food Bank minimum food requirement",
            )


        if distance > maximum_distance:

            return (
                False,
                "Food Bank maximum distance exceeded",
            )


    # --------------------------------------------------------
    # NGO RULE
    # --------------------------------------------------------

    elif recipient_type == "NGO":

        if distance > NGO_MAX_DISTANCE_KM:

            return (
                False,
                "NGO is outside 15 km service radius",
            )


    else:

        return (
            False,
            "Unsupported recipient type",
        )


    # --------------------------------------------------------
    # EXPIRY FEASIBILITY
    # --------------------------------------------------------

    required_minutes = (
        travel_time
        + HANDLING_BUFFER_MIN
        + SAFETY_BUFFER_MIN
    )


    if remaining_time_min <= 0:

        return (
            False,
            "Food expiry time has already passed",
        )


    if (
        remaining_time_min
        <= required_minutes
    ):

        return (
            False,
            "Not enough time to deliver before expiry",
        )


    return (
        True,
        "Eligible",
    )


# ============================================================
# FEATURE ENGINEERING FOR TRAINED MODEL
# ============================================================

def build_model_features(
    food,
    recipient,
):

    food_quantity = float(
        food[
            "food_quantity"
        ]
    )

    capacity = float(
        recipient[
            "recipient_capacity"
        ]
    )

    distance = float(
        recipient[
            "distance_km"
        ]
    )

    travel_time = float(
        recipient[
            "travel_time_min"
        ]
    )

    recipient_type = str(
        recipient[
            "recipient_type"
        ]
    ).strip().upper()


    # Veg / Non-Veg compatibility
    if food[
        "veg_nonveg"
    ] == "Veg":

        food_type_match = int(
            recipient[
                "accepts_veg"
            ]
        )

    else:

        food_type_match = int(
            recipient[
                "accepts_nonveg"
            ]
        )


    capacity_ok = int(
        food_quantity <= capacity
    )


    quantity_ratio = (
        food_quantity / capacity
        if capacity > 0
        else 999.0
    )


    if recipient_type == "FOOD_BANK":

        minimum_quantity_ok = int(
            food_quantity
            >= float(
                recipient[
                    "min_food_required"
                ]
            )
        )

        distance_ok = int(
            distance
            <= float(
                recipient[
                    "max_distance_km"
                ]
            )
        )

    else:

        minimum_quantity_ok = 1

        distance_ok = int(
            distance
            <= NGO_MAX_DISTANCE_KM
        )


    capacity_remaining = (
        capacity
        - food_quantity
    )


    travel_efficiency = (
        travel_time
        / max(
            distance,
            0.5,
        )
    )


    basic_eligible = int(
        food_type_match == 1
        and capacity_ok == 1
        and minimum_quantity_ok == 1
        and distance_ok == 1
        and int(
            recipient[
                "pickup_available"
            ]
        ) == 1
    )


    return {

        "veg_nonveg":
            food[
                "veg_nonveg"
            ],

        "recipient_type":
            recipient_type,

        "food_quantity":
            food_quantity,

        "recipient_capacity":
            capacity,

        "pickup_available":
            int(
                recipient[
                    "pickup_available"
                ]
            ),

        "min_food_required":
            float(
                recipient[
                    "min_food_required"
                ]
            ),

        "max_distance_km":
            float(
                recipient[
                    "max_distance_km"
                ]
            ),

        "distance_km":
            distance,

        "travel_time_min":
            travel_time,

        "food_type_match":
            food_type_match,

        "capacity_ok":
            capacity_ok,

        "quantity_ratio":
            quantity_ratio,

        "minimum_quantity_ok":
            minimum_quantity_ok,

        "distance_ok":
            distance_ok,

        "capacity_remaining":
            capacity_remaining,

        "travel_efficiency":
            travel_efficiency,

        "basic_eligible":
            basic_eligible,
    }


# ============================================================
# LOAD RECIPIENT DATABASE
# ============================================================

def load_recipients():

    recipients = pd.read_csv(
        RECIPIENTS_FILE
    )


    required_columns = [
        "recipient_id",
        "recipient_type",
        "recipient_latitude",
        "recipient_longitude",
        "recipient_capacity",
        "accepts_veg",
        "accepts_nonveg",
        "pickup_available",
        "min_food_required",
        "max_distance_km",
    ]


    missing_columns = [
        column
        for column in required_columns
        if column
        not in recipients.columns
    ]


    if missing_columns:

        raise ValueError(
            "recipients.csv is missing columns: "
            + ", ".join(
                missing_columns
            )
        )


    return recipients


# ============================================================
# FINAL RECOMMENDATION ENGINE
# ============================================================

def recommend_recipients(
    food,
    institution_latitude,
    institution_longitude,
    recipients,
    top_n=TOP_N,
):

    model = joblib.load(
        MODEL_PATH
    )


    remaining_time_min = (
        calculate_remaining_time(
            food[
                "expiry_date"
            ],
            food[
                "expiry_time"
            ],
        )
    )


    print(
        "\nRemaining time before expiry:",
        round(
            remaining_time_min,
            1,
        ),
        "minutes",
    )


    if remaining_time_min <= 0:

        print(
            "\nFood has already expired."
        )

        return [], []


    print(
        "\nCalculating road routes using "
        "OpenStreetMap / Valhalla..."
    )


    routes = get_valhalla_matrix(
        institution_latitude,
        institution_longitude,
        recipients,
    )


    recommendations = []
    rejected = []


    for _, row in recipients.iterrows():

        recipient = row.to_dict()

        recipient_id = str(
            recipient[
                "recipient_id"
            ]
        )


        if recipient_id not in routes:

            rejected.append({
                "recipient_id":
                    recipient_id,

                "reason":
                    "No road route found",
            })

            continue


        recipient.update(
            routes[
                recipient_id
            ]
        )


        eligible, reason = (
            check_hard_rules(
                food,
                recipient,
                remaining_time_min,
            )
        )


        if not eligible:

            rejected.append({
                "recipient_id":
                    recipient_id,

                "recipient_type":
                    recipient[
                        "recipient_type"
                    ],

                "distance_km":
                    recipient[
                        "distance_km"
                    ],

                "travel_time_min":
                    recipient[
                        "travel_time_min"
                    ],

                "reason":
                    reason,
            })

            continue


        feature_row = (
            build_model_features(
                food,
                recipient,
            )
        )


        model_input = pd.DataFrame(
            [feature_row],
            columns=MODEL_FEATURES,
        )


        probability = float(
            model.predict_proba(
                model_input
            )[0][1]
        )


        recommendations.append({

            "recipient_id":
                recipient_id,

            "recipient_type":
                recipient[
                    "recipient_type"
                ],

            "distance_km":
                recipient[
                    "distance_km"
                ],

            "travel_time_min":
                recipient[
                    "travel_time_min"
                ],

            "remaining_time_min":
                round(
                    remaining_time_min,
                    1,
                ),

            "match_probability":
                round(
                    probability * 100,
                    2,
                ),
        })


    recommendations.sort(
        key=lambda item:
            item[
                "match_probability"
            ],
        reverse=True,
    )


    return (
        recommendations[
            :top_n
        ],
        rejected,
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print(
        "\n======================================"
    )

    print(
        "       FOODWISE AI RECOMMENDER"
    )

    print(
        " OpenStreetMap + Valhalla + Random Forest"
    )

    print(
        "======================================"
    )


    recipients = load_recipients()


    dish_name = input(
        "\nDish name: "
    ).strip()


    veg_nonveg = normalize_food_type(
        input(
            "Veg / Non-Veg: "
        )
    )


    food_quantity = float(
        input(
            "Food quantity (servings): "
        )
    )


    expiry_date = input(
        "Expiry date (YYYY-MM-DD): "
    ).strip()


    expiry_time = input(
        "Expiry time (HH:MM, 24-hour): "
    ).strip()


    institution_latitude = float(
        input(
            "Institution latitude: "
        )
    )


    institution_longitude = float(
        input(
            "Institution longitude: "
        )
    )


    food = {

        "dish_name":
            dish_name,

        "veg_nonveg":
            veg_nonveg,

        "food_quantity":
            food_quantity,

        "expiry_date":
            expiry_date,

        "expiry_time":
            expiry_time,
    }


    recommendations, rejected = (
        recommend_recipients(
            food,
            institution_latitude,
            institution_longitude,
            recipients,
        )
    )


    print(
        "\n======================================"
    )

    print(
        "       TOP RECOMMENDATIONS"
    )

    print(
        "======================================"
    )


    if not recommendations:

        print(
            "\nNo suitable NGO / Food Bank found."
        )

        print(
            "Use the appropriate waste / biogas "
            "route if safe redistribution is "
            "not possible."
        )

    else:

        for rank, result in enumerate(
            recommendations,
            start=1,
        ):

            print(
                f"\n{rank}. "
                f"{result['recipient_id']}"
            )

            print(
                "   Type:",
                result[
                    "recipient_type"
                ]
            )

            print(
                "   Road distance:",
                result[
                    "distance_km"
                ],
                "km"
            )

            print(
                "   Estimated driving time:",
                result[
                    "travel_time_min"
                ],
                "min"
            )

            print(
                "   Remaining expiry time:",
                result[
                    "remaining_time_min"
                ],
                "min"
            )

            print(
                "   Match probability:",
                result[
                    "match_probability"
                ],
                "%"
            )


    print(
        "\n======================================"
    )

    print(
        "       REJECTED RECIPIENTS"
    )

    print(
        "======================================"
    )


    if not rejected:

        print(
            "\nNone"
        )

    else:

        for item in rejected:

            print(
                "\n",
                item[
                    "recipient_id"
                ],
                "->",
                item[
                    "reason"
                ],
            )
