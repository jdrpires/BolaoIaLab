import httpx
from fastapi import APIRouter, HTTPException, Response, status

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/team-logo/{external_team_id}", response_class=Response)
async def team_logo(external_team_id: int) -> Response:
    url = f"https://media.api-sports.io/football/teams/{external_team_id}.png"
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "BolaoIALab/1.0"})
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not load team logo.",
        ) from exc

    content_type = response.headers.get("content-type", "")
    if response.status_code != status.HTTP_200_OK or "image/" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team logo not found.",
        )

    return Response(
        content=response.content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )
