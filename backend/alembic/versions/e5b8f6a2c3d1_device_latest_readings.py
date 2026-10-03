"""device latest battery and wifi readings

Revision ID: e5b8f6a2c3d1
Revises: c3a7e5d1f2b4
Create Date: 2026-09-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e5b8f6a2c3d1'
down_revision = 'c3a7e5d1f2b4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('devices', sa.Column('battery_level', sa.Integer(), nullable=True))
    op.add_column('devices', sa.Column('wifi_rssi', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('devices', 'wifi_rssi')
    op.drop_column('devices', 'battery_level')
