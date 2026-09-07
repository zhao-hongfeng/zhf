"""FastAPI 应用:创建实例、注册路由、挂载静态文件。"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import APP_TITLE, STATIC_DIR
from app.routers import bookmarks


def create_app() -> FastAPI:
    app = FastAPI(title=APP_TITLE)

    app.include_router(bookmarks.router)

    # 静态文件(前端)最后挂载,避免覆盖上面的 API 路由
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app


app = create_app()
