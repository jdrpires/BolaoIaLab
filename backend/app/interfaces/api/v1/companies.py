from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.audit import record_audit_event
from app.domain.entities import Company
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[CompanyRead])
async def list_companies(session: AsyncSession = Depends(get_session)) -> list[Company]:
    return list((await session.execute(select(Company).order_by(Company.name))).scalars().all())


@router.post("", response_model=CompanyRead)
async def create_company(
    payload: CompanyCreate,
    actor=Depends(require_admin),  # type: ignore[no-untyped-def]
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = Company(**payload.model_dump())
    session.add(company)
    await session.flush()
    await record_audit_event(
        session,
        action="company.created",
        target_type="company",
        target_id=company.id,
        actor=actor,
        metadata=payload.model_dump(),
    )
    await session.commit()
    await session.refresh(company)
    return company


@router.patch("/{company_id}", response_model=CompanyRead)
async def update_company(
    company_id: UUID,
    payload: CompanyUpdate,
    actor=Depends(require_admin),  # type: ignore[no-untyped-def]
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    updates = payload.model_dump(exclude_unset=True)
    before = {field: getattr(company, field) for field in updates}
    for field, value in updates.items():
        setattr(company, field, value)
    await record_audit_event(
        session,
        action="company.updated",
        target_type="company",
        target_id=company.id,
        actor=actor,
        metadata={"before": before, "after": updates},
    )
    await session.commit()
    await session.refresh(company)
    return company
