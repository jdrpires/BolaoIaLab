from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.audit import record_audit_event
from app.domain.entities import Company, User, UserRole
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import UserAdminUpdate, UserRead

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)) -> list[User]:
    statement = select(User).options(selectinload(User.company)).order_by(User.created_at.desc())
    return list((await session.execute(statement)).scalars().all())


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    payload: UserAdminUpdate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    before = {
        "company_id": user.company_id,
        "role": user.role,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
    }

    if payload.company_id is not None:
        company = await session.get(Company, payload.company_id)
        if not company or not company.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
        user.company_id = company.id

    if payload.role is not None:
        user.role = UserRole(payload.role)
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number or None
    if payload.is_active is not None:
        user.is_active = payload.is_active

    after = {
        "company_id": user.company_id,
        "role": user.role,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
    }
    await record_audit_event(
        session,
        action="admin.user_updated",
        target_type="user",
        target_id=user.id,
        actor=actor,
        metadata={"before": before, "after": after},
    )
    await session.commit()
    await session.refresh(user)
    return user
