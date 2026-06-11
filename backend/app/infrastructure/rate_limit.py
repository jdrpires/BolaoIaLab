import time
from collections import defaultdict, deque
from collections.abc import Callable, Awaitable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.core import get_settings
from app.infrastructure.observability import client_ip


class InMemoryRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        settings = get_settings()
        if (
            not settings.rate_limit_enabled
            or request.url.path in {"/health", "/docs", "/redoc"}
            or request.url.path.startswith(f"{settings.api_v1_prefix}/assets/")
        ):
            return await call_next(request)

        key = f"{client_ip(request)}:{request.url.path}"
        now = time.monotonic()
        window_start = now - settings.rate_limit_window_seconds
        hits = self._hits[key]
        while hits and hits[0] < window_start:
            hits.popleft()

        if len(hits) >= settings.rate_limit_requests:
            retry_after = max(1, int(settings.rate_limit_window_seconds - (now - hits[0])))
            return JSONResponse(
                status_code=429,
                headers={"retry-after": str(retry_after)},
                content={
                    "error": {
                        "code": "rate_limit_exceeded",
                        "message": "Too many requests. Try again later.",
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
            )

        hits.append(now)
        response = await call_next(request)
        response.headers["x-ratelimit-limit"] = str(settings.rate_limit_requests)
        response.headers["x-ratelimit-remaining"] = str(max(0, settings.rate_limit_requests - len(hits)))
        return response
