# 知识抽屉 - 微信小程序

帮助你在兴趣来临时快速收藏知识，定期回顾不忘记忆。

## 功能

- **快速收藏**：文字、链接、拍照（AI自动识别图片文字）
- **主题分类**：为每个兴趣创建独立抽屉
- **云端同步**：换手机也不丢数据
- **定期回顾**：设置提醒，定期推送回顾

## 使用步骤

### 1. 开通云开发

1. 在微信公众平台后台 → 开发 → 开发管理 → 开发设置 中，开通云开发
2. 获取云环境ID，替换 `app.js` 中的 `env` 值

### 2. 创建云函数

在微信开发者工具中，右键 `cloud/ocr` 文件夹 → 上传并部署

### 3. 添加图标

在 `assets/` 文件夹中添加以下图标文件（48x48 PNG格式）：
- `home.png` / `home-active.png`
- `add.png` / `add-active.png`
- `mine.png` / `mine-active.png`
- `camera.png` / `album.png`
- `review.png` / `notify.png` / `about.png`
- `empty.png`

### 4. 创建数据库集合

在云开发控制台创建以下集合：
- `clips` - 收藏记录
- `topics` - 主题
- `users` - 用户设置

### 5. 配置订阅消息

在小程序后台 → 功能 → 订阅消息 中添加提醒模板

## 项目结构

```
miniprogram/
├── pages/
│   ├── index/      # 首页 - 收藏列表
│   ├── add/        # 新增收藏
│   ├── topic/      # 主题详情
│   ├── review/     # 回顾模式
│   └── mine/       # 个人设置
├── cloud/
│   └── ocr/        # OCR云函数
├── assets/         # 图标资源
└── app.js
```

## License

MIT
