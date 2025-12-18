from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings using Pydantic BaseSettings.
    Automatically loads from environment variables and .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ============================================================
    # Server Configuration
    # ============================================================
    app_env: str = Field(default="development", alias="APP_ENV")
    host: str = Field(default="0.0.0.0", description="Server host binding")
    port: int = Field(default=8081, gt=0, lt=65536, description="Server port number")
    uvicorn_reload: bool = Field(default=False, description="Enable auto-reload in development")
    cors_origins: Optional[List[str]] = Field(default=None, description="List of allowed CORS origins")

    # ============================================================
    # Data Storage
    # ============================================================
    py_server_data_dir: Optional[Path] = Field(
        default=None,
        description="Root directory for data files"
    )
    py_server_user_db: Optional[Path] = Field(
        default=None,
        description="User database file path"
    )

    # ============================================================
    # AWS Bedrock Configuration (with fallbacks)
    # ============================================================
    bedrock_aws_region: Optional[str] = Field(default=None, alias="BEDROCK_AWS_REGION")
    aws_region: Optional[str] = Field(default=None, alias="AWS_REGION")

    bedrock_aws_access_key_id: Optional[str] = Field(default=None, alias="BEDROCK_AWS_ACCESS_KEY_ID")
    aws_access_key_id: Optional[str] = Field(default=None, alias="AWS_ACCESS_KEY_ID")

    bedrock_aws_secret_access_key: Optional[str] = Field(default=None, alias="BEDROCK_AWS_SECRET_ACCESS_KEY")
    aws_secret_access_key: Optional[str] = Field(default=None, alias="AWS_SECRET_ACCESS_KEY")

    bedrock_aws_session_token: Optional[str] = Field(default=None, alias="BEDROCK_AWS_SESSION_TOKEN")
    aws_session_token: Optional[str] = Field(default=None, alias="AWS_SESSION_TOKEN")

    # ============================================================
    # Strands AI Agent Configuration
    # ============================================================
    strands_model_id: str = Field(default="amazon.nova-lite-v1:0", description="Model ID for Strands")
    bedrock_model_id: Optional[str] = Field(default=None, alias="BEDROCK_MODEL_ID")

    strands_agent_id: Optional[str] = Field(default=None, description="Strands agent identifier")
    strands_agent_alias_id: Optional[str] = Field(default=None, description="Strands agent alias")
    strands_enable_streaming: bool = Field(default=True, description="Enable streaming responses")
    strands_force_fallback: bool = Field(default=False, description="Force fallback model")

    # Model inference parameters
    strands_max_tokens: Optional[int] = Field(default=None, gt=0, description="Max tokens in response")
    strands_default_temperature: float = Field(default=0.0, ge=0.0, le=2.0, description="Temperature")
    strands_default_top_k: int = Field(default=1, gt=0, description="Top-K sampling")
    strands_default_top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Top-P sampling")

    # ============================================================
    # Lesson Generation Configuration
    # ============================================================
    lesson_slide_max_tokens: Optional[int] = Field(default=None, gt=0)
    lesson_practice_max_tokens: Optional[int] = Field(default=None, gt=0)

    # ============================================================
    # API Keys
    # ============================================================
    openrouter_api_key: Optional[str] = Field(default=None, description="OpenRouter API key")

    # ============================================================
    # N-Atlas Configuration (Nigeria)
    # ============================================================
    n_atlas_api_base: str = Field(default="https://tosinamuda--natlas-full-vllm-serve.modal.run/v1", description="N-Atlas VLLM API Base URL")
    n_atlas_model_id: str = Field(default="openai/n-atlas", description="N-Atlas Model ID")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from CSV string or JSON array."""
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try JSON first
            import json
            if v.strip().startswith("["):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except json.JSONDecodeError:
                    pass
            # Fall back to CSV
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @field_validator("py_server_data_dir", mode="before")
    @classmethod
    def parse_data_dir(cls, v):
        """Set default data directory if not provided."""
        if v is None:
            return Path(__file__).resolve().parent / "data"
        return Path(v)

    @model_validator(mode="after")
    def setup_aws_env_and_dirs(self):
        """
        Post-initialization setup:
        1. Create data directory if it doesn't exist
        2. Set AWS environment variables for boto3 compatibility
        3. Resolve fallback values
        """
        # Create data directory
        if self.py_server_data_dir:
            self.py_server_data_dir.mkdir(parents=True, exist_ok=True)

        # Resolve AWS region with fallback
        region = self.bedrock_aws_region or self.aws_region
        if region:
            os.environ.setdefault("AWS_REGION", region)
            os.environ.setdefault("AWS_DEFAULT_REGION", region)

        # Resolve AWS access key with fallback
        access_key = self.bedrock_aws_access_key_id or self.aws_access_key_id
        if access_key:
            os.environ.setdefault("AWS_ACCESS_KEY_ID", access_key)

        # Resolve AWS secret key with fallback
        secret_key = self.bedrock_aws_secret_access_key or self.aws_secret_access_key
        if secret_key:
            os.environ.setdefault("AWS_SECRET_ACCESS_KEY", secret_key)

        # Resolve AWS session token with fallback
        session_token = self.bedrock_aws_session_token or self.aws_session_token
        if session_token:
            os.environ.setdefault("AWS_SESSION_TOKEN", session_token)

        # Resolve model ID fallback
        if not self.strands_model_id and self.bedrock_model_id:
            self.strands_model_id = self.bedrock_model_id

        return self

    # ============================================================
    # Computed Properties
    # ============================================================
    @property
    def environment(self) -> str:
        """Alias for app_env for backward compatibility."""
        return self.app_env

    @property
    def data_root(self) -> Path:
        """Alias for py_server_data_dir for backward compatibility."""
        return self.py_server_data_dir or Path(__file__).resolve().parent / "data"

    @property
    def user_db_path(self) -> Path:
        """Get the user database file path."""
        if self.py_server_user_db:
            return self.py_server_user_db
        return self.data_root / "users.json"

    @property
    def bedrock_region(self) -> Optional[str]:
        """Get AWS region with fallback."""
        return self.bedrock_aws_region or self.aws_region

    @property
    def bedrock_access_key_id(self) -> Optional[str]:
        """Get AWS access key ID with fallback."""
        return self.bedrock_aws_access_key_id or self.aws_access_key_id

    @property
    def bedrock_secret_access_key(self) -> Optional[str]:
        """Get AWS secret access key with fallback."""
        return self.bedrock_aws_secret_access_key or self.aws_secret_access_key

    @property
    def bedrock_session_token(self) -> Optional[str]:
        """Get AWS session token with fallback."""
        return self.bedrock_aws_session_token or self.aws_session_token


def get_settings() -> Settings:
    """
    Factory function to get Settings instance.
    Uses Pydantic's caching mechanism for singleton-like behavior.
    """
    return Settings()
