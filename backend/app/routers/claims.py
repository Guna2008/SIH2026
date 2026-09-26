import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Claim, FoodListing, User
from ..schemas import ClaimCreate, ClaimResponse, ClaimVerify
from ..time_utils import meal_type_for

router = APIRouter(prefix="/claims", tags=["Claims"])


def response_for_claim(claim: Claim):
    food = claim.food_listing
    kitchen = food.kitchen
    return ClaimResponse(
        id=claim.id,
        food_listing_id=claim.food_listing_id,
        claimant_id=claim.claimant_id,
        quantity=claim.quantity,
        status=claim.status,
        pin=claim.pin,
        created_at=claim.created_at,
        verified_at=claim.verified_at,
        kitchen_name=kitchen.name,
        kitchen_latitude=food.provider_latitude if food.provider_latitude is not None else kitchen.latitude,
        kitchen_longitude=food.provider_longitude if food.provider_longitude is not None else kitchen.longitude,
        food_title=food.title,
        meal_type=food.meal_type,
        claimant_name=claim.claimant.name if claim.claimant else None,
        claimant_role=claim.claimant.role if claim.claimant else None,
        provider_latitude=food.provider_latitude if food.provider_latitude is not None else kitchen.latitude,
        provider_longitude=food.provider_longitude if food.provider_longitude is not None else kitchen.longitude,
    )


@router.post("", response_model=ClaimResponse, status_code=201)
def create_claim(
    data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("NGO", "ORPHANAGE", "FOOD_BANK", "INDIVIDUAL", "BIOGAS_PLANT")),
):
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Your organization must be approved before claiming food")

    meal = meal_type_for()

    food = db.query(FoodListing).filter(FoodListing.id == data.food_listing_id).with_for_update().first()
    if not food:
        raise HTTPException(status_code=404, detail="Food listing not found")
    if food.status != "AVAILABLE" or food.remaining_quantity <= 0:
        raise HTTPException(status_code=400, detail="Food is no longer available")
    if food.kitchen_id == current_user.id:
        raise HTTPException(status_code=403, detail="You cannot claim your own surplus listing")
    from ..time_utils import check_meal_window, now_local
    is_ngo_eligible, is_biogas_eligible, status_desc = check_meal_window(food.meal_type, food.created_at)
    now_utc = datetime.utcnow()
    now_loc = now_local().replace(tzinfo=None)
    expired = bool(food.expiry_date and food.expiry_date <= now_utc)

    if current_user.role in {"NGO", "ORPHANAGE"}:
        # 1. Food bank claim check: if a food bank claimed this meal, NGOs/orphanages cannot claim it
        fb_claim = db.query(Claim).join(User, Claim.claimant_id == User.id)\
            .filter(Claim.food_listing_id == food.id, User.role == "FOOD_BANK")\
            .first()
        if fb_claim:
            raise HTTPException(
                status_code=400,
                detail="This meal has already been claimed by a food bank and is not available."
            )

        # 2. 30-minute food bank priority window check
        if food.created_at:
            if food.created_at > now_utc:
                age_ok = now_loc >= food.created_at + timedelta(minutes=30)
            else:
                age_ok = now_utc >= food.created_at + timedelta(minutes=30)
        else:
            age_ok = True
        if not age_ok:
            raise HTTPException(
                status_code=400,
                detail="This meal is currently reserved in the 30-minute food-bank priority window."
            )

        # 3. Capacity + 15 buffer enforcement for this meal window
        capacity = current_user.capacity or 0
        if capacity > 0:
            max_allowed = capacity + 15
            # Calculate existing claims by this organization for this meal window today
            from sqlalchemy import func
            today_start = datetime.combine(now_local().date(), datetime.min.time())
            existing_claimed = db.query(func.coalesce(func.sum(Claim.quantity), 0.0))\
                .join(FoodListing, Claim.food_listing_id == FoodListing.id)\
                .filter(
                    Claim.claimant_id == current_user.id,
                    Claim.status.in_(["CLAIMED", "COMPLETED"]),
                    FoodListing.meal_type == food.meal_type,
                    Claim.created_at >= today_start
                ).scalar() or 0.0

            remaining_allowance = max(0.0, float(max_allowed) - float(existing_claimed))
            if data.quantity > remaining_allowance:
                if existing_claimed > 0:
                    msg = (
                        f"You cannot claim this much. Your capacity is {capacity} meals with an extra 15 meals buffer "
                        f"(maximum {max_allowed} meals for {food.meal_type.lower()}). You have already claimed "
                        f"{existing_claimed:g} meals today, so you can claim at most {remaining_allowance:g} more meals."
                    )
                else:
                    msg = (
                        f"You cannot claim this much. Your capacity is {capacity} meals with an extra 15 meals buffer, "
                        f"so the maximum you can claim for {food.meal_type.lower()} is {max_allowed} meals."
                    )
                raise HTTPException(status_code=400, detail=msg)

        # 4. Strict meal cutoff check
        if not is_ngo_eligible:
            raise HTTPException(
                status_code=400,
                detail=f"Bidding window closed: {status_desc}."
            )

    if current_user.role == "BIOGAS_PLANT":
        if food.condition != "ROTTEN" and not expired and not is_biogas_eligible:
            raise HTTPException(
                status_code=403,
                detail=f"Biogas plants can only claim rotten, expired, or post-cutoff surplus ({status_desc})"
            )
    elif food.condition != "GOOD":
        raise HTTPException(status_code=403, detail="Food marked rotten is restricted to biogas plants")

    if data.quantity > food.remaining_quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available quantity")

    from .marketplace import distance_km
    p_lat = food.provider_latitude if food.provider_latitude is not None else (food.kitchen.latitude if food.kitchen else None)
    p_lon = food.provider_longitude if food.provider_longitude is not None else (food.kitchen.longitude if food.kitchen else None)
    dist = distance_km(current_user.latitude, current_user.longitude, p_lat, p_lon)

    if dist is not None:
        if current_user.role in {"NGO", "ORPHANAGE"}:
            radius = min(float(current_user.max_distance_km), 30.0) if current_user.max_distance_km else 30.0
            if dist > radius:
                raise HTTPException(status_code=403, detail=f"This food is {dist} km away, exceeding your {radius} km radius")
        elif current_user.role == "FOOD_BANK":
            radius = float(current_user.max_distance_km) if current_user.max_distance_km else 50.0
            if dist > radius:
                raise HTTPException(status_code=403, detail=f"This listing is {dist} km away, exceeding your collection radius")
        elif current_user.max_distance_km and dist > float(current_user.max_distance_km):
            raise HTTPException(status_code=403, detail=f"This food is outside your registered collection distance ({dist} km)")

    pin = f"{secrets.randbelow(10000):04d}"
    claim = Claim(
        food_listing_id=food.id,
        claimant_id=current_user.id,
        quantity=data.quantity,
        status="CLAIMED",
        pin=pin,
    )
    food.remaining_quantity -= data.quantity
    if food.remaining_quantity <= 0:
        food.remaining_quantity = 0
        food.status = "CLAIMED"

    db.add(claim)
    db.commit()
    db.refresh(claim)
    return response_for_claim(claim)


@router.get("", response_model=list[ClaimResponse])
def list_claims(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "ADMIN":
        rows = db.query(Claim).order_by(Claim.created_at.desc()).all()
    elif current_user.role == "KITCHEN":
        rows = db.query(Claim).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(
            FoodListing.kitchen_id == current_user.id
        ).order_by(Claim.created_at.desc()).all()
    else:
        rows = db.query(Claim).filter(Claim.claimant_id == current_user.id).order_by(Claim.created_at.desc()).all()
    return [response_for_claim(c) for c in rows]


@router.post("/{claim_id}/verify", response_model=ClaimResponse)
def verify_claim(
    claim_id: int,
    data: ClaimVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("KITCHEN", "INDIVIDUAL", "FOOD_BANK", "NGO", "ORPHANAGE")),
):
    claim = db.query(Claim).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(
        Claim.id == claim_id,
        FoodListing.kitchen_id == current_user.id,
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found for this kitchen")
    if claim.status == "COMPLETED":
        return response_for_claim(claim)
    if claim.pin != data.pin:
        raise HTTPException(status_code=400, detail="Incorrect collection PIN")

    claim.status = "COMPLETED"
    claim.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(claim)
    return response_for_claim(claim)
