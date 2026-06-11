"""expand user avatar url

Revision ID: 0002_user_avatar_text
Revises: 0001_initial_schema
Create Date: 2026-06-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_user_avatar_text"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "avatar_url", existing_type=sa.String(length=500), type_=sa.Text(), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("users", "avatar_url", existing_type=sa.Text(), type_=sa.String(length=500), existing_nullable=True)
