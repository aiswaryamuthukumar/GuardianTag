"""user roles and preferences, asset location, arm schedules, notices

Revision ID: 9b1f4c2e7a10
Revises: 4786d73f27e8
Create Date: 2026-09-29 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9b1f4c2e7a10'
down_revision = '4786d73f27e8'
branch_labels = None
depends_on = None

user_role = postgresql.ENUM('STUDENT', 'WARDEN', name='user_role', create_type=False)


def upgrade() -> None:
    user_role.create(op.get_bind(), checkfirst=True)

    op.add_column('users', sa.Column('role', user_role, nullable=False, server_default='STUDENT'))
    op.add_column('users', sa.Column('hostel_block', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('notify_push', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('users', sa.Column('notify_telegram', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('users', sa.Column('quiet_start', sa.String(length=5), nullable=True))
    op.add_column('users', sa.Column('quiet_end', sa.String(length=5), nullable=True))
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('ix_users_hostel_block'), 'users', ['hostel_block'], unique=False)

    op.add_column('assets', sa.Column('location', sa.String(length=255), nullable=True))

    op.create_unique_constraint('uq_user_challenge', 'challenge_completions', ['user_id', 'challenge_id'])

    op.create_table(
        'arm_schedules',
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('asset_id', sa.UUID(), nullable=False),
        sa.Column('days_mask', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('last_active', sa.Boolean(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_arm_schedules_owner_id'), 'arm_schedules', ['owner_id'], unique=False)
    op.create_index(op.f('ix_arm_schedules_asset_id'), 'arm_schedules', ['asset_id'], unique=False)
    op.create_index(op.f('ix_arm_schedules_enabled'), 'arm_schedules', ['enabled'], unique=False)

    op.create_table(
        'notices',
        sa.Column('warden_id', sa.UUID(), nullable=True),
        sa.Column('hostel_block', sa.String(length=50), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['warden_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notices_warden_id'), 'notices', ['warden_id'], unique=False)
    op.create_index(op.f('ix_notices_hostel_block'), 'notices', ['hostel_block'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notices_hostel_block'), table_name='notices')
    op.drop_index(op.f('ix_notices_warden_id'), table_name='notices')
    op.drop_table('notices')
    op.drop_index(op.f('ix_arm_schedules_enabled'), table_name='arm_schedules')
    op.drop_index(op.f('ix_arm_schedules_asset_id'), table_name='arm_schedules')
    op.drop_index(op.f('ix_arm_schedules_owner_id'), table_name='arm_schedules')
    op.drop_table('arm_schedules')
    op.drop_constraint('uq_user_challenge', 'challenge_completions', type_='unique')
    op.drop_column('assets', 'location')
    op.drop_index(op.f('ix_users_hostel_block'), table_name='users')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    for column in ('quiet_end', 'quiet_start', 'notify_telegram', 'notify_push', 'hostel_block', 'role'):
        op.drop_column('users', column)
    user_role.drop(op.get_bind(), checkfirst=True)
