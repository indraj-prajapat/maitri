# database_models.py

import uuid
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, DateTime, Integer, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
# DATABASE_URL = "postgresql+psycopg2://indraj:indraj@10.11.87.8:5432/maitri_db2"
import platform
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL_SAVE2")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
# Define the base class for declarative models
Base = declarative_base()

class MainMapping(Base):
    """
    First table: Stores the main mapping combination.
    The ID is a unique combination of source and target metadata.
    """
    __tablename__ = 'main_mappings'

    id = Column(String, primary_key=True, index=True)
    source_country = Column(String, nullable=True)
    source_domain = Column(String, nullable=True)
    source_port = Column(String, nullable=True)
    target_country = Column(String, nullable=True)
    target_domain = Column(String, nullable=True)
    target_port = Column(String, nullable=True)
    source_location = Column(String, nullable=True)
    target_location = Column(String, nullable=True)
    target_massages = Column(JSON, nullable=False)
    source_massages = Column(JSON, nullable=False)
    total_mapping_count = Column(Integer, nullable=False)
    no_of_updates = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to the second table
    detailed_mappings = relationship("DetailedMapping", back_populates="main_mapping", cascade="all, delete-orphan")

class DetailedMapping(Base):
    """
    Second table: Stores detailed mappings for each main mapping entry.
    A new table is conceptually created for each row in the MainMapping table.
    """
    __tablename__ = 'detailed_mappings'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    main_mapping_id = Column(String, ForeignKey('main_mappings.id'), nullable=False, index=True)

    target_massage = Column(Text, nullable=False)
    target_key = Column(String, nullable=False)
    target_value = Column(String, nullable=False)
    source_massage = Column(Text, nullable=False)
    source_key = Column(String, nullable=False)
    source_value = Column(String, nullable=False)

    transformation_needed = Column(String, nullable=True)
    transformation_details = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    status = Column(String, default='latest') # e.g., 'latest', 'edited', 'archived'
    Ai_Manual = Column(String, nullable=True) # To indicate if mapping was AI-generated or manually edited
    # Relationships
    main_mapping = relationship("MainMapping", back_populates="detailed_mappings")
    history = relationship("TargetHistory", back_populates="detailed_mapping", cascade="all, delete-orphan")

class TargetHistory(Base):
    """
    Third table: Tracks the history of mappings for each target.
    Conceptually, a new table is created for each target in the second table.
    """
    __tablename__ = 'target_history'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    detailed_mapping_id = Column(String, ForeignKey('detailed_mappings.id'), nullable=False, index=True)
    main_mapping_id = Column(String, ForeignKey('main_mappings.id'), nullable=False, index=True)
    
    target_massage = Column(Text, nullable=False)
    target_key = Column(String, nullable=False)
    target_value = Column(String, nullable=False)
    
    source_massage = Column(Text, nullable=False)
    source_key = Column(String, nullable=False)
    source_value = Column(String, nullable=False)
    
    transformation_needed = Column(String, nullable=True)
    transformation_details = Column(Text, nullable=True)

    observation_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='latest') # To signify this is the latest observation
    Ai_Manual = Column(String, nullable=True) # To indicate if mapping was AI-generated or manually edited
    # Relationship
    detailed_mapping = relationship("DetailedMapping", back_populates="history")
    

def init_db2():
    Base.metadata.create_all(bind=engine)
