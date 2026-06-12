"""add user notification preferences

Revision ID: 0004_user_notify_prefs
Revises: 0003_user_phone_number
Create Date: 2026-06-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_user_notify_prefs"
down_revision: str | None = "0003_user_phone_number"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("notify_match_reminders", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("users", sa.Column("notify_results", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("users", sa.Column("notify_ranking", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.alter_column("users", "notify_match_reminders", server_default=None)
    op.alter_column("users", "notify_results", server_default=None)
    op.alter_column("users", "notify_ranking", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "notify_ranking")
    op.drop_column("users", "notify_results")
    op.drop_column("users", "notify_match_reminders")
