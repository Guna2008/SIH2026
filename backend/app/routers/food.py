from math import atan2, cos, radians, sin, sqrt
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import FoodListing, Notification, User
from ..schemas import FoodResponse
from ..time_utils import meal_type_for, now_local

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(tags=["Food"])


def distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    earth_radius = 6371.0
    p1, p2 = radians(lat1), radians(lat2)
    dp = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return round(earth_radius * 2 * atan2(sqrt(a), sqrt(1 - a)), 2)


def build_food_response(food: FoodListing, viewer: User | None = None):
    distance = None
    if viewer:
        p_lat = food.provider_latitude if food.provider_latitude is not None else (food.kitchen.latitude if food.kitchen else None)
        p_lon = food.provider_longitude if food.provider_longitude is not None else (food.kitchen.longitude if food.kitchen else None)
        distance = distance_km(viewer.latitude, viewer.longitude, p_lat, p_lon)
    return FoodResponse(
        id=food.id,
        kitchen_id=food.kitchen_id,
        title=food.title,
        description=food.description,
        food_type=food.food_type,
        quantity=food.quantity,
        remaining_quantity=food.remaining_quantity,
        unit=food.unit,
        meal_type=food.meal_type,
        photo_url=food.photo_url,
        condition=food.condition or "GOOD",
        provider_latitude=food.provider_latitude,
        provider_longitude=food.provider_longitude,
        expiry_date=food.expiry_date,
        pickup_time=food.pickup_time,
        status=food.status,
        created_at=food.created_at,
        kitchen_name=food.kitchen.name if food.kitchen else None,
        distance_km=distance,
        match_score=None,
        match_reason=None,
    )


@router.get("/food", response_model=list[FoodResponse])
def list_food(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in {"NGO", "ORPHANAGE", "FOOD_BANK", "INDIVIDUAL", "BIOGAS_PLANT"}:
        from .marketplace import marketplace_food
        return marketplace_food(db, current_user)
    foods = db.query(FoodListing).filter(FoodListing.status == "AVAILABLE").order_by(FoodListing.created_at.desc()).all()
    return [build_food_response(food, current_user) for food in foods]


@router.get("/food/{food_id}", response_model=FoodResponse)
def get_food(food_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food = db.query(FoodListing).filter(FoodListing.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food listing not found")
    return build_food_response(food, current_user)


@router.post("/kitchen/surplus", response_model=FoodResponse, status_code=201)
async def create_surplus(
    title: str = Form(...),
    description: str | None = Form(None),
    food_type: str | None = Form(None),
    quantity: float = Form(..., gt=0),
    unit: str = Form("servings"),
    pickup_time: str | None = Form(None),
    condition: str = Form("GOOD"),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("KITCHEN")),
):
    condition = (condition or "GOOD").upper()
    if condition not in {"GOOD", "ROTTEN"}:
        raise HTTPException(status_code=400, detail="Condition must be GOOD or ROTTEN")
    meal_type = meal_type_for()
    if not meal_type:
        hour = now_local().hour
        if 4 <= hour < 12:
            meal_type = "BREAKFAST"
        elif 12 <= hour < 16:
            meal_type = "LUNCH"
        else:
            meal_type = "DINNER"

    photo_url = None
    if photo and photo.filename:
        if not photo.content_type or not photo.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="A food photo is required")

        suffix = Path(photo.filename or "food.jpg").suffix.lower() or ".jpg"
        filename = f"{uuid4().hex}{suffix}"
        destination = UPLOAD_DIR / filename
        data = await photo.read()
        if len(data) > 8 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Food photo must be 8 MB or smaller")
        destination.write_bytes(data)
        photo_url = f"/uploads/{filename}"

    food = FoodListing(
        kitchen_id=current_user.id,
        title=title,
        description=description,
        food_type=food_type or "ANY",
        quantity=quantity,
        remaining_quantity=quantity,
        meal_type=meal_type,
        photo_url=photo_url,
        condition=condition,
        provider_latitude=current_user.latitude,
        provider_longitude=current_user.longitude,
        unit=unit,
        pickup_time=pickup_time,
        status="AVAILABLE",
    )
    db.add(food)
    db.flush()

    if condition == "GOOD":
        food_banks = db.query(User).filter(User.role == "FOOD_BANK", User.is_verified == True, User.is_active == True).all()
        for bank in food_banks:
            km = distance_km(bank.latitude, bank.longitude, current_user.latitude, current_user.longitude)
            if km is not None and bank.max_distance_km and km > bank.max_distance_km:
                continue
            db.add(Notification(
                user_id=bank.id,
                title="New surplus food available",
                message=f"{title}: {quantity:g} {unit} is available within your food-bank priority window."
            ))
    elif condition == "ROTTEN":
        biogas_plants = db.query(User).filter(User.role == "BIOGAS_PLANT", User.is_verified == True, User.is_active == True).all()
        for plant in biogas_plants:
            km = distance_km(plant.latitude, plant.longitude, current_user.latitude, current_user.longitude)
            if km is not None and plant.max_distance_km and km > plant.max_distance_km:
                continue
            db.add(Notification(
                user_id=plant.id,
                title="New organic waste available",
                message=f"{title}: {quantity:g} {unit} of organic waste is available for biogas collection."
            ))

    db.commit()
    db.refresh(food)
    return build_food_response(food, current_user)
