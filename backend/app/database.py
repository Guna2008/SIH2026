from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5174"
    APP_TIMEZONE: str = "Asia/Kolkata"
    SURPLUS_MODEL_URL: str | None = None
    NGO_MATCH_MODEL_URL: str | None = None
    EXPIRY_MODEL_URL: str | None = None
    OCR_TESSERACT_CMD: str | None = None

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        extra="ignore",
    )


settings = Settings()

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+psycopg://"):
    try:
        import psycopg
    except ImportError:
        db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://")

engine = create_engine(
    db_url,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()