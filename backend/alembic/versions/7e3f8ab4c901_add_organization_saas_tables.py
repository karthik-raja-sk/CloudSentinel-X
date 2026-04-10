"""Add organization SaaS tables

Revision ID: 7e3f8ab4c901
Revises: 4c2e9f8d1a2b
Create Date: 2026-04-08 18:05:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7e3f8ab4c901"
down_revision: Union[str, None] = "4c2e9f8d1a2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = insp.get_columns(table_name)
    return any(c["name"] == column_name for c in cols)


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    if "organization" not in existing_tables:
        op.create_table(
            "organization",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_organization_id"), "organization", ["id"], unique=False)
        op.create_index(op.f("ix_organization_name"), "organization", ["name"], unique=True)

    if "organizationmembership" not in existing_tables:
        op.create_table(
            "organizationmembership",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "user_id", name="uq_org_membership_org_user"),
        )
        op.create_index(op.f("ix_organizationmembership_id"), "organizationmembership", ["id"], unique=False)
        op.create_index(op.f("ix_organizationmembership_organization_id"), "organizationmembership", ["organization_id"], unique=False)
        op.create_index(op.f("ix_organizationmembership_user_id"), "organizationmembership", ["user_id"], unique=False)

    if "organizationinvite" not in existing_tables:
        op.create_table(
            "organizationinvite",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("token", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organization.id"]),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_organizationinvite_id"), "organizationinvite", ["id"], unique=False)
        op.create_index(op.f("ix_organizationinvite_organization_id"), "organizationinvite", ["organization_id"], unique=False)
        op.create_index(op.f("ix_organizationinvite_email"), "organizationinvite", ["email"], unique=False)
        op.create_index(op.f("ix_organizationinvite_token"), "organizationinvite", ["token"], unique=True)

    if _has_column("user", "organization_id") is False:
        with op.batch_alter_table("user", schema=None) as batch_op:
            batch_op.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
            batch_op.create_index(batch_op.f("ix_user_organization_id"), ["organization_id"], unique=False)
            batch_op.create_foreign_key("fk_user_organization_id", "organization", ["organization_id"], ["id"])

    if _has_column("project", "organization_id") is False:
        with op.batch_alter_table("project", schema=None) as batch_op:
            batch_op.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
            batch_op.create_index(batch_op.f("ix_project_organization_id"), ["organization_id"], unique=False)
            batch_op.create_foreign_key("fk_project_organization_id", "organization", ["organization_id"], ["id"])

    if _has_column("auditlog", "project_id") is False:
        with op.batch_alter_table("auditlog", schema=None) as batch_op:
            batch_op.add_column(sa.Column("project_id", sa.Integer(), nullable=True))
            batch_op.create_index(batch_op.f("ix_auditlog_project_id"), ["project_id"], unique=False)


def downgrade() -> None:
    pass
