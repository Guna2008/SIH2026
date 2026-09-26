from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

try:
    from .database import settings
    APP_TZ = ZoneInfo(settings.APP_TIMEZONE)
except Exception:
    APP_TZ = ZoneInfo("Asia/Kolkata")

MEAL_WINDOWS = {
    "BREAKFAST": (time(5, 0), time(11, 0, 0)),
    "LUNCH": (time(11, 0, 1), time(17, 0, 0)),
    "DINNER": (time(17, 0, 1), time(22, 0, 0)),
}

# Cutoff times for NGOs & Orphanages
NGO_CUTOFFS = {
    "BREAKFAST": time(11, 0, 0),   # 11:00 AM
    "LUNCH": time(17, 0, 0),       # 5:00 PM
    "DINNER": time(22, 0, 0),      # 10:00 PM
}

# Biogas additional 2-hour window after NGO cutoff
BIOGAS_CUTOFFS = {
    "BREAKFAST": time(13, 0, 0),   # 1:00 PM (11:00 AM + 2 hours)
    "LUNCH": time(19, 0, 0),       # 7:00 PM (5:00 PM + 2 hours)
    "DINNER": time(23, 59, 59),    # Midnight (10:00 PM + 2 hours)
}


def now_local() -> datetime:
    return datetime.now(APP_TZ)


def meal_type_for(dt: datetime | None = None) -> str | None:
    value = dt or now_local()
    local = value.astimezone(APP_TZ) if value.tzinfo else value.replace(tzinfo=APP_TZ)
    current = local.time().replace(tzinfo=None)
    for meal, (start, end) in MEAL_WINDOWS.items():
        if start <= current <= end:
            return meal
    return None


def human_meal(meal: str) -> str:
    return meal.title()


def check_meal_window(
    meal_type: str,
    created_at: datetime | None = None,
    dt: datetime | None = None,
) -> tuple[bool, bool, str]:
   
    meal = (meal_type or "ANY").upper()
    now_dt = (dt or now_local()).astimezone(APP_TZ)
    cur_time = now_dt.time()

    ngo_cutoff = NGO_CUTOFFS.get(meal, time(22, 0, 0))
    biogas_cutoff = BIOGAS_CUTOFFS.get(meal, time(23, 59, 59))

    # If created_at is provided, check if it's from a previous calendar day
    if created_at:
        now_utc = datetime.utcnow()
        if created_at.tzinfo is None:
            # Handle naive datetime (UTC from SQLAlchemy or local from direct DB inserts)
            if created_at > now_utc:
                created_local = created_at.replace(tzinfo=APP_TZ)
            else:
                created_local = created_at.replace(tzinfo=ZoneInfo("UTC")).astimezone(APP_TZ)
        else:
            created_local = created_at.astimezone(APP_TZ)

        # Meals from previous dates have completely expired for both humans and biogas
        if created_local.date() < now_dt.date():
            return False, False, f"{meal.title()} from previous day has expired"

    if cur_time < ngo_cutoff:
        # Before NGO cutoff: available for human consumption
        return True, False, f"{meal.title()} window active (closes at {ngo_cutoff.strftime('%I:%M %p')})"
    elif cur_time < biogas_cutoff:
        # After NGO cutoff, but within 2-hour biogas grace window
        return False, True, f"{meal.title()} NGO window closed at {ngo_cutoff.strftime('%I:%M %p')}; routed to Biogas until {biogas_cutoff.strftime('%I:%M %p')}"
    else:
        # Both windows closed
        return False, False, f"{meal.title()} redistribution & biogas grace period expired"
