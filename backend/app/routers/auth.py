from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DoctorProfile, DoctorVerification, PatientProfile, ResearcherProfile, User
from ..schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    UserSettingsUpdate,
)
from ..security import (
    create_access_token,
    create_notification,
    get_current_user,
    hash_password,
    log_audit,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "role": user.role,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "gender": user.gender,
        "status": user.status,
        "consent_accepted": user.consent_accepted,
        "notification_preferences": user.notification_preferences,
        "privacy_settings": user.privacy_settings,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if not payload.consent_accepted:
        raise HTTPException(status_code=400, detail="You must accept the Terms and Privacy Policy consent to register.")
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    now = datetime.now(timezone.utc)
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        role=payload.role,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    db.add(user)
    db.flush()

    if payload.role == "patient":
        age = None
        if payload.date_of_birth:
            today = datetime.now(timezone.utc).date()
            age = today.year - payload.date_of_birth.year - (
                (today.month, today.day) < (payload.date_of_birth.month, payload.date_of_birth.day)
            )
        db.add(PatientProfile(user_id=user.id, age=age, gender=payload.gender))
    elif payload.role == "doctor":
        reg_no = payload.registration_number or f"MED-REG-{user.id:05d}"
        doc_prof = DoctorProfile(
            user_id=user.id,
            qualification=payload.qualification or "MBBS, MD",
            medical_speciality=payload.medical_speciality or "Internal Medicine",
            registration_number=reg_no,
            hospital_name=payload.hospital_name or "Partner Medical Center",
            contact_info=payload.phone_number or payload.email,
            verification_status="pending",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "09:00 - 17:00"},
        )
        db.add(doc_prof)
        db.flush()
        db.add(
            DoctorVerification(
                doctor_profile_id=doc_prof.id,
                submitted_license_number=reg_no,
                issuing_authority="National Medical Council",
                status="pending",
            )
        )
    elif payload.role == "researcher":
        db.add(
            ResearcherProfile(
                user_id=user.id,
                institution=payload.institution or "Clinical AI Research Institute",
                research_focus=payload.research_focus or "Diagnostic Concordance & Explainable AI",
            )
        )

    create_notification(
        db,
        user_id=user.id,
        category="account",
        title="Welcome to AI vs Human Doctor",
        message=f"Your {payload.role} account has been created successfully. Complete your profile to get started.",
        link_url=f"/{payload.role}/dashboard" if payload.role != "admin" else "/admin/dashboard",
    )
    log_audit(db, user, "USER_REGISTER", "user", str(user.id), {"role": user.role}, request)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(user)}


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account is suspended. Please contact an administrator.")
    if user.status == "deleted":
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    if payload.role and payload.role != user.role:
        raise HTTPException(
            status_code=403,
            detail=f"Role mismatch: this account is registered as '{user.role}', not '{payload.role}'.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    log_audit(db, user, "USER_LOGIN", "user", str(user.id), {"remember_me": payload.remember_me}, request)
    db.commit()

    expire_mins = 10080 if payload.remember_me else None  # 7 days vs default 24h
    token = create_access_token({"sub": str(user.id), "role": user.role}, expires_minutes=expire_mins)
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(user)}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if user:
        log_audit(db, user, "PASSWORD_RESET_REQUESTED", "user", str(user.id), {})
        db.commit()
    return {
        "message": "If an account exists for that email address, password reset instructions have been queued (Demo Mode)."
    }


@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(db, current_user, "USER_LOGOUT", "user", str(current_user.id), {}, request)
    db.commit()
    return {"message": "Logged out securely."}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.put("/settings")
def update_settings(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.gender is not None:
        current_user.gender = payload.gender
    if payload.notification_preferences is not None:
        current_user.notification_preferences = payload.notification_preferences
    if payload.privacy_settings is not None:
        current_user.privacy_settings = payload.privacy_settings

    log_audit(db, current_user, "SETTINGS_UPDATED", "user", str(current_user.id), {})
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    current_user.password_hash = hash_password(payload.new_password)
    log_audit(db, current_user, "PASSWORD_CHANGED", "user", str(current_user.id), {})
    db.commit()
    return {"message": "Password updated successfully."}
