"""add scoring rules

Revision ID: 0006_scoring_rules
Revises: 0005_audit_events
Create Date: 2026-06-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_scoring_rules"
down_revision: str | None = "0005_audit_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scoring_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("exact_score_points", sa.Integer(), nullable=False),
        sa.Column("winner_points", sa.Integer(), nullable=False),
        sa.Column("draw_points", sa.Integer(), nullable=False),
        sa.Column("goal_difference_points", sa.Integer(), nullable=False),
        sa.Column("team_score_points", sa.Integer(), nullable=False),
        sa.Column("underdog_bonus_points", sa.Integer(), nullable=False),
        sa.Column("lock_minutes_before_match", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_scoring_rules_is_active"), "scoring_rules", ["is_active"], unique=False)
    op.execute(
        """
        INSERT INTO scoring_rules (
            id, name, exact_score_points, winner_points, draw_points,
            goal_difference_points, team_score_points, underdog_bonus_points,
            lock_minutes_before_match, is_active, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), 'default', 10, 4, 4, 2, 1, 0, 0, true, now(), now()
        )
        """
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_scoring_rules_is_active"), table_name="scoring_rules")
    op.drop_table("scoring_rules")
