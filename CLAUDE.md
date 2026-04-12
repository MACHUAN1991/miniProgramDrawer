# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeChat Mini Program "小马的知识抽屉" for collecting and managing text clips and images. Uses WeChat cloud development (云开发) with cloud database, cloud storage, and cloud functions.

## Tech Stack

- WeChat Mini Program
- WeChat Cloud Development (wx.cloud)
- Cloud Database (MongoDB-like)
- Cloud Storage for images
- Cloud Functions (Node.js)

## Key Files

- `miniprogram/app.js` - Entry point, initializes WeChat cloud with env ID
- `miniprogram/app.json` - Mini program configuration
- `miniprogram/pages/index/index.js` - Main page logic (clips feed, login, add/delete)
- `miniprogram/pages/index/index.wxml` - Main page UI template
- `miniprogram/cloud/ocr/index.js` - OCR cloud function (recognizes text from images)
- `miniprogram/cloud/deleteClip/index.js` - Cloud function for deleting clips (supports password protection)

## Database Collections

- `clips` - User-created content (type: 'text' | 'image', content, imageUrl, creatorName, creatorAvatar, createdAt)
- `topics` - Topics (per CLOUD_SETUP.md)
- `users` - User settings (per CLOUD_SETUP.md)

## Cloud Configuration

1. Set cloud environment ID in `miniprogram/app.js` line 7
2. Create database collections: `clips`, `topics`, `users` (all with read/write: true)
3. Deploy cloud functions: right-click `cloud/ocr` or `cloud/deleteClip` → "上传并部署"
4. Install cloud function dependencies: right-click `cloud/*/package.json` → "安装依赖"

## Asset Requirements

Icons needed in `miniprogram/assets/` (64x64 PNG):
- home.png, home-active.png, add.png, add-active.png, mine.png, mine-active.png
- camera.png, album.png, review.png, notify.png, about.png, empty.png

## Development

- Open in WeChat Developer Tools
- Compile and preview in the IDE
- Configure cloud environment before deploying
