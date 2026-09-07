"""网址收藏相关接口。"""

import re
import uuid
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException

from app import storage
from app.config import DEFAULT_CATEGORY
from app.models import BookmarkIn

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


def _normalize_url(url: str) -> str:
    """补全协议头,兼容只输入 example.com 的情况。"""
    url = url.strip()
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "http://" + url
    return url


def _apply_fields(bookmark: dict, bm: BookmarkIn) -> dict:
    """校验并写入表单字段,供添加与编辑共用。"""
    url = _normalize_url(bm.url)
    parsed = urlparse(url)
    if not parsed.netloc:
        raise HTTPException(400, "网址格式不正确")
    bookmark["title"] = bm.title.strip() or parsed.netloc
    bookmark["url"] = url
    bookmark["category"] = bm.category.strip() or DEFAULT_CATEGORY
    bookmark["note"] = bm.note.strip()
    return bookmark


@router.get("")
def list_bookmarks():
    with storage.lock:
        bookmarks = storage.load_all()
    bookmarks.sort(key=lambda b: b.get("created_at", ""), reverse=True)
    return bookmarks


@router.post("", status_code=201)
def add_bookmark(bm: BookmarkIn):
    new_bm = _apply_fields(
        {
            "id": uuid.uuid4().hex,
            "created_at": datetime.now().isoformat(timespec="seconds"),
        },
        bm,
    )
    with storage.lock:
        bookmarks = storage.load_all()
        bookmarks.append(new_bm)
        storage.save_all(bookmarks)
    return new_bm


@router.put("/{bid}")
def update_bookmark(bid: str, bm: BookmarkIn):
    with storage.lock:
        bookmarks = storage.load_all()
        target = next((b for b in bookmarks if b["id"] == bid), None)
        if target is None:
            raise HTTPException(404, "未找到该网址")
        _apply_fields(target, bm)
        storage.save_all(bookmarks)
    return target


@router.delete("/{bid}")
def delete_bookmark(bid: str):
    with storage.lock:
        bookmarks = storage.load_all()
        rest = [b for b in bookmarks if b["id"] != bid]
        if len(rest) == len(bookmarks):
            raise HTTPException(404, "未找到该网址")
        storage.save_all(rest)
    return {"ok": True}
