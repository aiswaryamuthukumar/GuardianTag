"""own email/password auth: add password_hash, drop clerk_user_id

Revision ID: c3a7e5d1f2b4
Revises: 9b1f4c2e7a10
Create Date: 2026-09-29 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c3a7e5d1f2b4'
down_revision = '9b1f4c2e7a10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    # Emails are matched case-insensitively at login; normalise any existing rows.
    op.execute("UPDATE users SET email = lower(email)")
    op.drop_index(op.f('ix_users_clerk_user_id'), table_name='users')
    op.drop_column('users', 'clerk_user_id')


def downgrade() -> None:
    op.add_column('users', sa.Column('clerk_user_id', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET clerk_user_id = 'local_' || id::text")
    op.alter_column('users', 'clerk_user_id', nullable=False)
    op.create_index(op.f('ix_users_clerk_user_id'), 'users', ['clerk_user_id'], unique=True)
    op.drop_column('users', 'password_hash')
