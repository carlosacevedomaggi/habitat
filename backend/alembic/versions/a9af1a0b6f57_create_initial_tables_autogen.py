"""create_initial_tables_autogen

Revision ID: a9af1a0b6f57
Revises: 
Create Date: 2025-05-14 17:28:32.491892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9af1a0b6f57'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('properties',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('price', sa.Float(), nullable=True),
    sa.Column('location', sa.String(), nullable=True),
    sa.Column('property_type', sa.String(), nullable=True),
    sa.Column('listing_type', sa.String(), nullable=True),
    sa.Column('bedrooms', sa.Integer(), nullable=True),
    sa.Column('bathrooms', sa.Integer(), nullable=True),
    sa.Column('area', sa.Float(), nullable=True),
    sa.Column('image_url', sa.String(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('is_featured', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_properties_id'), 'properties', ['id'], unique=False)
    op.create_table('site_settings',
    sa.Column('key', sa.String(), nullable=False),
    sa.Column('value', sa.JSON(), nullable=True),
    sa.Column('category', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('key')
    )
    op.create_index(op.f('ix_site_settings_category'), 'site_settings', ['category'], unique=False)
    op.create_index(op.f('ix_site_settings_key'), 'site_settings', ['key'], unique=False)
    op.create_table('team_members',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('position', sa.String(), nullable=True),
    sa.Column('image_url', sa.String(), nullable=True),
    sa.Column('order', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_team_members_id'), 'team_members', ['id'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('role', sa.Enum('admin', 'manager', 'staff', name='role'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('contacts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('subject', sa.String(), nullable=True),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('property_id', sa.Integer(), nullable=True),
    sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('is_read', sa.Boolean(), nullable=True),
    sa.Column('assigned_to_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contacts_id'), 'contacts', ['id'], unique=False)
    op.create_table('property_images',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('property_id', sa.Integer(), nullable=False),
    sa.Column('image_url', sa.String(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_property_images_id'), 'property_images', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_property_images_id'), table_name='property_images')
    op.drop_table('property_images')
    op.drop_index(op.f('ix_contacts_id'), table_name='contacts')
    op.drop_table('contacts')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_team_members_id'), table_name='team_members')
    op.drop_table('team_members')
    op.drop_index(op.f('ix_site_settings_key'), table_name='site_settings')
    op.drop_index(op.f('ix_site_settings_category'), table_name='site_settings')
    op.drop_table('site_settings')
    op.drop_index(op.f('ix_properties_id'), table_name='properties')
    op.drop_table('properties')
    # ### end Alembic commands ###
