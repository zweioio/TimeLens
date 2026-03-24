<div align="center">
  <img src="assets/icons/icon128.png" alt="TimeLens Logo" width="128" height="128">
  <h1>TimeLens</h1>
  <p>看见时间，守护专注，健康用眼</p>
  <p><i>A smart time management & eye-care guardian for digital citizens.</i></p>
  
  [**English**](#english-version) | [**中文版**](#中文版)
</div>

---

<h2 id="english-version">🇬🇧 English Version</h2>

### 📖 Introduction

In an era where AI tools explode and social media algorithms become increasingly sophisticated, the line between "flow state" and "addiction" is blurred. **TimeLens** is designed to be your "Digital Lens": it not only quantifies where your time goes but also understands the nature of your behavior through a **Multi-Dimensional Tagging System**, monitors your physical state with an **Eye-Health Model**, and helps you regain control via a **Flexible Intervention Mechanism**.

### ✨ Core Features

- **📊 Full-Scale Insight**: Precisely records every second spent on web pages, distinguishing "productive" from "waste".
- **🏷️ Smart Multi-Tagging**: An innovative multi-tag system that accurately identifies complex scenarios (e.g., Learning vs. Entertainment on YouTube). Includes 12 preset tags like `Work`, `AI`, `Social`, `Video`, etc.
- **👁️ Eye Health Algorithm**: Dynamically calculates "Healthy/Unhealthy Screen Time" based on continuous duration and website nature.
- **🌱 Flexible Intervention (Blur & Nudge)**: Replaces harsh blocking with elegant Gaussian blur and gentle nudges, cultivating intrinsic self-discipline.
- **⚡ Modern Tech Stack**: Built with Manifest V3, React 19, Vite, and TailwindCSS for lightning-fast performance.

### 🚀 Getting Started (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/TimeLens.git
   cd TimeLens
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder.

---

<h2 id="中文版">🇨🇳 中文版</h2>

### 📖 项目介绍

在 AI 工具爆发与社交媒体算法日益精明的今天，用户面临着“心流”与“沉迷”界限模糊的困境。**TimeLens** 旨在成为用户的“数字透镜”：它不仅量化时间去向，更通过**多维标签系统**理解行为性质，通过**健康用眼模型**关注身心状态，通过**柔性干预机制**帮助用户重获掌控权。

### ✨ 核心功能

- **📊 全量数据洞察**：精确记录每一秒的网页停留，智能区分“有效工作”与“无意识消耗”。
- **🏷️ 智能多标签系统**：独创多标签体系，精准识别复杂场景（如：在 Bilibili 学习 vs 娱乐）。内置 `工作`、`AI`、`社交`、`影视` 等 12 类预设标签。
- **👁️ 用眼健康模型**：基于连续时长与网站性质，动态计算“健康”与“疲劳”用眼时长，并提供直观的环形进度展示。
- **🌱 柔性干预机制**：告别传统的“一刀切”网页封锁。采用高斯模糊（Gaussian Blur）与温和的居中提示卡片，支持“休息 5 分钟”与“再延长 30 分钟”，培养内源性自律。
- **⚡ 现代技术栈**：基于最新的 Chrome Extension Manifest V3 标准，采用 React 19 + Vite + TailwindCSS 构建，极致轻量与流畅。

### 🚀 如何在本地运行

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/yourusername/TimeLens.git
   cd TimeLens
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 编译打包：
   ```bash
   npm run build
   ```
4. 加载到 Chrome 浏览器：
   - 在地址栏输入并打开 `chrome://extensions/`
   - 打开右上角的 **开发者模式**
   - 点击左上角 **加载已解压的扩展程序**，选择项目生成的 `dist` 文件夹即可。

### 🛠️ 技术架构

- **Background (Service Worker)**: 负责全局状态管理、定时心跳保活、核心计与时长阈值检测。
- **Content Script**: 负责向目标网页注入柔性干预（高斯模糊遮罩）与 React 渲染的提示卡片，并与后台保持状态同步。
- **Popup UI**: 极简的数据概览面板，支持按标签筛选网站耗时。
- **Storage**: 基于 `chrome.storage.local` 构建的高效日志存储与检索引擎。

---
<div align="center">
  <i>Made with ❤️ for digital well-being.</i>
</div>
