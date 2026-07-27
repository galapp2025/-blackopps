from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def _redis_result_backend(broker_url: str) -> str:
    if broker_url.rstrip("/").endswith("/0"):
        return broker_url.rsplit("/", 1)[0] + "/1"
    return broker_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "BlackOpps Election Intelligence"
    openai_model: str = "gpt-4o-mini"
    debug: bool = False
    openai_api_key: str | None = None

    newsapi_key: str | None = None
    opensanctions_api_key: str | None = None
    opencorporates_api_key: str | None = None

    database_url: str = "sqlite:///./enrichment.db"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://blackopps.vercel.app",
    ]
    blackopps_api_keys: str | None = None

    enrichment_batch_size: int = 100
    predictive_default_threshold: float = 0.5
    analyze_task_timeout_seconds: int = 180
    dispatch_task_timeout_seconds: int = 30
    dispatch_redis_queue_key: str = "blackopps:dispatch:queue"
    intelligence_sync_fallback: bool = True

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_db_url(cls, value: str) -> str:
        return _normalize_database_url(value)

    @model_validator(mode="after")
    def wire_celery_from_redis(self) -> "Settings":
        broker = self.celery_broker_url or self.redis_url
        self.celery_broker_url = broker
        self.celery_result_backend = self.celery_result_backend or _redis_result_backend(broker)
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
