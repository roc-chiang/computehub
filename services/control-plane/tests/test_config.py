from app.core.config import settings


def test_optional_database_url_is_valid_configuration():
    assert settings.DATABASE_URL is None or isinstance(settings.DATABASE_URL, str)


def test_provider_keys_are_not_required_for_import():
    assert isinstance(settings.RUNPOD_API_KEY, str)
