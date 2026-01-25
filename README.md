# TeslaMate CyberUI

一个现代化的 TeslaMate 数据可视化面板，采用赛博朋克风格设计。

## 功能特性

- 🚗 **车辆状态实时监控** - 电池电量、续航里程、车辆位置等
- ⚡ **充电记录管理** - 查看所有充电历史，分析充电曲线
- 🛣️ **驾驶记录追踪** - 驾驶轨迹地图、速度/功率曲线
- 📊 **数据统计概览** - 总里程、能效、电池衰减分析
- 🎨 **5套主题配色** - 赛博朋克、特斯拉、暗夜、科技蓝、极光
- 📱 **响应式设计** - PC端侧边栏 + 移动端底部导航
- 🗺️ **高德地图集成** - 驾驶轨迹可视化
- 🔧 **单位切换** - 公制/英制单位切换

## 技术栈

### 后端
- **Go 1.21+** - 后端语言
- **Gin** - Web 框架
- **sqlx** - 数据库操作
- **PostgreSQL** - TeslaMate 数据库（只读）
- **logrus** - 日志库

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **ECharts** - 数据可视化
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **高德地图 API** - 轨迹地图

## 项目结构

```
TeslamateCyberUI/
├── backend/                 # Go 后端
│   ├── cmd/
│   │   └── server/
│   │       └── main.go     # 应用入口
│   ├── configs/
│   │   └── config.yaml     # 配置文件
│   ├── internal/
│   │   ├── config/          # 配置加载
│   │   ├── handler/        # HTTP 处理器
│   │   ├── logger/         # 日志管理
│   │   ├── model/          # 数据模型
│   │   └── repository/     # 数据仓储
│   ├── go.mod
│   └── go.sum
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API 服务
│   │   ├── store/          # 状态管理
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── Dockerfile              # 多阶段构建
├── docker-compose.yml      # Docker 编排
└── README.md
```

## 快速开始

### 前置要求

- Go 1.21+
- Node.js 18+
- PostgreSQL 15+ (TeslaMate 数据库)
- 高德地图 API Key (可选，用于显示轨迹)

### 使用 Docker Compose (推荐)

1. **克隆项目**

```bash
git clone https://github.com/yourusername/TeslamateCyberUI.git
cd TeslamateCyberUI
```

2. **配置环境变量**

复制 `.env.example` 为 `.env`，并配置连接到现有 TeslaMate 数据库的参数：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下配置：

```bash
# 连接到你现有的 TeslaMate 数据库
TESLAMATE_DB_HOST=your-teslamate-db-host
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=your-teslamate-db-password
TESLAMATE_DB_NAME=teslamate
TESLAMATE_DB_SSLMODE=disable
```

3. **启动服务**

```bash
docker-compose up -d
```

4. **访问应用**

打开浏览器访问: http://localhost:8080

> **注意**：docker-compose 只部署前端和后端服务，不会创建数据库。你需要确保已有运行中的 TeslaMate 数据库。

### 本地开发

#### 后端开发

1. **安装依赖**

```bash
cd backend
go mod download
```

2. **配置数据库**

编辑 `backend/configs/config.yaml`，配置你的 TeslaMate 数据库连接：

```yaml
database:
  host: "localhost"
  port: "5432"
  user: "teslamate"
  password: "teslamate"
  dbname: "teslamate"
  sslmode: "disable"
```

3. **运行后端**

```bash
go run cmd/server/main.go
```

后端服务将运行在 http://localhost:8080

#### 前端开发

1. **安装依赖**

```bash
cd frontend
npm install
```

2. **启动开发服务器**

```bash
npm run dev
```

前端服务将运行在 http://localhost:5173

3. **构建生产版本**

```bash
npm run build
```

## 配置说明

### 数据库配置

应用需要连接到 TeslaMate 的 PostgreSQL 数据库。

**方式1：通过 .env 文件配置（推荐）**

```bash
# .env
TESLAMATE_DB_HOST=localhost
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=teslamate
TESLAMATE_DB_NAME=teslamate
TESLAMATE_DB_SSLMODE=disable
```

**方式2：通过 config.yaml 配置（本地开发）**

```yaml
# backend/configs/config.yaml
database:
  host: "localhost"
  port: "5432"
  user: "teslamate"
  password: "teslamate"
  dbname: "teslamate"
  sslmode: "disable"
```

**配置说明：**
- `TESLAMATE_DB_HOST` - 数据库服务器地址（Docker 环境默认为 `teslamate-db`）
- `TESLAMATE_DB_PORT` - 数据库端口（默认 5432）
- `TESLAMATE_DB_USER` - 数据库用户名
- `TESLAMATE_DB_PASSWORD` - 数据库密码
- `TESLAMATE_DB_NAME` - 数据库名称（默认为 `teslamate`）
- `TESLAMATE_DB_SSLMODE` - SSL 模式（可选值：`disable`, `require`, `verify-ca`, `verify-full`）

### 高德地图配置

在应用设置页面中配置高德地图 API Key：

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 注册账号并创建应用
3. 获取 Web 端 (JS API) Key
4. 在应用设置页面填入 Key

配置完成后即可在驾驶详情页查看轨迹地图。

### 主题切换

应用内置 5 套主题：

- **赛博朋克** - 默认主题，蓝紫霓虹配色
- **特斯拉** - 红黑配色，致敬特斯拉官方
- **暗夜** - 深蓝紫色，低调优雅
- **科技蓝** - 清新的蓝色科技感
- **极光** - 绿紫渐变，梦幻唯美

在设置页面即可切换主题。

## API 接口

后端提供以下 RESTful API：

### 车辆相关
- `GET /api/v1/cars` - 获取车辆列表
- `GET /api/v1/cars/:id/status` - 获取车辆状态

### 充电相关
- `GET /api/v1/cars/:id/charges` - 获取充电记录列表
- `GET /api/v1/charges/:id` - 获取充电详情
- `GET /api/v1/charges/:id/stats` - 获取充电统计数据

### 驾驶相关
- `GET /api/v1/cars/:id/drives` - 获取驾驶记录列表
- `GET /api/v1/drives/:id` - 获取驾驶详情
- `GET /api/v1/drives/:id/positions` - 获取驾驶轨迹点

### 统计相关
- `GET /api/v1/cars/:id/stats/overview` - 获取概览统计
- `GET /api/v1/cars/:id/stats/efficiency` - 获取能效统计
- `GET /api/v1/cars/:id/stats/battery` - 获取电池统计

### 健康检查
- `GET /health` - 服务健康检查

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t teslamate-cyberui:latest .

# 运行容器（连接到外部 TeslaMate 数据库）
docker run -d \
  -p 8080:8080 \
  -e CYBERUI_DATABASE_HOST=your-teslamate-db-host \
  -e CYBERUI_DATABASE_PORT=5432 \
  -e CYBERUI_DATABASE_USER=teslamate \
  -e CYBERUI_DATABASE_PASSWORD=your-teslamate-db-password \
  -e CYBERUI_DATABASE_DBNAME=teslamate \
  -e CYBERUI_DATABASE_SSLMODE=disable \
  teslamate-cyberui:latest
```

### Docker Compose 部署（推荐）

```bash
# 配置 .env 文件
cp .env.example .env
# 编辑 .env，配置数据库连接参数

# 启动服务（包含前端和后端）
docker-compose up -d

# 查看日志
docker-compose logs -f teslamate-cyberui

# 停止服务
docker-compose down
```

> **注意**：Docker Compose 部署只启动前端和后端服务，你需要确保 TeslaMate 数据库正在运行并可访问。

## 注意事项

1. **数据库权限** - 应用只需要只读权限访问 TeslaMate 数据库
2. **数据安全** - 建议使用环境变量配置敏感信息
3. **网络配置** - 确保 PostgreSQL 数据库可从容器访问
4. **日志配置** - 生产环境建议将日志级别设置为 `info` 或 `warn`

## 开发规范

### Go 代码规范
- 遵循 Google Golang 代码规范
- 使用 `gofmt` 格式化代码
- 使用 `goimports` 管理 import
- 所有导出的包、函数、类型必须有文档注释
- 使用接口驱动开发
- 错误必须处理或明确忽略
- 禁止使用 panic 进行一般错误处理

### React 代码规范
- 使用 TypeScript 进行类型安全
- 使用函数式组件和 Hooks
- 遵循 Airbnb JavaScript 规范
- 组件使用 PascalCase，函数使用 camelCase
- 所有 API 调用使用服务层封装
- 使用 Zustand 进行状态管理

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 致谢

- [TeslaMate](https://github.com/adriankumpf/teslamate) - 优秀的 Tesla 数据记录工具
- [Gin](https://github.com/gin-gonic/gin) - Go Web 框架
- [React](https://react.dev/) - UI 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [ECharts](https://echarts.apache.org/) - 数据可视化库

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/yourusername/TeslamateCyberUI/issues)
- 发送邮件: your.email@example.com
