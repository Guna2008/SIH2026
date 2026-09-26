from datetime import datetime, timedelta, timezone
import bcrypt

try:
    import jwt
    _IS_PYJWT = hasattr(jwt, 'PyJWTError')
except ImportError:
    from jose import jwt
    _IS_PYJWT = False

from .database import settings


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8')[:72],
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def create_access_token(
    user_id: int,
    role: str,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def decode_token(token: str):
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except Exception:
        return None