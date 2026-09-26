from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import (
    LoginRequest,
    ProfileUpdate,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from ..security import (
    create_access_token,
    hash_password,
    verify_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


ALLOWED_ROLES = {
    "NGO",
    "ORPHANAGE",
    "KITCHEN",
    "FOOD_BANK",
    "INDIVIDUAL",
    "BIOGAS_PLANT",
}


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db),
):
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid signup role",
        )

    clean_email = data.email.strip().lower()
    existing_user = db.query(User).filter(
        func.lower(User.email) == clean_email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = User(
        email=clean_email,
        password_hash=hash_password(data.password),
        role=data.role,
        name=data.name,
        phone=data.phone,
        address=data.address,
        capacity=data.capacity,
        notes=data.notes,
        latitude=data.latitude,
        longitude=data.longitude,
        max_distance_km=data.max_distance_km or 30.0,
        food_preferences=data.food_preferences or "ANY",
        organization_type=data.role,
        is_verified=True if data.role == "INDIVIDUAL" else False,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(
        func.lower(User.email) == clean_email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive",
        )

    if user.role == "INDIVIDUAL":
        if data.latitude is not None and data.longitude is not None:
            user.latitude = data.latitude
            user.longitude = data.longitude
            db.commit()

    if user.role != "ADMIN" and user.role != "INDIVIDUAL" and not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Your organization is awaiting admin approval",
        )

    token = create_access_token(
        user.id,
        user.role,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
    }


@router.post(
    "/admin/login",
    response_model=TokenResponse,
)
def admin_login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user or user.role != "ADMIN":
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
        )

    token = create_access_token(
        user.id,
        user.role,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "ADMIN",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.put("/location")
def update_login_location(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "INDIVIDUAL":
        raise HTTPException(status_code=403, detail="Only individual accounts update location at login")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is None or longitude is None:
        raise HTTPException(status_code=422, detail="Latitude and longitude are required")
    if not (-90 <= float(latitude) <= 90 and -180 <= float(longitude) <= 180):
        raise HTTPException(status_code=422, detail="Invalid coordinates")
    current_user.latitude = float(latitude)
    current_user.longitude = float(longitude)
    db.commit()
    return {"message": "Current location updated"}


@router.put("/me", response_model=UserResponse)
def update_me(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user
