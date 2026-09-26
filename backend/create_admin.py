from app.database import SessionLocal
from app.models import User
from app.security import hash_password


def create_admin():
    db = SessionLocal()

    try:
        existing_admin = (
            db.query(User)
            .filter(User.role == "ADMIN")
            .first()
        )

        if existing_admin:
            print("An admin already exists.")
            print(f"Admin email: {existing_admin.email}")
            return

        admin = User(
            name="Admin",
            email="admin@tenet.com",
            password_hash=hash_password("Admin@123"),
            role="ADMIN",
            is_verified=True,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin created successfully!")
        print("Email: admin@tenet.com")
        print("Password: Admin@123")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()