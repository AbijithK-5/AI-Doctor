from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import admin, auth, comparison, doctor, notifications, patient, research
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Healthcare Comparison Platform comparing AI Clinical Decision-Support and Authoritative Human Doctor Assessments.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(comparison.router)
app.include_router(research.router)
app.include_router(admin.router)
app.include_router(notifications.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database_mode": "postgresql" if settings.is_postgres else "sqlite_local_dev",
        "ai_demo_mode": not bool(settings.LLM_API_KEY),
    }
