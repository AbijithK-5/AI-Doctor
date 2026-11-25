from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "AI vs Human Doctor – Smart Healthcare Comparison Platform"
    APP_VERSION: str = "1.0.0"

    # Defaults to local SQLite if DATABASE_URL is not configured so local evaluation works immediately;
    # set DATABASE_URL=postgresql+psycopg2://... for PostgreSQL.
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'healthcare.db').as_posix()}"

    JWT_SECRET_KEY: str = "aivshuman-dev-secret-key-replace-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    LLM_API_KEY: str = ""
    LLM_MODEL: str = "clinical-nlp-sklearn-v2.1"

    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 15

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")


settings = Settings()
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
