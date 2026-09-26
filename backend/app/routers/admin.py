from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import (
    Claim,
    FoodListing,
    InventoryItem,
    User,
)
from ..schemas import OrganizationDecision, UserResponse


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


admin_only = require_roles("ADMIN")


@router.get(
    "/organizations",
    response_model=list[UserResponse],
)
def organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    return db.query(User).filter(
        User.role.in_(
            ["NGO", "ORPHANAGE", "KITCHEN", "FOOD_BANK", "INDIVIDUAL", "BIOGAS_PLANT"]
        )
    ).order_by(
        User.created_at.desc()
    ).all()


@router.get(
    "/organizations/{organization_id}",
    response_model=UserResponse,
)
def organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    organization = db.query(User).filter(
        User.id == organization_id,
        User.role != "ADMIN",
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    return organization


@router.post(
    "/organizations/{organization_id}/approve",
)
def approve_organization(
    organization_id: int,
    data: OrganizationDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    organization = db.query(User).filter(
        User.id == organization_id,
        User.role != "ADMIN",
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    organization.is_verified = True

    db.commit()

    return {
        "message": "Organization approved",
        "id": organization.id,
        "reason": data.reason,
    }


@router.post(
    "/organizations/{organization_id}/reject",
)
def reject_organization(
    organization_id: int,
    data: OrganizationDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    organization = db.query(User).filter(
        User.id == organization_id,
        User.role != "ADMIN",
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    organization.is_verified = False

    db.commit()

    return {
        "message": "Organization rejected",
        "id": organization.id,
        "reason": data.reason,
    }


@router.get("/food")
def food(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    rows = db.query(FoodListing).order_by(FoodListing.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "kitchen_id": f.kitchen_id,
            "kitchen_name": f.kitchen.name if f.kitchen else "Unknown",
            "title": f.title,
            "description": f.description,
            "food_type": f.food_type,
            "quantity": f.quantity,
            "remaining_quantity": f.remaining_quantity,
            "unit": f.unit,
            "meal_type": f.meal_type,
            "condition": f.condition or "GOOD",
            "photo_url": f.photo_url,
            "status": f.status,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in rows
    ]


@router.get("/claims")
def claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    rows = db.query(Claim).order_by(Claim.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "food_listing_id": c.food_listing_id,
            "food_title": c.food_listing.title if c.food_listing else "Unknown",
            "kitchen_name": c.food_listing.kitchen.name if c.food_listing and c.food_listing.kitchen else "Unknown",
            "claimant_id": c.claimant_id,
            "claimant_name": c.claimant.name if c.claimant else "Unknown",
            "claimant_role": c.claimant.role if c.claimant else "RECIPIENT",
            "quantity": c.quantity,
            "status": c.status,
            "pin": c.pin,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None,
        }
        for c in rows
    ]


@router.get("/inventory")
def inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    rows = db.query(InventoryItem).order_by(InventoryItem.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "kitchen_id": item.kitchen_id,
            "kitchen_name": item.kitchen.name if item.kitchen else "Kitchen",
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "unit": item.unit,
            "minimum_stock": item.minimum_stock,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in rows
    ]


@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    users = db.query(func.count(User.id)).filter(User.role != "ADMIN").scalar() or 0
    pending = db.query(func.count(User.id)).filter(User.role != "ADMIN", User.is_verified == False).scalar() or 0
    approved = db.query(func.count(User.id)).filter(User.role != "ADMIN", User.is_verified == True).scalar() or 0

    kitchens = db.query(func.count(User.id)).filter(User.role == "KITCHEN").scalar() or 0
    ngos = db.query(func.count(User.id)).filter(User.role == "NGO").scalar() or 0
    orphanages = db.query(func.count(User.id)).filter(User.role == "ORPHANAGE").scalar() or 0
    food_banks = db.query(func.count(User.id)).filter(User.role == "FOOD_BANK").scalar() or 0
    biogas_plants = db.query(func.count(User.id)).filter(User.role == "BIOGAS_PLANT").scalar() or 0
    individuals = db.query(func.count(User.id)).filter(User.role == "INDIVIDUAL").scalar() or 0

    food = db.query(func.count(FoodListing.id)).scalar() or 0
    claims_count = db.query(func.count(Claim.id)).scalar() or 0
    meals_redistributed = db.query(func.coalesce(func.sum(Claim.quantity), 0)).scalar() or 0
    total_food_produced = db.query(func.coalesce(func.sum(FoodListing.quantity), 0)).scalar() or 0

    return {
        "total_organizations": users,
        "pending_verification": pending,
        "approved_organizations": approved,
        "kitchens": kitchens,
        "ngos": ngos,
        "orphanages": orphanages,
        "food_banks": food_banks,
        "biogas_plants": biogas_plants,
        "individuals": individuals,
        "food_listings": food,
        "claims": claims_count,
        "meals_redistributed": float(meals_redistributed),
        "total_food_produced": float(total_food_produced),
        "waste_reduction": f"{round((float(meals_redistributed) / float(total_food_produced) * 100), 1)}%" if total_food_produced > 0 else "0%",
    }


@router.get("/reports")
def reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    users = db.query(User).filter(User.role != "ADMIN").all()
    food_listings = db.query(FoodListing).all()
    all_claims = db.query(Claim).all()

    return {
        "organizations_count": len(users),
        "food_listings_count": len(food_listings),
        "claims_count": len(all_claims),
        "organizations": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "is_verified": u.is_verified,
                "phone": u.phone,
                "address": u.address,
                "capacity": u.capacity,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "food_listings": [
            {
                "id": f.id,
                "title": f.title,
                "kitchen_name": f.kitchen.name if f.kitchen else "Unknown",
                "condition": f.condition,
                "quantity": f.quantity,
                "unit": f.unit,
                "remaining_quantity": f.remaining_quantity,
                "status": f.status,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in food_listings
        ],
        "claims": [
            {
                "id": c.id,
                "food_title": c.food_listing.title if c.food_listing else "Unknown",
                "claimant_name": c.claimant.name if c.claimant else "Unknown",
                "quantity": c.quantity,
                "status": c.status,
                "pin": c.pin,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in all_claims
        ],
    }