from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    hindsight_base_url: str = "https://api.hindsight.vectorize.io"
    hindsight_api_key: str = ""
    hindsight_bank_id: str = "memento-demo-final"

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_fallback_model: str = "qwen/qwen3.8-27b"

    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    seed_token: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
