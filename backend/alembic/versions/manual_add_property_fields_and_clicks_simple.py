"""manual add property fields and clicks simple

Revision ID: manual01
Revises: a9af1a0b6f57
Create Date: 2025-05-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'manual01'
down_revision = 'a9af1a0b6f57'
branch_labels = None
depends_on = None


def upgrade():
    # Create property_clicks log table
    op.create_table(
        'property_clicks',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('clicked_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
    )
    # Add new columns to properties
    op.add_column('properties', sa.Column('square_feet', sa.Integer(), nullable=True))
    op.add_column('properties', sa.Column('assigned_to_id', sa.Integer(), nullable=True))
    op.add_column('properties', sa.Column('created_by_user_id', sa.Integer(), nullable=True))
    op.add_column('properties', sa.Column('status', sa.String(), nullable=True))
    op.add_column('properties', sa.Column('owner_id', sa.Integer(), nullable=True))


def downgrade():
    # Drop property_clicks table
    op.drop_table('property_clicks')
    # Remove added columns
    op.drop_column('properties', 'status')
    op.drop_column('properties', 'created_by_user_id')
    op.drop_column('properties', 'assigned_to_id')
    op.drop_column('properties', 'square_feet')
    op.drop_column('properties', 'owner_id') 