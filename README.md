<p align="center">
  <img src="./frontend/public/logo.png" alt="TeslaMate CyberUI Logo" width="80">
</p>
<h1 align="center">TeslaMate CyberUI</h1>

<p align="center">
  <a href="./README_EN.md">English</a> | <a href="./README.md">中文</a>
</p>

<p align="center">一个现代化的 Tesla 数据可视化面板，连接 TeslaMate 数据库，采用赛博朋克风格设计。</p>

<p align="center">
  <a href="https://github.com/DeaglePC/TeslamateCyberUI/stargazers">
    <img src="https://img.shields.io/github/stars/DeaglePC/TeslamateCyberUI?style=for-the-badge&color=00f0ff&labelColor=222222&logo=github" alt="GitHub Stars" />
  </a>
  <a href="https://tsl.deaglepc.cn/">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Ftsl.deaglepc.cn%2F&style=for-the-badge&color=00f0ff&labelColor=222222&logo=vercel" alt="Website Status" />
  </a>
</p>

> **🌟 在线体验 (Demo)**
>
> - **前端访问**：[https://tsl.deaglepc.cn/](https://tsl.deaglepc.cn/)
> - **后端 API**：[https://tsldemo.deaglepc.cn](https://tsldemo.deaglepc.cn) *(用于演示的自动填充后端假数据)*

![TeslaMate CyberUI](https://via.placeholder.com/800x400?text=TeslaMate+CyberUI)

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [与 TeslaMate 的关系](#与-teslamate-的关系)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [功能详解](#功能详解)
- [开发指南](#开发指南)
- [常见问题](#常见问题)

## 功能特性

### 🚗 车辆状态监控
- **实时状态** - 电池电量、续航里程、车辆位置、当前状态
- **车型图片** - 自动根据车型和外观颜色显示 Tesla 官方配置器图片
- **翻转卡片** - 点击查看详细信息（VIN、型号、颜色、软件版本）
- **位置地图** - 显示车辆当前位置和地址
- **充电状态** - 实时显示充电电压、功率

### 📊 数据统计
- **概览统计** - 总里程、能效统计、温度信息
- **SOC 历史** - 电池电量变化曲线，支持自定义日期范围
- **活动时间线** - 可视化显示行驶、充电、在线、离线状态时间线

### ⚡ 充电管理
- **充电记录列表** - 所有充电历史，支持筛选和排序
- **充电详情** - 充电曲线图表（电量、功率）、充电时长、能量统计
- **费用计算** - 显示充电费用（如 TeslaMate 已配置）
- **位置信息** - 充电位置地图

### 🛣️ 驾驶记录
- **驾驶记录列表** - 所有驾驶历史，支持筛选和排序
- **驾驶详情** - 速度/功率曲线、驾驶时长、能耗统计
- **轨迹地图** - 支持高德地图和 OpenStreetMap 两种地图源
- **中国坐标纠偏** - 高德地图自动处理 GCJ-02 坐标偏移

### 🎨 个性化设置
- **5套主题配色** - 赛博朋克、特斯拉、暗夜、科技蓝、极光
- **自动主题色** - 从背景图片提取主色调自动生成主题
- **自定义背景** - 上传、裁剪、更换背景图片
- **卡片透明度** - 自由调整卡片透明度
- **多语言** - 支持中文/英文切换
- **单位切换** - 公制/英制单位切换

### 🔧 系统设置
- **地图源切换** - 高德地图（中国推荐）/ OpenStreetMap
- **API 连接配置** - 配置后端地址和 API Key
- **高德地图 Key** - 配置高德地图 API Key
- **背景图片管理** - 上传、裁剪、删除背景图片

### 📱 PWA（渐进式 Web 应用）支持
本面板已完整支持 PWA，提供媲美原生 App 的沉浸式体验：
- **秒开体验** - 支持核心资源的本地离线缓存
- **桌面/主屏幕安装** - 在桌面系统（Chrome/Edge）或移动端（iOS/Android 主屏幕）可一键“安装到设备”
- **原生沉浸感** - 隐藏浏览器状态栏与导航条，在 iOS 下呈现全屏无边框的赛博朋克深邃体验

> **💡 最佳实践**：建议不要在浏览器内直接高频使用。请在你的手机浏览器（如 Safari）底部点击“分享” -> “添加到主屏幕”，或在电脑端浏览器的地址栏右侧点击“安装应用”图标，将其以独立 App 的形式运行以获得完美体验。

## 技术栈

### 后端
- **Go 1.21+** - 后端语言
- **Gin** - Web 框架
- **sqlx** - 数据库操作
- **PostgreSQL** - TeslaMate 数据库（只读）

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **ECharts** - 数据可视化
- **Zustand** - 状态管理

## 与 TeslaMate 的关系

### 架构说明

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tesla API     │────▶│   TeslaMate     │────▶│   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ 只读访问
                                                         ▼
                                                ┌─────────────────┐
                                                │  CyberUI 后端   │
                                                └────────┬────────┘
                                                         │
                                                         │ API
                                                         ▼
                                                ┌─────────────────┐
                                                │  CyberUI 前端   │
                                                └─────────────────┘
```

**TeslaMate CyberUI 是一个独立的可视化面板，它：**
- 🔗 **只读访问** TeslaMate 的 PostgreSQL 数据库
- 📊 **不修改**任何 TeslaMate 数据
- 🚀 **独立部署**，不影响 TeslaMate 运行
- 🔄 **实时读取** TeslaMate 记录的数据

### 为什么需要 CyberUI？

TeslaMate 自带 Grafana 仪表盘，但：
- Grafana 更偏向数据分析，不够直观
- CyberUI 提供更现代化的移动端友好界面
- 独立部署，可作为 TeslaMate 的补充视图

## 快速开始

### 前置要求

1. **已运行 TeslaMate** - 确保 TeslaMate 正常运行并记录数据
2. **Docker & Docker Compose** - 推荐使用 Docker 部署
3. **高德地图 API Key** (可选) - 用于驾驶轨迹地图

### 配置 TeslaMate 数据库访问

CyberUI 需要访问 TeslaMate 的 PostgreSQL 数据库。你需要确保：

#### 方法一：TeslaMate 使用默认 Docker 网络

如果你的 TeslaMate 使用 Docker 部署，确保数据库端口可访问：

```yaml
# TeslaMate 的 docker-compose.yml 示例
services:
  database:
    image: postgres:15
    # 暴露端口或使用外部网络
    ports:
      - "5432:5432"  # 可选：暴露给主机访问
```

#### 方法二：使用同一 Docker 网络

将 CyberUI 加入 TeslaMate 的网络：

```yaml
# CyberUI 的 docker-compose.yml
services:
  backend:
    networks:
      - teslamate_default  # TeslaMate 的网络
networks:
  teslamate_default:
    external: true
```

#### 方法三：环境变量配置

最简单的方式是通过环境变量连接：

```bash
# 创建 .env 文件
TESLAMATE_DB_HOST=your-teslamate-db-host
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=your-password
TESLAMATE_DB_NAME=teslamate
```

### Docker 部署

```bash
# 1. 克隆项目
git clone https://github.com/DeaglePC/TeslamateCyberUI.git
cd TeslamateCyberUI

# 2. 创建配置文件
cat > .env << EOF
# TeslaMate 数据库配置
TESLAMATE_DB_HOST=your-teslamate-db-host
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=your-password
TESLAMATE_DB_NAME=teslamate
TESLAMATE_DB_SSLMODE=disable

# CyberUI 服务端口
CYBERUI_PORT=8080
CYBERUI_API_PORT=8899

# CyberUI API 认证密钥 (必填)
CYBERUI_API_KEY=your-secure-api-key

# 时区
TZ=Asia/Shanghai
EOF

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f

# 5. 访问应用
# http://localhost:8080
```

### 本地开发 (Mock 数据模式)

如果本地没有 TeslaMate 数据库，可以开启 Mock 数据模式进行前端开发和 UI 预览：

```bash
# 后端
cd backend
go mod download
# 临时启用 Mock 数据环境变量
export CYBERUI_MOCK_DATA=true
go run cmd/server/main.go

# 前端 (新终端窗口)
cd frontend
npm install
npm run dev
```

### 本地开发 (真实数据库模式)

```bash
# 后端
cd backend
go mod download
# 通过 .env / 环境变量 / configs/config.yaml 配置好真实数据库连接
go run cmd/server/main.go

# 前端 (新终端窗口)
cd frontend
npm install
npm run dev
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `TESLAMATE_DB_HOST` | TeslaMate 数据库地址 | - | ✅ |
| `TESLAMATE_DB_PORT` | 数据库端口 | 5432 | |
| `TESLAMATE_DB_USER` | 数据库用户名 | - | ✅ |
| `TESLAMATE_DB_PASSWORD` | 数据库密码 | - | ✅ |
| `TESLAMATE_DB_NAME` | 数据库名称 | teslamate | |
| `TESLAMATE_DB_SSLMODE` | SSL 模式 | disable | |
| `CYBERUI_PORT` | 前端服务端口 | 8080 | |
| `CYBERUI_API_PORT` | 后端 API 端口 | 8899 | |
| `CYBERUI_API_KEY` | API 认证密钥 | - | ✅ |
| `TZ` | 时区 | Asia/Shanghai | |

### 高德地图配置

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 创建应用，选择「Web端 (JS API)」类型
3. 获取 Key 后在设置页面填入

> ⚠️ **重要**：必须选择「Web端 (JS API)」类型，不能使用「Web服务」类型。

## 功能详解

### 首页仪表盘

| 功能 | 说明 |
|------|------|
| 车辆图片 | 根据车型和颜色自动匹配 Tesla 官方图片 |
| 电量显示 | 电池图标 + 百分比，低于 20% 变红 |
| 状态信息 | 当前状态（行驶/充电/在线/离线/休眠） |
| 位置地图 | 当前车辆位置，显示地址 |
| 统计卡片 | 续航、里程、软件版本、温度 |
| SOC 图表 | 电池电量变化曲线 |
| 时间线 | 状态变化时间线可视化 |

### 充电记录

| 功能 | 说明 |
|------|------|
| 列表筛选 | 按时间范围筛选充电记录 |
| 充电详情 | 电量曲线、功率曲线 |
| 充电统计 | 充电时长、能量、费用 |
| 位置地图 | 充电位置显示 |

### 驾驶记录

| 功能 | 说明 |
|------|------|
| 列表筛选 | 按时间范围筛选驾驶记录 |
| 驾驶详情 | 速度曲线、功率曲线、海拔变化 |
| 轨迹地图 | 高德/OpenStreetMap 双地图源 |
| 驾驶统计 | 距离、时长、平均能耗 |

### 主题系统

| 主题 | 配色风格 |
|------|----------|
| 赛博朋克 | 蓝紫霓虹，默认主题 |
| 特斯拉 | 红黑配色，致敬官方 |
| 暗夜 | 深蓝紫色，低调优雅 |
| 科技蓝 | 清新蓝色科技感 |
| 极光 | 绿紫渐变，梦幻唯美 |
| 自动主题 | 从背景图提取颜色自动生成 |

## 开发指南

### 项目结构

```
TeslamateCyberUI/
├── backend/                 # Go 后端
│   ├── cmd/server/         # 应用入口
│   ├── internal/
│   │   ├── config/         # 配置管理
│   │   ├── handler/        # HTTP 处理器
│   │   ├── model/          # 数据模型
│   │   └── repository/     # 数据仓储
│   └── configs/            # 配置文件
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API 服务
│   │   ├── store/          # 状态管理
│   │   └── utils/          # 工具函数
│   └── public/
├── docker-compose.yml
└── README.md
```

### API 接口

```
GET /api/v1/cars                    # 车辆列表
GET /api/v1/cars/:id/status         # 车辆状态
GET /api/v1/cars/:id/charges        # 充电记录
GET /api/v1/cars/:id/drives         # 驾驶记录
GET /api/v1/charges/:id             # 充电详情
GET /api/v1/charges/:id/stats       # 充电统计
GET /api/v1/drives/:id              # 驾驶详情
GET /api/v1/drives/:id/positions    # 驾驶轨迹
GET /api/v1/cars/:id/stats/overview # 概览统计
GET /api/v1/cars/:id/stats/soc      # SOC 历史
GET /api/v1/cars/:id/stats/timeline # 状态时间线
GET /health                         # 健康检查
```

## 常见问题

### Q: 无法连接数据库？

1. 检查数据库地址和端口是否正确
2. 确认数据库用户有访问权限
3. 如果使用 Docker，检查网络配置

### Q: 高德地图显示错误？

1. 确认使用的是「Web端 (JS API)」类型的 Key
2. 检查 Key 是否正确配置
3. 如果出现 `USERKEY_PLAT_NOMATCH` 错误，说明 Key 类型不对

### Q: 数据不刷新？

数据来自 TeslaMate，刷新频率取决于 TeslaMate 的设置。CyberUI 每 30 秒自动刷新一次。

### Q: 可以修改 TeslaMate 数据吗？

不可以。CyberUI 只读取数据，不会修改任何 TeslaMate 数据。

## 许可证

MIT License

## 致谢

- [TeslaMate](https://github.com/adriankumpf/teslamate) - 优秀的 Tesla 数据记录工具
- [Gin](https://github.com/gin-gonic/gin) - Go Web 框架
- [React](https://react.dev/) - UI 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [ECharts](https://echarts.apache.org/) - 数据可视化库
