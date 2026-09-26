from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Claim, FoodListing, InventoryBatch, InventoryItem, KitchenMealRecord, Production, User
from ..schemas import (
    BatchCreate, BatchResponse, FoodResponse, InventoryCreate, InventoryResponse, InventoryUpdate,
    KitchenMealCreate, KitchenMealResponse, ProductionCreate, ProductionResponse, ProfileUpdate, UserResponse,
    SurplusPredictionRequest, SurplusPredictionResponse, ExpiryScanResponse, ExpiryRecommendation,
)
from ..services.expiry_vision import scan_expiry
from ..services.prediction_service import predict_surplus, expiry_urgency, rank_expiry_batches
from ..routers.food import build_food_response
from ..time_utils import meal_type_for, now_local

router = APIRouter(prefix="/kitchen", tags=["Kitchen"])
kitchen_only = require_roles("KITCHEN")


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    inventory_count = db.query(func.count(InventoryItem.id)).filter(InventoryItem.kitchen_id == current_user.id).scalar() or 0
    active_surplus = db.query(func.count(FoodListing.id)).filter(FoodListing.kitchen_id == current_user.id, FoodListing.status == "AVAILABLE").scalar() or 0
    claims = db.query(func.count(Claim.id)).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0
    production_count = db.query(func.count(Production.id)).filter(Production.kitchen_id == current_user.id).scalar() or 0

    total_surplus_qty = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0
    total_redistributed = db.query(func.coalesce(func.sum(Claim.quantity), 0)).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0
    total_waste = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).filter(FoodListing.kitchen_id == current_user.id, FoodListing.condition == "ROTTEN").scalar() or 0
    total_meals_prepared = db.query(func.coalesce(func.sum(KitchenMealRecord.prepared_quantity), 0)).filter(KitchenMealRecord.kitchen_id == current_user.id).scalar() or 0

    return {
        "inventory_count": inventory_count,
        "active_surplus": active_surplus,
        "claims": claims,
        "production_count": production_count,
        "total_surplus_qty": float(total_surplus_qty),
        "total_redistributed": float(total_redistributed),
        "total_waste": float(total_waste),
        "total_meals_prepared": float(total_meals_prepared),
    }


@router.get("/meals", response_model=list[KitchenMealResponse])
def list_meals(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    return db.query(KitchenMealRecord).filter(KitchenMealRecord.kitchen_id == current_user.id).order_by(KitchenMealRecord.meal_date.desc()).all()


@router.post("/meals", response_model=KitchenMealResponse, status_code=201)
def create_meal(data: KitchenMealCreate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    meal_dt = data.meal_date or now_local()
    meal_type = meal_type_for(meal_dt)
    if not meal_type:
        # Meal records can still be entered for historical/future planning. Use the current active
        # meal if available; otherwise require a date/time that falls in a meal window.
        raise HTTPException(status_code=400, detail="Choose a meal date/time inside breakfast, lunch, or dinner hours")
    staying = data.students_staying if data.students_staying is not None else data.total_students - data.students_on_leave
    if staying < 0 or staying > data.total_students:
        raise HTTPException(status_code=400, detail="Students staying must be between 0 and total students")
    if data.special_day and not data.special_day_name:
        raise HTTPException(status_code=400, detail="Enter the special day name")

    local_dt = meal_dt.astimezone(now_local().tzinfo) if meal_dt.tzinfo else meal_dt
    record = KitchenMealRecord(
        kitchen_id=current_user.id,
        meal_date=local_dt,
        day_of_week=local_dt.strftime("%A"),
        dish=data.dish,
        special_day=data.special_day,
        special_day_name=data.special_day_name,
        meal_type=meal_type,
        total_students=data.total_students,
        students_on_leave=data.students_on_leave,
        students_staying=staying,
        prepared_quantity=data.prepared_quantity,
        surplus_quantity=data.surplus_quantity,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _inventory_response(item):
    batches = [b for b in item.batches if b.expiry_date is not None and b.quantity > 0]
    next_expiry = min((b.expiry_date for b in batches), default=None)
    urgency = None
    if next_expiry is not None:
        urgency, _, _ = expiry_urgency(next_expiry, now_local())
    return InventoryResponse(
        id=item.id, kitchen_id=item.kitchen_id, name=item.name, category=item.category,
        quantity=item.quantity, unit=item.unit, minimum_stock=item.minimum_stock,
        created_at=item.created_at, next_expiry_date=next_expiry, expiry_status=urgency
    )


@router.get("/inventory", response_model=list[InventoryResponse])
def list_inventory(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    items = db.query(InventoryItem).filter(InventoryItem.kitchen_id == current_user.id).order_by(InventoryItem.created_at.desc()).all()
    return [_inventory_response(item) for item in items]


@router.post("/inventory", response_model=InventoryResponse, status_code=201)
def create_inventory(data: InventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    item = InventoryItem(kitchen_id=current_user.id, **data.model_dump())
    db.add(item); db.commit(); db.refresh(item); return _inventory_response(item)


@router.put("/inventory/{item_id}", response_model=InventoryResponse)
def update_inventory(item_id: int, data: InventoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.kitchen_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found")
    for key, value in data.model_dump(exclude_unset=True).items(): setattr(item, key, value)
    db.commit(); db.refresh(item); return _inventory_response(item)


@router.delete("/inventory/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.kitchen_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item); db.commit(); return {"message": "Inventory item deleted", "id": item_id}


@router.get("/inventory/{item_id}/batches", response_model=list[BatchResponse])
def list_batches(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.kitchen_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found")
    return db.query(InventoryBatch).filter(InventoryBatch.inventory_item_id == item_id).order_by(InventoryBatch.expiry_date.asc().nullslast(), InventoryBatch.created_at.desc()).all()


@router.post("/inventory/{item_id}/batches", response_model=BatchResponse, status_code=201)
def add_batch(item_id: int, data: BatchCreate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.kitchen_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found")
    batch = InventoryBatch(inventory_item_id=item_id, quantity=data.quantity, unit=data.unit, expiry_date=data.expiry_date)
    item.quantity += data.quantity
    db.add(batch); db.commit(); db.refresh(batch); return batch


@router.post("/inventory/scan-expiry", response_model=ExpiryScanResponse)
async def scan_inventory_expiry(
    photo: UploadFile = File(None),
    current_user: User = Depends(kitchen_only)
):
    if not photo:
        raise HTTPException(status_code=400, detail="Capture or upload an image of the expiry-date label")
    raw = await photo.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 8 MB or smaller")
    try:
        res = scan_expiry(raw)
        if len(res) == 4:
            text, expiry, confidence, date_str = res
        else:
            text, expiry, confidence = res
            date_str = expiry.strftime("%Y-%m-%d") if expiry else None
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    message = f"Expiry date detected: {date_str}. Auto-filled into form." if expiry else "No expiry date was detected. Align camera closer to printed expiry label."
    return ExpiryScanResponse(extracted_text=text, expiry_date=expiry, date_str=date_str, confidence=confidence, message=message)


@router.get("/inventory/expiry-recommendations", response_model=list[ExpiryRecommendation])
def expiry_recommendations(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    rows = db.query(InventoryBatch).join(InventoryItem).filter(InventoryItem.kitchen_id == current_user.id, InventoryBatch.quantity > 0).all()
    now = now_local()
    prepared = []
    for batch in rows:
        urgency, days, recommendation = expiry_urgency(batch.expiry_date, now)
        prepared.append({
            "batch_id": batch.id, "item_name": batch.inventory_item.name, "quantity": batch.quantity,
            "unit": batch.unit, "expiry_date": batch.expiry_date, "days_to_expiry": days,
            "urgency": urgency, "recommendation": recommendation, "prediction_source": "backend-baseline",
        })
    return rank_expiry_batches(prepared)


@router.post("/predictions/surplus", response_model=SurplusPredictionResponse)
def surplus_prediction(data: SurplusPredictionRequest, current_user: User = Depends(kitchen_only)):
    current_meal = meal_type_for()
    if not current_meal:
        hour = now_local().hour
        if 4 <= hour < 12:
            current_meal = "BREAKFAST"
        elif 12 <= hour < 16:
            current_meal = "LUNCH"
        else:
            current_meal = "DINNER"
    payload = data.model_dump()
    payload["meal_type"] = current_meal
    return predict_surplus(payload)


@router.get("/production", response_model=list[ProductionResponse])
def list_production(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    return db.query(Production).filter(Production.kitchen_id == current_user.id).order_by(Production.production_date.desc()).all()


@router.post("/production", response_model=ProductionResponse, status_code=201)
def record_production(data: ProductionCreate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    production = Production(kitchen_id=current_user.id, item_name=data.item_name, quantity=data.quantity, unit=data.unit, production_date=data.production_date or datetime.utcnow(), notes=data.notes)
    db.add(production); db.commit(); db.refresh(production); return production


@router.get("/surplus", response_model=list[FoodResponse])
def kitchen_surplus(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    foods = db.query(FoodListing).filter(FoodListing.kitchen_id == current_user.id).order_by(FoodListing.created_at.desc()).all()
    return [build_food_response(food, current_user) for food in foods]


@router.get("/donations")
def donations(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    rows = db.query(Claim).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id).order_by(Claim.created_at.desc()).all()
    return [{"id": c.id, "food_title": c.food_listing.title, "claimant_name": c.claimant.name, "claimant_role": c.claimant.role, "claimant_latitude": c.claimant.latitude, "claimant_longitude": c.claimant.longitude, "quantity": c.quantity, "status": c.status, "pin": c.pin, "created_at": c.created_at, "verified_at": c.verified_at} for c in rows]


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    total_food = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0
    total_claimed = db.query(func.coalesce(func.sum(Claim.quantity), 0)).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0
    good_food = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).filter(FoodListing.kitchen_id == current_user.id, FoodListing.condition == "GOOD").scalar() or 0
    rotten_food = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).filter(FoodListing.kitchen_id == current_user.id, FoodListing.condition == "ROTTEN").scalar() or 0
    completed_claims = db.query(func.count(Claim.id)).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id, Claim.status == "COMPLETED").scalar() or 0
    pending_claims = db.query(func.count(Claim.id)).join(FoodListing, Claim.food_listing_id == FoodListing.id).filter(FoodListing.kitchen_id == current_user.id, Claim.status == "CLAIMED").scalar() or 0
    listings_count = db.query(func.count(FoodListing.id)).filter(FoodListing.kitchen_id == current_user.id).scalar() or 0

    return {
        "total_food": float(total_food),
        "total_claimed": float(total_claimed),
        "good_food": float(good_food),
        "rotten_food": float(rotten_food),
        "completed_claims": completed_claims,
        "pending_claims": pending_claims,
        "listings_count": listings_count,
        "redistribution_rate": f"{round((float(total_claimed) / float(total_food) * 100), 1)}%" if total_food > 0 else "0%",
    }


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(kitchen_only)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(kitchen_only)):
    for key, value in data.model_dump(exclude_unset=True).items(): setattr(current_user, key, value)
    db.commit(); db.refresh(current_user); return current_user
