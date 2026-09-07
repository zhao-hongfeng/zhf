"""启动入口。

运行:python main.py
等价于:uvicorn app.main:app --reload
"""

import uvicorn

from app.config import HOST, PORT

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT)
