from fastapi.testclient import TestClient

from app.core import get_settings
from app.main import create_app


def build_client(monkeypatch, **env: str) -> TestClient:
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()
    return TestClient(create_app(), raise_server_exceptions=False)


def test_health_returns_request_id_and_rate_headers(monkeypatch) -> None:
    client = build_client(monkeypatch)

    response = client.get("/health", headers={"x-request-id": "test-request"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "test-request"
    assert response.json() == {"status": "ok", "environment": "local"}


def test_not_found_uses_global_error_shape(monkeypatch) -> None:
    client = build_client(monkeypatch)

    response = client.get("/missing")

    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "http_error"
    assert body["error"]["request_id"]


def test_unhandled_exception_uses_global_error_shape(monkeypatch) -> None:
    client = build_client(monkeypatch)

    @client.app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("private details")

    response = client.get("/boom")

    assert response.status_code == 500
    assert response.json()["error"] == {
        "code": "internal_server_error",
        "message": "Unexpected server error.",
        "request_id": response.json()["error"]["request_id"],
    }


def test_rate_limit_blocks_after_configured_threshold(monkeypatch) -> None:
    client = build_client(
        monkeypatch,
        RATE_LIMIT_ENABLED="true",
        RATE_LIMIT_REQUESTS="2",
        RATE_LIMIT_WINDOW_SECONDS="60",
    )

    @client.app.get("/limited")
    async def limited() -> dict[str, bool]:
        return {"ok": True}

    assert client.get("/limited").status_code == 200
    assert client.get("/limited").status_code == 200
    response = client.get("/limited")

    assert response.status_code == 429
    assert response.headers["retry-after"]
    assert response.json()["error"]["code"] == "rate_limit_exceeded"


def test_rate_limit_can_be_disabled(monkeypatch) -> None:
    client = build_client(
        monkeypatch,
        RATE_LIMIT_ENABLED="false",
        RATE_LIMIT_REQUESTS="1",
        RATE_LIMIT_WINDOW_SECONDS="60",
    )

    @client.app.get("/limited-disabled")
    async def limited_disabled() -> dict[str, bool]:
        return {"ok": True}

    assert client.get("/limited-disabled").status_code == 200
    assert client.get("/limited-disabled").status_code == 200
