# LinkHub · 网址收藏

一个简洁好看的网址收藏网站:前端原生 HTML / CSS / JS,后端 FastAPI,数据保存在 txt 文件中,无需数据库。

## 运行

```bash
pip install -r requirements.txt
python main.py
```

浏览器打开 <http://127.0.0.1:8000> 即可使用,接口文档见 <http://127.0.0.1:8000/docs>。

## 项目结构

```
.
├── main.py                 # 启动入口(uvicorn app.main:app)
├── requirements.txt        # 运行依赖
├── app/                    # 后端
│   ├── main.py             # FastAPI 应用工厂:注册路由、挂载静态文件
│   ├── config.py           # 路径与常量
│   ├── models.py           # Pydantic 数据模型
│   ├── storage.py          # 数据访问层:txt 读写(带线程锁)
│   └── routers/
│       └── bookmarks.py    # 书签增删改查接口
├── static/                 # 前端(由 FastAPI 静态托管)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── data/
    └── bookmarks.txt       # 数据文件,每行一个 JSON
```

## 开发约定

- 新增接口:在 `app/routers/` 下新建模块,用 `APIRouter` 定义,再到 `app/main.py` 注册
- 数据读写只走 `app/storage.py`,读-改-写操作需在 `storage.lock` 内完成
- 前端无构建工具,改完刷新页面即可;接口统一使用 `/api/` 前缀
- 书签 JSON 字段:`id` / `title` / `url` / `category` / `note` / `created_at`

## 功能

- 点击卡片直接在新标签页跳转对应网站
- 添加 / 编辑 / 删除网址(删除需二次点击确认,防误删)
- 支持分类筛选、关键词搜索
- 自动展示网站图标,获取失败时显示彩色字母头像
- 深色玻璃拟态界面,自适应手机屏幕

## 数据说明

- 所有数据保存在 [data/bookmarks.txt](data/bookmarks.txt),每行一个 JSON 对象
- 可以直接用记事本手动编辑(注意保持每行一个 JSON 的格式)
- 标题留空时自动使用域名作为标题
