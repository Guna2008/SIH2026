from sqlalchemy import inspect, text
from .database import engine


COLUMNS = {
    "users": {
        "latitude": "DOUBLE PRECISION",
        "longitude": "DOUBLE PRECISION",
        "max_distance_km": "DOUBLE PRECISION",
        "food_preferences": "VARCHAR(30)",
    },
    "food_listings": {
        "remaining_quantity": "DOUBLE PRECISION",
        "meal_type": "VARCHAR(20)",
        "photo_url": "TEXT",
        "condition": "VARCHAR(20) DEFAULT 'GOOD'",
        "provider_latitude": "DOUBLE PRECISION",
        "provider_longitude": "DOUBLE PRECISION",
    },
    "claims": {
        "pin": "VARCHAR(4)",
        "verified_at": "TIMESTAMP NULL",
    },
}


def ensure_columns():
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns.items():
                if name not in existing:
                    conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {sql_type}'))
        if inspector.has_table("food_listings"):
            conn.execute(text("UPDATE food_listings SET remaining_quantity = quantity WHERE remaining_quantity IS NULL"))
            conn.execute(text("UPDATE food_listings SET meal_type = 'UNKNOWN' WHERE meal_type IS NULL"))
        if inspector.has_table("claims"):
            conn.execute(text("UPDATE claims SET pin = '0000' WHERE pin IS NULL"))
