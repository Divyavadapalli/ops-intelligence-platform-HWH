from hindsight_client import Hindsight
from backend.config import get_settings

_client: Hindsight | None = None


def get_hindsight() -> Hindsight:
    global _client
    if _client is None:
        settings = get_settings()
        _client = Hindsight(
            base_url=settings.hindsight_base_url,
            api_key=settings.hindsight_api_key,
        )
    return _client


def get_bank_id() -> str:
    return get_settings().hindsight_bank_id
