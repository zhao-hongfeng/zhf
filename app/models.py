"""请求 / 响应数据模型。"""

from pydantic import BaseModel

from app.config import DEFAULT_CATEGORY


class BookmarkIn(BaseModel):
    """添加 / 编辑书签时的表单字段。"""

    title: str = ""
    url: str
    category: str = DEFAULT_CATEGORY
    note: str = ""
