from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import FoodListing, User
from ..routers.food import build_food_response
from ..schemas import FoodResponse, ProfileUpdate, UserResponse

router = APIRouter(prefix="/ngo", tags=["NGO"])
ngo_only = require_roles("NGO")


@router.get("/food", response_model=list[FoodResponse])
def available_food(db: Session = Depends(get_db), current_user: User = Depends(ngo_only)):
    # Marketplace is the single source of truth for safety, priority-window,
    # radius, and food-preference eligibility. Do not run a second hard filter
    # through the recommendation model here: the model's legacy capacity and
    # routing defaults could silently remove otherwise eligible listings.
    from ..routers.marketplace import marketplace_food
    return marketplace_food(db, current_user)


@router.get("/claims")
def claims(db: Session = Depends(get_db), current_user: User = Depends(ngo_only)):
    from ..models import Claim
    rows = db.query(Claim).filter(Claim.claimant_id == current_user.id).order_by(Claim.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "food_listing_id": c.food_listing_id,
            "claimant_id": c.claimant_id,
            "quantity": c.quantity,
            "status": c.status,
            "pin": c.pin,
            "created_at": c.created_at,
            "verified_at": c.verified_at,
            "kitchen_name": c.food_listing.kitchen.name,
            "kitchen_latitude": c.food_listing.kitchen.latitude,
            "kitchen_longitude": c.food_listing.kitchen.longitude,
            "food_title": c.food_listing.title,
            "meal_type": c.food_listing.meal_type,
        }
        for c in rows
    ]


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(ngo_only)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(ngo_only)):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user
