<h1 align="center">
  <img src="./frontend/public/logo.png" alt="TeslaMate CyberUI Logo" width="56" style="vertical-align: middle; margin-right: 10px; margin-bottom: 8px;">
  TeslaMate CyberUI
</h1>

<p align="center">A modern Tesla data visualization dashboard that connects to TeslaMate database with cyberpunk-style design.</p>

<p align="center">
  <a href="./README_EN.md">English</a> | <a href="./README.md">中文</a>
</p>

![TeslaMate CyberUI](https://via.placeholder.com/800x400?text=TeslaMate+CyberUI)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Relationship with TeslaMate](#relationship-with-teslamate)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Feature Details](#feature-details)
- [Development Guide](#development-guide)
- [FAQ](#faq)

## Features

### 🚗 Vehicle Status Monitoring
- **Real-time Status** - Battery level, range, vehicle location, current state
- **Vehicle Image** - Automatically displays Tesla official configurator images based on model and color
- **Flip Card** - Click to view detailed info (VIN, model, color, software version)
- **Location Map** - Display current vehicle location and address
- **Charging Status** - Real-time charging voltage and power display

### 📊 Data Statistics
- **Overview Stats** - Total mileage, efficiency statistics, temperature info
- **SOC History** - Battery level change curve with custom date range support
- **Activity Timeline** - Visualized driving, charging, online, offline status timeline

### ⚡ Charging Management
- **Charging Records List** - All charging history with filtering and sorting
- **Charging Details** - Charging curve charts (level, power), duration, energy stats
- **Cost Calculation** - Display charging costs (if configured in TeslaMate)
- **Location Info** - Charging location map

### 🛣️ Driving Records
- **Driving Records List** - All driving history with filtering and sorting
- **Driving Details** - Speed/power curves, driving duration, energy consumption stats
- **Route Map** - Support for both Amap and OpenStreetMap map sources
- **China Coordinate Correction** - Amap automatically handles GCJ-02 coordinate offset

### 🎨 Personalization
- **5 Theme Colors** - Cyberpunk, Tesla, Dark Night, Tech Blue, Aurora
- **Auto Theme Color** - Automatically generate theme from dominant color extracted from background image
- **Custom Background** - Upload, crop, and change background image
- **Card Opacity** - Freely adjust card transparency
- **Multi-language** - Support Chinese/English switching
- **Unit Switching** - Metric/Imperial unit switching

### 🔧 System Settings
- **Map Source Switching** - Amap (recommended for China) / OpenStreetMap
- **API Connection Config** - Configure backend address and API Key
- **Amap Key** - Configure Amap API Key
- **Background Image Management** - Upload, crop, delete background images

## Tech Stack

### Backend
- **Go 1.21+** - Backend language
- **Gin** - Web framework
- **sqlx** - Database operations
- **PostgreSQL** - TeslaMate database (read-only)

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Style framework
- **ECharts** - Data visualization
- **Zustand** - State management

## Relationship with TeslaMate

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tesla API     │────▶│   TeslaMate     │────▶│   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ Read-only
                                                         ▼
                                                ┌─────────────────┐
                                                │  CyberUI Backend│
                                                └────────┬────────┘
                                                         │
                                                         │ API
                                                         ▼
                                                ┌─────────────────┐
                                                │  CyberUI Frontend│
                                                └─────────────────┘
```

**TeslaMate CyberUI is an independent visualization dashboard that:**
- 🔗 **Read-only access** to TeslaMate's PostgreSQL database
- 📊 **Does not modify** any TeslaMate data
- 🚀 **Independent deployment**, does not affect TeslaMate operation
- 🔄 **Real-time reading** of data recorded by TeslaMate

### Why CyberUI?

TeslaMate comes with Grafana dashboards, but:
- Grafana is more focused on data analysis, less intuitive
- CyberUI provides a more modern mobile-friendly interface
- Independent deployment, can serve as a supplementary view for TeslaMate

## Quick Start

### Prerequisites

1. **TeslaMate running** - Ensure TeslaMate is running normally and recording data
2. **Docker & Docker Compose** - Docker deployment recommended
3. **Amap API Key** (optional) - For driving route map

### Configure TeslaMate Database Access

CyberUI needs to access TeslaMate's PostgreSQL database. You need to ensure:

#### Method 1: TeslaMate using default Docker network

If your TeslaMate is deployed with Docker, ensure database port is accessible:

```yaml
# TeslaMate's docker-compose.yml example
services:
  database:
    image: postgres:15
    # Expose port or use external network
    ports:
      - "5432:5432"  # Optional: expose for host access
```

#### Method 2: Use the same Docker network

Add CyberUI to TeslaMate's network:

```yaml
# CyberUI's docker-compose.yml
services:
  backend:
    networks:
      - teslamate_default  # TeslaMate's network
networks:
  teslamate_default:
    external: true
```

#### Method 3: Environment variable configuration

The simplest way is to connect via environment variables:

```bash
# Create .env file
TESLAMATE_DB_HOST=your-teslamate-db-host
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=your-password
TESLAMATE_DB_NAME=teslamate
```

### Docker Deployment

```bash
# 1. Clone the project
git clone https://github.com/DeaglePC/TeslamateCyberUI.git
cd TeslamateCyberUI

# 2. Create configuration file
cat > .env << EOF
# TeslaMate database configuration
TESLAMATE_DB_HOST=your-teslamate-db-host
TESLAMATE_DB_PORT=5432
TESLAMATE_DB_USER=teslamate
TESLAMATE_DB_PASSWORD=your-password
TESLAMATE_DB_NAME=teslamate
TESLAMATE_DB_SSLMODE=disable

# CyberUI service ports
CYBERUI_PORT=8080
CYBERUI_API_PORT=8899

# Optional: API Key authentication
CYBERUI_API_KEY=

# Timezone
TZ=Asia/Shanghai
EOF

# 3. Start services
docker compose up -d

# 4. View logs
docker compose logs -f

# 5. Access the application
# http://localhost:8080
```

### Local Development

```bash
# Backend
cd backend
go mod download
# Modify configs/config.yaml to configure database
go run cmd/server/main.go

# Frontend
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TESLAMATE_DB_HOST` | TeslaMate database host | - | ✅ |
| `TESLAMATE_DB_PORT` | Database port | 5432 | |
| `TESLAMATE_DB_USER` | Database username | - | ✅ |
| `TESLAMATE_DB_PASSWORD` | Database password | - | ✅ |
| `TESLAMATE_DB_NAME` | Database name | teslamate | |
| `TESLAMATE_DB_SSLMODE` | SSL mode | disable | |
| `CYBERUI_PORT` | Frontend service port | 8080 | |
| `CYBERUI_API_PORT` | Backend API port | 8899 | |
| `CYBERUI_API_KEY` | API authentication key | - | |
| `TZ` | Timezone | Asia/Shanghai | |

### Amap Configuration

1. Visit [Amap Open Platform](https://console.amap.com/dev/key/app)
2. Create an application, select "Web端 (JS API)" type
3. Enter the Key in settings page

> ⚠️ **Important**: Must select "Web端 (JS API)" type, cannot use "Web服务" type.

## Feature Details

### Home Dashboard

| Feature | Description |
|---------|-------------|
| Vehicle Image | Auto-match Tesla official image based on model and color |
| Battery Display | Battery icon + percentage, turns red below 20% |
| Status Info | Current state (driving/charging/online/offline/asleep) |
| Location Map | Current vehicle location with address |
| Stats Cards | Range, mileage, software version, temperature |
| SOC Chart | Battery level change curve |
| Timeline | State change timeline visualization |

### Charging Records

| Feature | Description |
|---------|-------------|
| List Filter | Filter charging records by time range |
| Charging Details | Level curve, power curve |
| Charging Stats | Duration, energy, cost |
| Location Map | Charging location display |

### Driving Records

| Feature | Description |
|---------|-------------|
| List Filter | Filter driving records by time range |
| Driving Details | Speed curve, power curve, elevation changes |
| Route Map | Amap/OpenStreetMap dual map sources |
| Driving Stats | Distance, duration, average energy consumption |

### Theme System

| Theme | Color Style |
|-------|-------------|
| Cyberpunk | Blue-purple neon, default theme |
| Tesla | Red-black, tribute to official |
| Dark Night | Deep blue-purple, low-key elegant |
| Tech Blue | Fresh blue tech feel |
| Aurora | Green-purple gradient, dreamy |
| Auto Theme | Auto-generated from background image color |

## Development Guide

### Project Structure

```
TeslamateCyberUI/
├── backend/                 # Go backend
│   ├── cmd/server/         # Application entry
│   ├── internal/
│   │   ├── config/         # Configuration management
│   │   ├── handler/        # HTTP handlers
│   │   ├── model/          # Data models
│   │   └── repository/     # Data repositories
│   └── configs/            # Config files
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Components
│   │   ├── pages/          # Pages
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   └── public/
├── docker-compose.yml
└── README.md
```

### API Endpoints

```
GET /api/v1/cars                    # Vehicle list
GET /api/v1/cars/:id/status         # Vehicle status
GET /api/v1/cars/:id/charges        # Charging records
GET /api/v1/cars/:id/drives         # Driving records
GET /api/v1/charges/:id             # Charging details
GET /api/v1/charges/:id/stats       # Charging stats
GET /api/v1/drives/:id              # Driving details
GET /api/v1/drives/:id/positions    # Driving positions
GET /api/v1/cars/:id/stats/overview # Overview stats
GET /api/v1/cars/:id/stats/soc      # SOC history
GET /api/v1/cars/:id/stats/timeline # Status timeline
GET /health                         # Health check
```

## FAQ

### Q: Cannot connect to database?

1. Check if database address and port are correct
2. Confirm database user has access permissions
3. If using Docker, check network configuration

### Q: Amap display error?

1. Confirm using "Web端 (JS API)" type Key
2. Check if Key is configured correctly
3. If `USERKEY_PLAT_NOMATCH` error appears, Key type is wrong

### Q: Data not refreshing?

Data comes from TeslaMate, refresh frequency depends on TeslaMate settings. CyberUI auto-refreshes every 30 seconds.

### Q: Can I modify TeslaMate data?

No. CyberUI only reads data, it does not modify any TeslaMate data.

## License

MIT License

## Acknowledgments

- [TeslaMate](https://github.com/adriankumpf/teslamate) - Excellent Tesla data logging tool
- [Gin](https://github.com/gin-gonic/gin) - Go Web framework
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [ECharts](https://echarts.apache.org/) - Data visualization library
