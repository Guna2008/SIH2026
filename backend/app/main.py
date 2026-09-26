from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import Base, engine
from .migrations_runtime import ensure_columns
from .routers import (
    admin,
    auth,
    claims,
    food,
    kitchen,
    ngo,
    notifications,
    marketplace,
    orphanage,
)


Base.metadata.create_all(bind=engine)
ensure_columns()

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title="Irai API",
    description="Food surplus redistribution platform API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(food.router)
app.include_router(claims.router)
app.include_router(kitchen.router)
app.include_router(ngo.router)
app.include_router(orphanage.router)
app.include_router(notifications.router)
app.include_router(marketplace.router)
app.include_router(admin.router)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/")
def root():
    return {
        "message": "Irai API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }