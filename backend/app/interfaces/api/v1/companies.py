from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Company
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[CompanyRead])
async def list_companies(session: AsyncSession = Depends(get_session)) -> list[Company]:
    return list((await session.execute(select(Company).order_by(Company.name))).scalars().all())


@router.post("", response_model=CompanyRead, dependencies=[Depends(require_admin)])
async def create_company(payload: CompanyCreate, session: AsyncSession = Depends(get_session)) -> Company:
    company = Company(**payload.model_dump())
    session.add(company)
    await session.commit()
    await session.refresh(company)
    return company


@router.patch("/{company_id}", response_model=CompanyRead, dependencies=[Depends(require_admin)])
async def update_company(company_id: UUID, payload: CompanyUpdate, session: AsyncSession = Depends(get_session)) -> Company:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await session.commit()
    await session.refresh(company)
    return company
