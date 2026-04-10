"""Add project membership table

Revision ID: 4c2e9f8d1a2b
Revises: 10af2bb20af2
Create Date: 2026-04-08 17:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4c2e9f8d1a2b"
down_revision: Union[str, None] = "10af2bb20af2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projectmembership",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "project_id", name="uq_project_membership_user_project"),
    )
    op.create_index(op.f("ix_projectmembership_id"), "projectmembership", ["id"], unique=False)
    op.create_index(op.f("ix_projectmembership_project_id"), "projectmembership", ["project_id"], unique=False)
    op.create_index(op.f("ix_projectmembership_user_id"), "projectmembership", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_projectmembership_user_id"), table_name="projectmembership")
    op.drop_index(op.f("ix_projectmembership_project_id"), table_name="projectmembership")
    op.drop_index(op.f("ix_projectmembership_id"), table_name="projectmembership")
    op.drop_table("projectmembership")
