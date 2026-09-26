from datetime import datetime, timedelta
from math import atan2, cos, radians, sin, sqrt
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import FoodListing, User, Claim, Notification
from ..schemas import FoodResponse

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RECIPIENT_ROLES = {"NGO", "ORPHANAGE", "FOOD_BANK", "INDIVIDUAL"}
PROVIDER_ROLES = {"KITCHEN", "INDIVIDUAL", "NGO", "ORPHANAGE"}

def distance_km(a_lat, a_lon, b_lat, b_lon):
    if None in (a_lat, a_lon, b_lat, b_lon):
        return None
    p1, p2 = radians(a_lat), radians(b_lat)
    dp, dl = radians(b_lat-a_lat), radians(b_lon-a_lon)
    x = sin(dp/2)**2 + cos(p1)*cos(p2)*sin(dl/2)**2
    return round(6371*2*atan2(sqrt(x), sqrt(1-x)), 2)

@router.post("/surplus", response_model=FoodResponse, status_code=201)
async def post_surplus(
    title: str = Form(...),
    description: str | None = Form(None),
    food_type: str = Form("ANY"),
    quantity: float = Form(..., gt=0),
    unit: str = Form("portions"),
    condition: str = Form("GOOD"),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in PROVIDER_ROLES:
        raise HTTPException(403, "This account cannot publish surplus food")
    condition = condition.upper()
    if condition not in {"GOOD", "ROTTEN"}:
        raise HTTPException(400, "Condition must be GOOD or ROTTEN")
    if condition == "ROTTEN" and user.role not in {"KITCHEN", "INDIVIDUAL", "NGO", "ORPHANAGE"}:
        raise HTTPException(403, "Only food providers can publish waste listings")
    photo_url = None
    if photo and photo.filename:
        if not photo.content_type or not photo.content_type.startswith("image/"):
            raise HTTPException(400, "Upload an image file")
        raw = await photo.read()
        if len(raw) > 8*1024*1024:
            raise HTTPException(400, "Image must be 8 MB or smaller")
        suffix = Path(photo.filename).suffix.lower() or ".jpg"
        name = f"{uuid4().hex}{suffix}"
        (UPLOAD_DIR/name).write_bytes(raw)
        photo_url = f"/uploads/{name}"
    listing = FoodListing(
        kitchen_id=user.id, title=title, description=description, food_type=food_type,
        quantity=quantity, remaining_quantity=quantity, unit=unit,
        meal_type="ANY", photo_url=photo_url, condition=condition,
        provider_latitude=user.latitude, provider_longitude=user.longitude,
        status="AVAILABLE",
    )
    db.add(listing)
    db.flush()
    if condition == "GOOD":
        food_banks = db.query(User).filter(User.role == "FOOD_BANK", User.is_verified == True, User.is_active == True).all()
        for bank in food_banks:
            km = distance_km(bank.latitude, bank.longitude, user.latitude, user.longitude)
            if km is None or not bank.max_distance_km or km > bank.max_distance_km:
                continue
            pref = (bank.food_preferences or "ANY").upper()
            if pref not in {"ANY", "ALL", ""} and food_type.upper() not in {pref, "ANY", "ALL"}:
                continue
            db.add(Notification(user_id=bank.id, title="New surplus food available", message=f"{title}: {quantity:g} {unit} is available within your food-bank priority window."))
    db.commit()
    db.refresh(listing)
    dist=distance_km(user.latitude,user.longitude,user.latitude,user.longitude)
    return FoodResponse(
        id=listing.id,kitchen_id=user.id,title=listing.title,description=listing.description,
        food_type=listing.food_type,quantity=listing.quantity,remaining_quantity=listing.remaining_quantity,
        unit=listing.unit,meal_type=listing.meal_type,photo_url=listing.photo_url,
        condition=listing.condition,provider_latitude=listing.provider_latitude,
        provider_longitude=listing.provider_longitude,expiry_date=listing.expiry_date,
        pickup_time=listing.pickup_time,status=listing.status,created_at=listing.created_at,
        kitchen_name=user.name,distance_km=dist
    )

@router.get("/food", response_model=list[FoodResponse])
def marketplace_food(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in RECIPIENT_ROLES and user.role != "BIOGAS_PLANT":
        raise HTTPException(403, "This account cannot receive marketplace listings")

    from ..time_utils import check_meal_window, now_local
    from ..services.prediction_service import match_food

    now_utc = datetime.utcnow()
    now_loc = now_local().replace(tzinfo=None)
    rows = db.query(FoodListing).filter(
        FoodListing.status == "AVAILABLE",
        FoodListing.remaining_quantity > 0,
    ).order_by(FoodListing.created_at.desc()).all()

    candidates = []
    for f in rows:
        if f.kitchen_id == user.id:
            continue
        cond = (f.condition or "GOOD").upper()
        expired = bool(f.expiry_date and f.expiry_date <= now_utc)
        if f.created_at:
            if f.created_at > now_utc:
                age_ok = now_loc >= f.created_at + timedelta(minutes=30)
            else:
                age_ok = now_utc >= f.created_at + timedelta(minutes=30)
        else:
            age_ok = True

        is_ngo_eligible, is_biogas_eligible, status_desc = check_meal_window(f.meal_type, f.created_at)

        # Role-based rule filters
        if user.role == "BIOGAS_PLANT":
            # Biogas receives ROTTEN food, EXPIRED food, OR unclaimed edible food in 2-hr post-cutoff window
            if cond == "ROTTEN" or expired:
                match_reason = "Biogas organic waste collection"
            elif is_biogas_eligible:
                match_reason = f"Unclaimed surplus transferred to Biogas (2-hr window: {status_desc})"
            else:
                # Still within Food Bank or NGO active window, or past 2-hr biogas window
                continue
        elif user.role == "FOOD_BANK":
            if cond != "GOOD" or expired:
                continue
            if not is_ngo_eligible and not is_biogas_eligible:
                continue
            match_reason = "Food bank priority window (Active)" if not age_ok else "Available for collection"
        elif user.role in {"NGO", "ORPHANAGE"}:
            # NGOs and Orphanages:
            # 1. Condition must be GOOD and not expired
            if cond != "GOOD" or expired:
                continue
            # 2. Must wait 30 minutes (food bank priority window)
            if not age_ok:
                continue
            # 3. Must be before meal cutoff (Breakfast: 11am, Lunch: 5pm, Dinner: 10pm)
            if not is_ngo_eligible:
                continue

            # 4. If foodbanks claimed that meal, it will NOT appear to NGOs and orphanages
            fb_claim = db.query(Claim).join(User, Claim.claimant_id == User.id)\
                .filter(Claim.food_listing_id == f.id, User.role == "FOOD_BANK")\
                .first()
            if fb_claim:
                continue

            cap = user.capacity or 0
            cap_limit = (cap + 15) if cap > 0 else 0
            if cap_limit > 0:
                match_reason = f"{status_desc} · Claim limit: up to {cap_limit} portions (Capacity {cap} + 15 buffer)"
            else:
                match_reason = f"{status_desc} · Released after food-bank priority window"
        else:
            # Individual recipient
            if cond != "GOOD" or expired or not age_ok or not is_ngo_eligible:
                continue
            match_reason = "Available for collection"

        # Distance radius filter
        p_lat = f.provider_latitude if f.provider_latitude is not None else (f.kitchen.latitude if f.kitchen else None)
        p_lon = f.provider_longitude if f.provider_longitude is not None else (f.kitchen.longitude if f.kitchen else None)
        dist = distance_km(user.latitude, user.longitude, p_lat, p_lon)

        if dist is not None:
            if user.role == "FOOD_BANK":
                max_radius = float(user.max_distance_km) if user.max_distance_km else 50.0
                if dist > max_radius:
                    continue
            elif user.role in {"NGO", "ORPHANAGE"}:
                max_radius = min(float(user.max_distance_km), 30.0) if user.max_distance_km else 30.0
                if dist > max_radius:
                    continue
            elif user.max_distance_km and dist > float(user.max_distance_km):
                continue

        # Food preference matching
        pref = (user.food_preferences or "ANY").strip().upper()
        ftype = (f.food_type or "ANY").strip().upper()
        if user.role != "BIOGAS_PLANT" and pref not in {"ANY", "ALL", ""}:
            if pref in {"VEG", "VEGETARIAN"} and ("NON" in ftype):
                continue
            if pref in {"NON_VEG", "NON-VEG", "NON_VEGETARIAN"} and ftype in {"VEG", "VEGETARIAN"}:
                continue

        # Notification for NGOs / Orphanages when 30-min window ends
        if user.role in {"NGO", "ORPHANAGE", "INDIVIDUAL"} and age_ok and cond == "GOOD" and is_ngo_eligible:
            notice_key = f"listing #{f.id}"
            existing_notice = db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.title == "Food-bank window ended",
                Notification.message.contains(notice_key),
            ).first()
            if not existing_notice:
                db.add(Notification(
                    user_id=user.id,
                    title="Food-bank window ended",
                    message=f"{notice_key}: {f.title} is now available for eligible recipients."
                ))
                db.commit()

        candidates.append({
            "id": f.id,
            "kitchen_id": f.kitchen_id,
            "title": f.title,
            "description": f.description,
            "food_type": f.food_type,
            "quantity": f.quantity,
            "remaining_quantity": f.remaining_quantity,
            "unit": f.unit,
            "meal_type": f.meal_type,
            "photo_url": f.photo_url,
            "condition": cond,
            "provider_latitude": f.provider_latitude,
            "provider_longitude": f.provider_longitude,
            "expiry_date": f.expiry_date,
            "pickup_time": f.pickup_time,
            "status": f.status,
            "created_at": f.created_at,
            "kitchen_name": f.kitchen.name if f.kitchen else None,
            "distance_km": dist,
            "match_reason": match_reason,
            "match_score": None,
        })

    # For NGOs and Orphanages, score and rank listings using the Recommendation ML model
    if user.role in {"NGO", "ORPHANAGE"} and candidates:
        ngo_features = {
            "recipient_type": user.role,
            "capacity": float(user.capacity or 0),
            "food_preferences": user.food_preferences or "ANY",
            "latitude": user.latitude,
            "longitude": user.longitude,
            "max_distance_km": float(user.max_distance_km or 30.0),
        }
        try:
            ranked = match_food(candidates, ngo_features)
            candidates = ranked
        except Exception:
            pass

    out = []
    for item in candidates:
        score = item.get("match_score")
        reason = item.get("match_reason")
        if score is not None:
            reason = f"{reason} · ML Recommendation: {score}%"

        out.append(FoodResponse(
            id=item["id"],
            kitchen_id=item["kitchen_id"],
            title=item["title"],
            description=item["description"],
            food_type=item["food_type"],
            quantity=item["quantity"],
            remaining_quantity=item["remaining_quantity"],
            unit=item["unit"],
            meal_type=item["meal_type"],
            photo_url=item["photo_url"],
            condition=item["condition"],
            provider_latitude=item["provider_latitude"],
            provider_longitude=item["provider_longitude"],
            expiry_date=item["expiry_date"],
            pickup_time=item["pickup_time"],
            status=item["status"],
            created_at=item["created_at"],
            kitchen_name=item["kitchen_name"],
            distance_km=item["distance_km"],
            match_score=score,
            match_reason=reason,
        ))

    if user.role not in {"NGO", "ORPHANAGE"}:
        out.sort(key=lambda item: (
            item.distance_km is None,
            item.distance_km if item.distance_km is not None else 10**9,
            -item.created_at.timestamp()
        ))
    return out
