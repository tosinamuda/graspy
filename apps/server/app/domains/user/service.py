from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.schemas import User, UserCreate, UserUpdate
from app.settings import Settings


class UserService:
    def __init__(self, settings: Settings) -> None:
        self._path: Path = settings.user_db_path
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._initialize_store()

    async def list_users(self) -> List[User]:
        data = await self._read_db()
        return [User(**item) for item in data.get("users", [])]

    async def add_user(self, payload: UserCreate) -> None:
        data = await self._read_db()
        users = data.setdefault("users", [])
        user = self._create_user(payload)
        users.append(user)
        await self._write_db(data)

    async def update_user(self, payload: UserUpdate) -> None:
        data = await self._read_db()
        users = data.get("users", [])
        for index, existing in enumerate(users):
            if existing["id"] == payload.id:
                users[index] = {
                    **existing,
                    "name": payload.name,
                    "email": payload.email,
                }
                await self._write_db(data)
                return

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    async def delete_user(self, user_id: int) -> None:
        data = await self._read_db()
        users = data.get("users", [])
        for index, existing in enumerate(users):
            if existing["id"] == user_id:
                users.pop(index)
                await self._write_db(data)
                return

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    async def _read_db(self) -> Dict[str, Any]:
        return await run_in_threadpool(self._read_db_sync)

    async def _write_db(self, data: Dict[str, Any]) -> None:
        await run_in_threadpool(self._write_db_sync, data)

    def _read_db_sync(self) -> Dict[str, Any]:
        with self._path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _write_db_sync(self, data: Dict[str, Any]) -> None:
        with self._path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=True)

    def _initialize_store(self) -> None:
        sample = {
            "users": [
                {
                    "id": 366115170645,
                    "name": "Sean Maxwell",
                    "email": "smaxwell@example.com",
                    "created": "2024-03-22T05:14:36.252Z",
                },
                {
                    "id": 310946254456,
                    "name": "John Smith",
                    "email": "john.smith@example.com",
                    "created": "2024-03-22T05:20:55.079Z",
                },
                {
                    "id": 143027113460,
                    "name": "Gordan Freeman",
                    "email": "nova@prospect.com",
                    "created": "2024-03-22T05:42:18.895Z",
                },
            ],
        }
        self._write_db_sync(sample)

    def _create_user(self, payload: UserCreate) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat() + "Z"
        return {
            "id": self._generate_id(),
            "name": payload.name.strip(),
            "email": payload.email.strip().lower(),
            "created": now,
        }

    @staticmethod
    def _generate_id() -> int:
        return int(datetime.utcnow().timestamp() * 1_000_000)
