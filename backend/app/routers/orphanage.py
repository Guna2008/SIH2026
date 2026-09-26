from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Claim, FoodListing, Requirement, User
from ..schemas import (
    FoodResponse,
    ProfileUpdate,
    RequirementCreate,
    RequirementResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/orphanage",
    tags=["Orphanage"],
)


orphanage_only = require_roles("ORPHANAGE")


@router.get(
    "/food",
    response_model=list[FoodResponse],
)
def available_food(
    db: Session = Depends(get_db),
    current_user: User = Depends(orphanage_only),
):
    from ..routers.marketplace import marketplace_food
    return marketplace_food(db, current_user)


@router.get("/claims")
def claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(orphanage_only),
):
    from ..routers.claims import response_for_claim
    rows = db.query(Claim).filter(
        Claim.claimant_id == current_user.id
    ).order_by(
        Claim.created_at.desc()
    ).all()
    return [response_for_claim(c) for c in rows]



@router.get(
    "/requirements",
    response_model=list[RequirementResponse],
)
def requirements(
    db: Session = Depends(get_db),
    current_user: User = Depends(orphanage_only),
):
    return db.query(Requirement).filter(
        Requirement.organization_id == current_user.id
    ).order_by(
        Requirement.created_at.desc()
    ).all()


@router.post(
    "/requirements",
    response_model=RequirementResponse,
    status_code=201,
)
def create_requirement(
    data: RequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(orphanage_only),
):
    requirement = Requirement(
        organization_id=current_user.id,
        **data.model_dump(),
    )

    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return requirement


@router.get(
    "/profile",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(orphanage_only),
):
    return current_user


@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(orphanage_only),
):
    for key, value in data.model_dump(
        exclude_unset=True
    ).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return current_user