from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignupRequest(BaseModel):
    role: str
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    phone: str | None = None
    address: str | None = None
    capacity: int | None = None
    notes: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    max_distance_km: float | None = Field(default=None, gt=0, le=1000)
    food_preferences: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    name: str
    phone: str | None = None
    address: str | None = None
    capacity: int | None = None
    notes: str | None = None
    organization_type: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    max_distance_km: float | None = None
    food_preferences: str | None = None
    is_verified: bool
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FoodResponse(BaseModel):
    id: int
    kitchen_id: int
    title: str
    description: str | None
    food_type: str | None
    quantity: float
    remaining_quantity: float
    unit: str
    meal_type: str
    photo_url: str | None
    condition: str = 'GOOD'
    provider_latitude: float | None = None
    provider_longitude: float | None = None
    expiry_date: datetime | None
    pickup_time: str | None
    status: str
    created_at: datetime
    kitchen_name: str | None = None
    distance_km: float | None = None
    match_score: float | None = None
    match_reason: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ClaimCreate(BaseModel):
    food_listing_id: int
    quantity: float = Field(gt=0)


class ClaimResponse(BaseModel):
    id: int
    food_listing_id: int
    claimant_id: int
    quantity: float
    status: str
    pin: str
    created_at: datetime
    verified_at: datetime | None = None
    kitchen_name: str | None = None
    kitchen_latitude: float | None = None
    kitchen_longitude: float | None = None
    food_title: str | None = None
    meal_type: str | None = None
    claimant_name: str | None = None
    claimant_role: str | None = None
    provider_latitude: float | None = None
    provider_longitude: float | None = None
    model_config = ConfigDict(from_attributes=True)


class ClaimVerify(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")


class InventoryCreate(BaseModel):
    name: str
    category: str | None = None
    quantity: float = 0
    unit: str = "kg"
    minimum_stock: float = 0


class InventoryUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    quantity: float | None = None
    unit: str | None = None
    minimum_stock: float | None = None


class InventoryResponse(BaseModel):
    id: int
    kitchen_id: int
    name: str
    category: str | None
    quantity: float
    unit: str
    minimum_stock: float
    created_at: datetime
    next_expiry_date: datetime | None = None
    expiry_status: str | None = None
    model_config = ConfigDict(from_attributes=True)


class BatchCreate(BaseModel):
    quantity: float = Field(gt=0)
    unit: str = "kg"
    expiry_date: datetime | None = None


class BatchResponse(BaseModel):
    id: int
    inventory_item_id: int
    quantity: float
    unit: str
    expiry_date: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductionCreate(BaseModel):
    item_name: str
    quantity: float = Field(gt=0)
    unit: str = "servings"
    production_date: datetime | None = None
    notes: str | None = None


class ProductionResponse(BaseModel):
    id: int
    kitchen_id: int
    item_name: str
    quantity: float
    unit: str
    production_date: datetime
    notes: str | None
    model_config = ConfigDict(from_attributes=True)


class KitchenMealCreate(BaseModel):
    dish: str
    meal_date: datetime | None = None
    special_day: bool = False
    special_day_name: str | None = None
    total_students: int = Field(ge=0)
    students_on_leave: int = Field(ge=0)
    students_staying: int | None = Field(default=None, ge=0)
    prepared_quantity: float | None = Field(default=None, ge=0)
    surplus_quantity: float | None = Field(default=None, ge=0)


class KitchenMealResponse(BaseModel):
    id: int
    kitchen_id: int
    meal_date: datetime
    day_of_week: str
    dish: str
    special_day: bool
    special_day_name: str | None
    meal_type: str
    total_students: int
    students_on_leave: int
    students_staying: int
    prepared_quantity: float | None
    surplus_quantity: float | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RequirementCreate(BaseModel):
    food_type: str
    quantity: float = Field(gt=0)
    unit: str = "servings"
    notes: str | None = None


class RequirementResponse(BaseModel):
    id: int
    organization_id: int
    food_type: str
    quantity: float
    unit: str
    notes: str | None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    capacity: int | None = None
    notes: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    max_distance_km: float | None = Field(default=None, gt=0, le=1000)
    food_preferences: str | None = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OrganizationDecision(BaseModel):
    reason: str | None = None


class SurplusPredictionRequest(BaseModel):
    day_of_week: str
    dish: str
    special_day: bool = False
    special_day_name: str | None = None
    meal_type: str | None = None
    total_students: int = Field(ge=0)
    students_on_leave: int = Field(ge=0)
    students_staying: int = Field(ge=0)
    prepared_quantity: float | None = Field(default=None, ge=0)


class SurplusPredictionResponse(BaseModel):
    predicted_required_quantity: float
    predicted_surplus_quantity: float
    recommendation: str
    source: str


class ExpiryScanResponse(BaseModel):
    extracted_text: str
    expiry_date: datetime | None
    date_str: str | None = None
    confidence: float
    message: str


class ExpiryRecommendation(BaseModel):
    batch_id: int
    item_name: str
    quantity: float
    unit: str
    expiry_date: datetime | None
    days_to_expiry: int | None
    urgency: str
    recommendation: str
    prediction_source: str
