"""数据访问层:bookmarks.txt 的读写。

文件格式:每行一个 JSON 对象(字段:id / title / url / category / note / created_at)。
路由层不直接操作文件,统一走本模块;读-改-写操作需在 lock 内完成,避免并发写坏文件。
"""

import json
import os
import threading

from app.config import DATA_DIR, DATA_FILE

lock = threading.Lock()


def load_all() -> list[dict]:
    """读取全部书签,容错跳过损坏行。调用方负责用 lock 包裹读-改-写。"""
    bookmarks = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip().lstrip("﻿")  # 兼容记事本保存带来的 BOM
                if not line:
                    continue
                try:
                    bookmarks.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return bookmarks


def save_all(bookmarks: list[dict]) -> None:
    """整表写回文件。调用方负责用 lock 包裹读-改-写。"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        for bm in bookmarks:
            f.write(json.dumps(bm, ensure_ascii=False) + "\n")
