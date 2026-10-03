"""notice priority

Revision ID: f7c9a1b3d5e2
Revises: e5b8f6a2c3d1
Create Date: 2026-09-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f7c9a1b3d5e2'
down_revision = 'e5b8f6a2c3d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('notices', sa.Column('priority', sa.String(length=10), nullable=False, server_default='normal'))


def downgrade() -> None:
    op.drop_column('notices', 'priority')
