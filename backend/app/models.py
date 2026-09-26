from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    food_preferences: Mapped[str | None] = mapped_column(String(30), nullable=True)

    capacity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    organization_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    food_listings = relationship(
        "FoodListing",
        back_populates="kitchen",
        cascade="all, delete-orphan",
    )

    claims = relationship(
        "Claim",
        back_populates="claimant",
        foreign_keys="Claim.claimant_id",
    )

    inventory_items = relationship(
        "InventoryItem",
        back_populates="kitchen",
        cascade="all, delete-orphan",
    )

    productions = relationship(
        "Production",
        back_populates="kitchen",
        cascade="all, delete-orphan",
    )

    requirements = relationship(
        "Requirement",
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class FoodListing(Base):
    __tablename__ = "food_listings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    kitchen_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    food_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    remaining_quantity: Mapped[float] = mapped_column(Float, nullable=False)

    meal_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    condition: Mapped[str] = mapped_column(String(20), default="GOOD", nullable=False, index=True)
    provider_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    provider_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    unit: Mapped[str] = mapped_column(
        String(50),
        default="servings",
        nullable=False,
    )

    expiry_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    pickup_time: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="AVAILABLE",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    kitchen = relationship(
        "User",
        back_populates="food_listings",
    )

    claims = relationship(
        "Claim",
        back_populates="food_listing",
        cascade="all, delete-orphan",
    )


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    food_listing_id: Mapped[int] = mapped_column(
        ForeignKey("food_listings.id", ondelete="CASCADE"),
        nullable=False,
    )

    claimant_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    pin: Mapped[str] = mapped_column(String(4), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    food_listing = relationship(
        "FoodListing",
        back_populates="claims",
    )

    claimant = relationship(
        "User",
        back_populates="claims",
        foreign_keys=[claimant_id],
    )


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    kitchen_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(50),
        default="kg",
        nullable=False,
    )

    minimum_stock: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    kitchen = relationship(
        "User",
        back_populates="inventory_items",
    )

    batches = relationship(
        "InventoryBatch",
        back_populates="inventory_item",
        cascade="all, delete-orphan",
    )


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    inventory_item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(50),
        default="kg",
        nullable=False,
    )

    expiry_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    inventory_item = relationship(
        "InventoryItem",
        back_populates="batches",
    )


class Production(Base):
    __tablename__ = "productions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    kitchen_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    item_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(50),
        default="servings",
        nullable=False,
    )

    production_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    kitchen = relationship(
        "User",
        back_populates="productions",
    )


class KitchenMealRecord(Base):
    __tablename__ = "kitchen_meal_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kitchen_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    day_of_week: Mapped[str] = mapped_column(String(20), nullable=False)
    dish: Mapped[str] = mapped_column(String(255), nullable=False)
    special_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    special_day_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    total_students: Mapped[int] = mapped_column(Integer, nullable=False)
    students_on_leave: Mapped[int] = mapped_column(Integer, nullable=False)
    students_staying: Mapped[int] = mapped_column(Integer, nullable=False)
    prepared_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    surplus_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    kitchen = relationship("User")


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    food_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(50),
        default="servings",
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    organization = relationship(
        "User",
        back_populates="requirements",
    )


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="notifications",
    )