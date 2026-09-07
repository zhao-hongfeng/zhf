"""全局配置:路径与常量。"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 项目根目录
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_FILE = os.path.join(DATA_DIR, "bookmarks.txt")
STATIC_DIR = os.path.join(BASE_DIR, "static")

APP_TITLE = "LinkHub 网址收藏"
DEFAULT_CATEGORY = "未分类"
HOST = "127.0.0.1"
PORT = 8000
