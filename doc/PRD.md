# TeslaMate CyberUI - 产品需求文档 (PRD)

## 第一部分：项目概述

### 1.1 项目信息

| 项目 | 内容 |
|------|------|
| **项目名称** | TeslaMate CyberUI |
| **版本** | MVP v1.0 |
| **项目背景** | 基于开源项目 TeslaMate 采集并存储在 PostgreSQL 中的车辆数据，开发一个轻量级、高性能、独立的看板应用 |
| **核心目标** | 提供比 Grafana 更定制化、移动端体验更佳的数据可视化界面，并通过 API Key 实现安全的数据访问 |

### 1.2 MVP 功能范围

MVP 版本聚焦于 **核心概览、充电记录、驾驶记录** 三大功能模块，共计 **6 个页面**：

| 优先级 | 页面 | 功能描述 |
|--------|------|----------|
| P0 | 首页概览 (Overview) | 车辆状态总览、电池电量、续航里程、位置信息、状态时间线 |
| P0 | 充电记录列表 (Charges) | 充电历史记录列表，支持筛选、排序和分页 |
| P0 | 充电详情 (Charge Details) | 单次充电的功率曲线、温度曲线、电压电流变化图表 |
| P0 | 驾驶记录列表 (Drives) | 驾驶行程历史记录，显示里程、耗时、能耗等 |
| P0 | 驾驶详情 (Drive Details) | 单次驾驶的轨迹地图、速度曲线、海拔曲线、能耗分析 |
| P1 | 系统设置 (Settings) | API 配置、主题切换、单位系统切换 |

### 1.3 核心特性

- **多车辆支持**：顶部导航栏集成车辆选择器，支持快速切换
- **单位系统可配置**：公里/英里、摄氏度/华氏度可切换
- **地图集成**：使用高德/百度地图展示驾驶轨迹和充电位置
- **完整图表**：充电/驾驶详情页提供多维度数据曲线分析
- **赛博朋克风格**：提供独特的 UI 主题风格

---

## 第二部分：技术栈架构

### 2.1 后端技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 语言 | Go 1.21+ | 高性能、编译型语言 |
| Web 框架 | Gin | 轻量级 HTTP 框架 |
| 数据库访问 | sqlx | 原生 SQL + 结构体映射 |
| 数据源 | TeslaMate PostgreSQL | 只读访问 |
| 鉴权 | X-API-KEY Header | 自定义 API Key 验证 |

### 2.2 前端技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | React 18 + TypeScript | 类型安全的组件化开发 |
| 样式 | Tailwind CSS | 原子化 CSS 框架 |
| 图表库 | Apache ECharts | 功能强大的可视化库 |
| 地图 | 高德地图 JS API | 国内访问优化 |
| HTTP 客户端 | Axios | 支持拦截器和统一配置 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 路由 | React Router v6 | SPA 路由管理 |

### 2.3 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用 (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Pages   │  │  Charts  │  │   Map    │  │  State (Zustand) │ │
│  │ Overview │  │ ECharts  │  │  AMap    │  │  car, settings   │ │
│  │ Charges  │  │ 曲线图表  │  │ 轨迹地图  │  │                  │ │
│  │ Drives   │  │          │  │          │  │                  │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Axios (API Client)                     │   │
│  │              BaseURL + X-API-KEY Header                   │   │
│  └────────────────────────────┬─────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端服务 (Go/Gin)                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Router  │──│  Middleware  │──│       Handlers           │  │
│  │ /api/*   │  │  API Key 验证 │  │  car/charge/drive        │  │
│  └──────────┘  └──────────────┘  └───────────┬──────────────┘  │
│                                               │                  │
│                                               ▼                  │
│                                  ┌──────────────────────────┐   │
│                                  │      Repository          │   │
│                                  │   (sqlx + Raw SQL)       │   │
│                                  └───────────┬──────────────┘   │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ PostgreSQL
                                               ▼
                              ┌─────────────────────────────────┐
                              │    TeslaMate PostgreSQL DB      │
                              │  (cars, charges, drives, ...)   │
                              └─────────────────────────────────┘
```

---

## 第三部分：功能需求详细设计

### 3.1 首页概览 (Overview)

#### 功能描述
展示车辆的实时状态和核心指标，是用户日常查看的主要入口。

#### 数据指标

| 指标 | 数据来源 | 说明 |
|------|----------|------|
| 电池电量 (SOC) | `positions.battery_level` | 当前电池百分比 |
| 续航里程 | `positions.ideal_battery_range_km` 或 `rated_battery_range_km` | 根据用户偏好显示 |
| 里程表 | `positions.odometer` | 车辆总里程 |
| 车辆状态 | `states` 表 | online/asleep/offline |
| 当前位置 | `positions.latitude/longitude` + `addresses` | 显示地址或坐标 |
| 充电状态 | `charging_processes` | 是否正在充电及功率 |
| 车内/外温度 | `positions.inside_temp/outside_temp` | 实时温度 |
| 软件版本 | `updates` 表 | 当前固件版本 |

#### 图表组件

1. **SOC 变化曲线** (时间范围：最近 7 天)
   - X 轴：时间
   - Y 轴：电池电量百分比 (0-100%)
   - 数据源：`positions` + `charges` 表联合查询

2. **状态时间线** (时间范围：最近 24 小时)
   - 显示：驾驶(1)、充电(2)、在线(5)、睡眠(4)、离线(3)、更新(6)
   - 数据源：`drives` + `charging_processes` + `states` + `updates` 表

#### 关键 SQL 参考

```sql
-- 获取最新电池状态
SELECT battery_level, date, ideal_battery_range_km, rated_battery_range_km, 
       odometer, inside_temp, outside_temp, latitude, longitude
FROM positions
WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL
ORDER BY date DESC
LIMIT 1;

-- 获取当前充电状态
SELECT cp.id, cp.charge_energy_added, c.charger_power, c.charger_voltage
FROM charging_processes cp
LEFT JOIN charges c ON cp.id = c.charging_process_id
WHERE cp.car_id = $1 AND cp.end_date IS NULL
ORDER BY c.date DESC
LIMIT 1;
```

---

### 3.2 充电记录列表 (Charges)

#### 功能描述
展示所有充电历史记录，支持分页、时间范围筛选和地点筛选。

#### 列表字段

| 字段 | 说明 | 计算方式 |
|------|------|----------|
| 开始时间 | 充电开始时间 | `start_date` |
| 结束时间 | 充电结束时间 | `end_date` |
| 位置 | 充电地点 | `geofence.name` 或 `address` |
| 充电类型 | AC/DC | `charger_phases IS NULL → DC` |
| 时长 | 充电耗时 | `duration_min` (分钟) |
| 充入电量 | 实际充入 | `charge_energy_added` (kWh) |
| 起始电量 | 充电前 SOC | `start_battery_level` (%) |
| 结束电量 | 充电后 SOC | `end_battery_level` (%) |
| 增加续航 | 续航增加量 | `end_range - start_range` |
| 费用 | 充电费用 | `cost` (可选) |
| 充电效率 | 能量利用率 | `charge_energy_added / charge_energy_used` |

#### 筛选条件

- 时间范围：开始日期 ~ 结束日期
- 地点：按地理围栏或地址关键字筛选
- 充电类型：AC / DC / 全部

#### 分页参数

- 默认每页：20 条
- 排序：按开始时间倒序

#### 关键 SQL 参考

```sql
SELECT
    cp.id,
    cp.start_date,
    cp.end_date,
    COALESCE(g.name, CONCAT_WS(', ', a.road, a.house_number, a.city)) AS location,
    CASE WHEN mode() WITHIN GROUP (ORDER BY c.charger_phases) IS NULL THEN 'DC' ELSE 'AC' END AS charge_type,
    cp.duration_min,
    cp.charge_energy_added,
    cp.charge_energy_used,
    cp.start_battery_level,
    cp.end_battery_level,
    (cp.end_ideal_range_km - cp.start_ideal_range_km) AS range_added,
    cp.cost,
    cp.outside_temp_avg
FROM charging_processes cp
LEFT JOIN charges c ON cp.id = c.charging_process_id
LEFT JOIN positions p ON p.id = cp.position_id
LEFT JOIN addresses a ON a.id = cp.address_id
LEFT JOIN geofences g ON g.id = cp.geofence_id
WHERE cp.car_id = $1 
  AND cp.start_date >= $2 AND cp.start_date <= $3
GROUP BY cp.id, g.name, a.road, a.house_number, a.city
ORDER BY cp.start_date DESC
LIMIT $4 OFFSET $5;
```

---

### 3.3 充电详情 (Charge Details)

#### 功能描述
展示单次充电过程的详细数据和多维度曲线图表。

#### 统计卡片

| 指标 | 说明 |
|------|------|
| 充入电量 | `charge_energy_added` kWh |
| 使用电量 | `charge_energy_used` kWh |
| 充电效率 | `charge_energy_added / charge_energy_used × 100%` |
| 充电时长 | `duration_min` 分钟 |
| 起始 SOC | `start_battery_level` % |
| 结束 SOC | `end_battery_level` % |
| 平均功率 | `charge_energy_added / (duration_min / 60)` kW |
| 室外温度 | `outside_temp_avg` °C |

#### 图表组件

1. **充电功率曲线**
   - X 轴：时间
   - Y 轴：功率 (kW)
   - 数据源：`charges.charger_power`

2. **电池电量曲线**
   - X 轴：时间
   - Y 轴：SOC (%)
   - 数据源：`charges.battery_level`

3. **电压/电流曲线**
   - X 轴：时间
   - Y 轴 (双轴)：电压 (V) / 电流 (A)
   - 数据源：`charges.charger_voltage`, `charges.charger_actual_current`

4. **SOC vs 功率散点图**
   - X 轴：SOC (%)
   - Y 轴：功率 (kW)
   - 展示充电功率随 SOC 的变化趋势

5. **充电位置地图**
   - 显示充电地点标记
   - 数据源：`positions.latitude/longitude`

#### 关键 SQL 参考

```sql
-- 充电曲线数据
SELECT
    date,
    battery_level,
    charger_power,
    charger_voltage,
    charger_actual_current,
    charger_phases,
    outside_temp,
    ideal_battery_range_km,
    rated_battery_range_km
FROM charges c
JOIN charging_processes cp ON cp.id = c.charging_process_id
WHERE cp.id = $1
ORDER BY date ASC;

-- 充电统计信息
SELECT
    charge_energy_added,
    charge_energy_used,
    duration_min,
    start_battery_level,
    end_battery_level,
    outside_temp_avg,
    cost
FROM charging_processes
WHERE id = $1;
```

---

### 3.4 驾驶记录列表 (Drives)

#### 功能描述
展示所有驾驶行程历史记录，支持分页、时间范围筛选和地点筛选。

#### 列表字段

| 字段 | 说明 | 计算方式 |
|------|------|----------|
| 开始时间 | 行程开始时间 | `start_date` |
| 起点 | 出发地址 | `start_geofence.name` 或 `start_address` |
| 终点 | 到达地址 | `end_geofence.name` 或 `end_address` |
| 时长 | 行程耗时 | `duration_min` (分钟) |
| 距离 | 行驶距离 | `distance` (km/mi) |
| 平均速度 | 平均车速 | `distance / duration_min × 60` |
| 最高速度 | 最高车速 | `speed_max` |
| 起始电量 | 出发时 SOC | `start_position.battery_level` |
| 结束电量 | 到达时 SOC | `end_position.battery_level` |
| 能耗 | 消耗电量 | `range_diff × car.efficiency` (kWh) |
| 能耗率 | 每公里能耗 | `能耗 / 距离 × 1000` (Wh/km) |

#### 筛选条件

- 时间范围：开始日期 ~ 结束日期
- 地点：按起点或终点关键字筛选
- 最小距离：过滤短途行程

#### 关键 SQL 参考

```sql
SELECT
    d.id,
    d.start_date,
    d.end_date,
    COALESCE(sg.name, CONCAT_WS(', ', sa.road, sa.house_number, sa.city)) AS start_address,
    COALESCE(eg.name, CONCAT_WS(', ', ea.road, ea.house_number, ea.city)) AS end_address,
    d.duration_min,
    d.distance,
    d.speed_max,
    sp.battery_level AS start_battery_level,
    ep.battery_level AS end_battery_level,
    (d.start_ideal_range_km - d.end_ideal_range_km) AS range_diff,
    (d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency AS consumption_kwh,
    d.outside_temp_avg
FROM drives d
LEFT JOIN positions sp ON sp.id = d.start_position_id
LEFT JOIN positions ep ON ep.id = d.end_position_id
LEFT JOIN addresses sa ON sa.id = d.start_address_id
LEFT JOIN addresses ea ON ea.id = d.end_address_id
LEFT JOIN geofences sg ON sg.id = d.start_geofence_id
LEFT JOIN geofences eg ON eg.id = d.end_geofence_id
LEFT JOIN cars c ON c.id = d.car_id
WHERE d.car_id = $1 
  AND d.start_date >= $2 AND d.start_date <= $3
  AND d.distance >= $4
ORDER BY d.start_date DESC
LIMIT $5 OFFSET $6;
```

---

### 3.5 驾驶详情 (Drive Details)

#### 功能描述
展示单次驾驶行程的详细数据、轨迹地图和多维度曲线图表。

#### 统计卡片

| 指标 | 说明 |
|------|------|
| 行驶距离 | `distance` km |
| 行驶时长 | `duration_min` 分钟 |
| 平均速度 | `distance / duration × 60` km/h |
| 最高速度 | `speed_max` km/h |
| 能耗 | `range_diff × efficiency` kWh |
| 能耗率 | `能耗 / 距离 × 1000` Wh/km |
| 起始 SOC | `start_battery_level` % |
| 结束 SOC | `end_battery_level` % |
| 海拔上升 | `ascent` m |
| 海拔下降 | `descent` m |
| 室外温度 | `outside_temp_avg` °C |

#### 图表组件

1. **驾驶轨迹地图**
   - 使用高德地图展示完整行驶路线
   - 标记起点和终点
   - 数据源：`positions.latitude/longitude`

2. **速度曲线**
   - X 轴：时间
   - Y 轴：速度 (km/h)
   - 数据源：`positions.speed`

3. **功率曲线**
   - X 轴：时间
   - Y 轴：功率 (kW)
   - 正值为耗电，负值为能量回收
   - 数据源：`positions.power`

4. **电池电量曲线**
   - X 轴：时间
   - Y 轴：SOC (%) / 可用 SOC (%)
   - 数据源：`positions.battery_level`, `usable_battery_level`

5. **海拔曲线**
   - X 轴：时间
   - Y 轴：海拔 (m)
   - 数据源：`positions.elevation`

6. **温度曲线**
   - X 轴：时间
   - Y 轴：温度 (°C)
   - 包含：室外温度、室内温度、空调设定温度
   - 数据源：`positions.outside_temp`, `inside_temp`, `driver_temp_setting`

7. **速度分布直方图**
   - X 轴：速度区间 (每 10 km/h)
   - Y 轴：时间占比 (%)

#### 关键 SQL 参考

```sql
-- 驾驶轨迹和曲线数据
SELECT
    date,
    latitude,
    longitude,
    speed,
    power,
    battery_level,
    usable_battery_level,
    elevation,
    outside_temp,
    inside_temp,
    ideal_battery_range_km,
    rated_battery_range_km
FROM positions
WHERE drive_id = $1
ORDER BY date ASC;

-- 驾驶统计信息
SELECT
    d.distance,
    d.duration_min,
    d.speed_max,
    d.outside_temp_avg,
    d.start_ideal_range_km,
    d.end_ideal_range_km,
    c.efficiency,
    sp.battery_level AS start_battery_level,
    ep.battery_level AS end_battery_level,
    sp.latitude AS start_lat, sp.longitude AS start_lng,
    ep.latitude AS end_lat, ep.longitude AS end_lng
FROM drives d
JOIN cars c ON c.id = d.car_id
JOIN positions sp ON sp.id = d.start_position_id
JOIN positions ep ON ep.id = d.end_position_id
WHERE d.id = $1;
```

---

### 3.6 系统设置 (Settings)

#### 功能描述
配置 API 连接信息、主题风格和单位系统。

#### 配置项

| 配置项 | 类型 | 说明 | 存储位置 |
|--------|------|------|----------|
| API Base URL | 文本输入 | 后端 API 地址 | LocalStorage |
| API Key | 密码输入 | 鉴权密钥 | LocalStorage |
| 主题风格 | 下拉选择 | 赛博朋克/暗色/浅色 | LocalStorage |
| 长度单位 | 开关切换 | km / mi | LocalStorage + API |
| 温度单位 | 开关切换 | °C / °F | LocalStorage + API |
| 续航显示 | 下拉选择 | 理想续航 / 额定续航 | LocalStorage + API |

#### 主题配色方案

系统预设 5 套主题配色方案，用户可通过设置页切换。每套主题包含完整的颜色变量定义：

##### 1. 赛博朋克 (Cyberpunk) - 默认主题

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-primary` | `#00FFFF` | 主色调（青色霓虹） |
| `--color-secondary` | `#FF00FF` | 辅助色（品红霓虹） |
| `--color-accent` | `#FFFF00` | 强调色（黄色霓虹） |
| `--color-bg-primary` | `#0D0D1A` | 主背景色（深紫黑） |
| `--color-bg-secondary` | `#1A1A2E` | 次级背景色 |
| `--color-bg-card` | `#16162A` | 卡片背景色 |
| `--color-text-primary` | `#FFFFFF` | 主文字色 |
| `--color-text-secondary` | `#A0A0B0` | 次级文字色 |
| `--color-border` | `#2A2A4A` | 边框色 |
| `--color-success` | `#00FF88` | 成功状态（绿色霓虹） |
| `--color-warning` | `#FFB800` | 警告状态（橙黄色） |
| `--color-error` | `#FF4444` | 错误状态（红色） |
| `--color-charging` | `#00FF88` | 充电状态色 |
| `--color-driving` | `#00BFFF` | 驾驶状态色 |

**图表配色序列：**
```
['#00FFFF', '#FF00FF', '#FFFF00', '#00FF88', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
```

##### 2. 特斯拉红 (Tesla Red)

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-primary` | `#E31937` | 主色调（特斯拉红） |
| `--color-secondary` | `#CC0000` | 辅助色（深红） |
| `--color-accent` | `#FF4D4D` | 强调色（亮红） |
| `--color-bg-primary` | `#0F0F0F` | 主背景色（纯黑） |
| `--color-bg-secondary` | `#1A1A1A` | 次级背景色 |
| `--color-bg-card` | `#242424` | 卡片背景色 |
| `--color-text-primary` | `#FFFFFF` | 主文字色 |
| `--color-text-secondary` | `#9CA3AF` | 次级文字色 |
| `--color-border` | `#333333` | 边框色 |
| `--color-success` | `#22C55E` | 成功状态 |
| `--color-warning` | `#F59E0B` | 警告状态 |
| `--color-error` | `#EF4444` | 错误状态 |
| `--color-charging` | `#22C55E` | 充电状态色 |
| `--color-driving` | `#E31937` | 驾驶状态色 |

**图表配色序列：**
```
['#E31937', '#FF4D4D', '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6']
```

##### 3. 深空灰 (Space Gray)

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-primary` | `#3B82F6` | 主色调（蓝色） |
| `--color-secondary` | `#6366F1` | 辅助色（靛蓝） |
| `--color-accent` | `#8B5CF6` | 强调色（紫色） |
| `--color-bg-primary` | `#111827` | 主背景色（深灰蓝） |
| `--color-bg-secondary` | `#1F2937` | 次级背景色 |
| `--color-bg-card` | `#374151` | 卡片背景色 |
| `--color-text-primary` | `#F9FAFB` | 主文字色 |
| `--color-text-secondary` | `#9CA3AF` | 次级文字色 |
| `--color-border` | `#4B5563` | 边框色 |
| `--color-success` | `#10B981` | 成功状态 |
| `--color-warning` | `#F59E0B` | 警告状态 |
| `--color-error` | `#EF4444` | 错误状态 |
| `--color-charging` | `#10B981` | 充电状态色 |
| `--color-driving` | `#3B82F6` | 驾驶状态色 |

**图表配色序列：**
```
['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
```

##### 4. 极光绿 (Aurora Green)

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-primary` | `#10B981` | 主色调（翡翠绿） |
| `--color-secondary` | `#059669` | 辅助色（深绿） |
| `--color-accent` | `#34D399` | 强调色（亮绿） |
| `--color-bg-primary` | `#0F172A` | 主背景色（深蓝黑） |
| `--color-bg-secondary` | `#1E293B` | 次级背景色 |
| `--color-bg-card` | `#334155` | 卡片背景色 |
| `--color-text-primary` | `#F1F5F9` | 主文字色 |
| `--color-text-secondary` | `#94A3B8` | 次级文字色 |
| `--color-border` | `#475569` | 边框色 |
| `--color-success` | `#22C55E` | 成功状态 |
| `--color-warning` | `#FBBF24` | 警告状态 |
| `--color-error` | `#F87171` | 错误状态 |
| `--color-charging` | `#22C55E` | 充电状态色 |
| `--color-driving` | `#10B981` | 驾驶状态色 |

**图表配色序列：**
```
['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#84CC16']
```

##### 5. 浅色模式 (Light Mode)

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-primary` | `#2563EB` | 主色调（蓝色） |
| `--color-secondary` | `#4F46E5` | 辅助色（靛蓝） |
| `--color-accent` | `#7C3AED` | 强调色（紫色） |
| `--color-bg-primary` | `#FFFFFF` | 主背景色（白色） |
| `--color-bg-secondary` | `#F3F4F6` | 次级背景色 |
| `--color-bg-card` | `#FFFFFF` | 卡片背景色 |
| `--color-text-primary` | `#111827` | 主文字色 |
| `--color-text-secondary` | `#6B7280` | 次级文字色 |
| `--color-border` | `#E5E7EB` | 边框色 |
| `--color-success` | `#059669` | 成功状态 |
| `--color-warning` | `#D97706` | 警告状态 |
| `--color-error` | `#DC2626` | 错误状态 |
| `--color-charging` | `#059669` | 充电状态色 |
| `--color-driving` | `#2563EB` | 驾驶状态色 |

**图表配色序列：**
```
['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0891B2', '#65A30D']
```

##### 主题切换实现

**CSS 变量定义（Tailwind CSS）：**

```css
/* themes.css */
:root {
  /* 默认使用赛博朋克主题 */
  --color-primary: #00FFFF;
  --color-secondary: #FF00FF;
  /* ... 其他变量 */
}

[data-theme="tesla-red"] {
  --color-primary: #E31937;
  --color-secondary: #CC0000;
  /* ... */
}

[data-theme="space-gray"] {
  --color-primary: #3B82F6;
  --color-secondary: #6366F1;
  /* ... */
}

[data-theme="aurora-green"] {
  --color-primary: #10B981;
  --color-secondary: #059669;
  /* ... */
}

[data-theme="light"] {
  --color-primary: #2563EB;
  --color-secondary: #4F46E5;
  /* ... */
}
```

**React 主题切换 Hook：**

```typescript
// useTheme.ts
type ThemeType = 'cyberpunk' | 'tesla-red' | 'space-gray' | 'aurora-green' | 'light';

const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(() => 
    (localStorage.getItem('theme') as ThemeType) || 'cyberpunk'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
```

**ECharts 主题配置：**

```typescript
// chartThemes.ts
export const chartThemes: Record<ThemeType, object> = {
  cyberpunk: {
    color: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF88', '#FF6B6B', '#4ECDC4'],
    backgroundColor: 'transparent',
    textStyle: { color: '#FFFFFF' },
    // ...
  },
  // 其他主题配置...
};
```

##### 主题总览表

| 主题 | 标识 | 主色调 | 背景色 | 风格描述 |
|------|------|--------|--------|----------|
| 赛博朋克 | `cyberpunk` | `#00FFFF` | `#0D0D1A` | 霓虹灯风格，科技感强 |
| 特斯拉红 | `tesla-red` | `#E31937` | `#0F0F0F` | 经典特斯拉品牌色 |
| 深空灰 | `space-gray` | `#3B82F6` | `#111827` | 专业商务风格 |
| 极光绿 | `aurora-green` | `#10B981` | `#0F172A` | 清新自然风格 |
| 浅色模式 | `light` | `#2563EB` | `#FFFFFF` | 明亮护眼模式 |

---

## 第四部分：API 接口设计

### 4.1 接口总览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/cars` | GET | 获取车辆列表 |
| `/api/cars/:id/overview` | GET | 获取车辆概览数据 |
| `/api/cars/:id/soc-history` | GET | 获取 SOC 历史曲线 |
| `/api/cars/:id/state-timeline` | GET | 获取状态时间线 |
| `/api/charges` | GET | 获取充电记录列表 |
| `/api/charges/:id` | GET | 获取充电详情 |
| `/api/charges/:id/curve` | GET | 获取充电曲线数据 |
| `/api/drives` | GET | 获取驾驶记录列表 |
| `/api/drives/:id` | GET | 获取驾驶详情 |
| `/api/drives/:id/positions` | GET | 获取驾驶轨迹数据 |
| `/api/settings` | GET/PUT | 获取/更新设置 |

### 4.2 通用规范

#### 请求头

```
X-API-KEY: <your-api-key>
Content-Type: application/json
```

#### 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 401 | API Key 无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 4.3 接口详情

#### GET /api/cars

获取车辆列表。

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "cars": [
      {
        "id": 1,
        "name": "Model 3",
        "model": "model3",
        "vin": "5YJ3E1EA1LF******",
        "efficiency": 0.153
      }
    ]
  }
}
```

#### GET /api/cars/:id/overview

获取车辆概览数据。

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "battery_level": 75,
    "ideal_range_km": 380,
    "rated_range_km": 350,
    "odometer_km": 45678.5,
    "state": "asleep",
    "latitude": 31.2304,
    "longitude": 121.4737,
    "address": "上海市浦东新区XX路XX号",
    "inside_temp_c": 22.5,
    "outside_temp_c": 18.0,
    "software_version": "2024.8.9",
    "is_charging": false,
    "charger_power_kw": null,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/charges

获取充电记录列表。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| car_id | int | 是 | 车辆 ID |
| start_date | string | 否 | 开始日期 (ISO8601) |
| end_date | string | 否 | 结束日期 (ISO8601) |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "total": 156,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 123,
        "start_date": "2024-01-15T20:30:00Z",
        "end_date": "2024-01-15T23:45:00Z",
        "location": "家",
        "charge_type": "AC",
        "duration_min": 195,
        "charge_energy_added_kwh": 35.5,
        "start_battery_level": 25,
        "end_battery_level": 80,
        "range_added_km": 180,
        "cost": 28.5,
        "efficiency": 0.92
      }
    ]
  }
}
```

#### GET /api/charges/:id/curve

获取充电曲线数据。

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "summary": {
      "charge_energy_added_kwh": 35.5,
      "charge_energy_used_kwh": 38.6,
      "efficiency": 0.92,
      "duration_min": 195,
      "start_battery_level": 25,
      "end_battery_level": 80,
      "avg_power_kw": 10.9,
      "outside_temp_avg_c": 15.5
    },
    "position": {
      "latitude": 31.2304,
      "longitude": 121.4737
    },
    "curve": [
      {
        "time": "2024-01-15T20:30:00Z",
        "battery_level": 25,
        "charger_power_kw": 11.0,
        "charger_voltage_v": 220,
        "charger_current_a": 50,
        "outside_temp_c": 15.5,
        "range_km": 120
      }
    ]
  }
}
```

#### GET /api/drives/:id/positions

获取驾驶轨迹数据。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sample | int | 否 | 数据采样间隔，默认 1（不采样） |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "summary": {
      "distance_km": 45.6,
      "duration_min": 52,
      "avg_speed_kmh": 52.6,
      "max_speed_kmh": 120,
      "consumption_kwh": 7.8,
      "efficiency_wh_km": 171,
      "start_battery_level": 80,
      "end_battery_level": 65,
      "outside_temp_avg_c": 22.5,
      "start_address": "上海市浦东新区XX路",
      "end_address": "上海市徐汇区XX路"
    },
    "positions": [
      {
        "time": "2024-01-15T08:00:00Z",
        "latitude": 31.2304,
        "longitude": 121.4737,
        "speed_kmh": 0,
        "power_kw": 0,
        "battery_level": 80,
        "elevation_m": 4,
        "outside_temp_c": 22.5
      }
    ]
  }
}
```

---

## 第五部分：数据模型

### 5.1 TeslaMate 核心表结构

#### cars 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 车辆 ID |
| name | varchar | 车辆名称 |
| model | varchar | 车型 |
| vin | varchar | 车架号 |
| efficiency | decimal | 能效系数 (kWh/km) |

#### positions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 位置记录 ID |
| car_id | int | 车辆 ID |
| date | timestamp | 记录时间 |
| latitude | decimal | 纬度 |
| longitude | decimal | 经度 |
| speed | int | 速度 (km/h) |
| power | int | 功率 (kW) |
| battery_level | int | 电池电量 (%) |
| usable_battery_level | int | 可用电量 (%) |
| ideal_battery_range_km | decimal | 理想续航 (km) |
| rated_battery_range_km | decimal | 额定续航 (km) |
| odometer | decimal | 里程表 (km) |
| elevation | int | 海拔 (m) |
| inside_temp | decimal | 车内温度 (°C) |
| outside_temp | decimal | 车外温度 (°C) |
| drive_id | int | 关联的驾驶记录 ID |

#### charging_processes 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 充电过程 ID |
| car_id | int | 车辆 ID |
| start_date | timestamp | 开始时间 |
| end_date | timestamp | 结束时间 |
| charge_energy_added | decimal | 充入电量 (kWh) |
| charge_energy_used | decimal | 使用电量 (kWh) |
| start_battery_level | int | 起始电量 (%) |
| end_battery_level | int | 结束电量 (%) |
| duration_min | int | 充电时长 (分钟) |
| outside_temp_avg | decimal | 平均室外温度 (°C) |
| position_id | int | 位置 ID |
| address_id | int | 地址 ID |
| geofence_id | int | 地理围栏 ID |
| cost | decimal | 费用 |

#### charges 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 记录 ID |
| charging_process_id | int | 充电过程 ID |
| date | timestamp | 记录时间 |
| battery_level | int | 电池电量 (%) |
| charger_power | int | 充电功率 (kW) |
| charger_voltage | int | 电压 (V) |
| charger_actual_current | int | 实际电流 (A) |
| charger_phases | int | 相数 |
| charge_energy_added | decimal | 累计充入电量 (kWh) |
| outside_temp | decimal | 室外温度 (°C) |

#### drives 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 驾驶记录 ID |
| car_id | int | 车辆 ID |
| start_date | timestamp | 开始时间 |
| end_date | timestamp | 结束时间 |
| distance | decimal | 距离 (km) |
| duration_min | int | 时长 (分钟) |
| speed_max | int | 最高速度 (km/h) |
| power_max | int | 最大功率 (kW) |
| start_position_id | int | 起始位置 ID |
| end_position_id | int | 结束位置 ID |
| start_address_id | int | 起始地址 ID |
| end_address_id | int | 结束地址 ID |
| start_geofence_id | int | 起始围栏 ID |
| end_geofence_id | int | 结束围栏 ID |
| outside_temp_avg | decimal | 平均室外温度 (°C) |

### 5.2 单位转换函数

后端需实现以下单位转换工具函数：

```go
// 公里 <-> 英里
func ConvertKm(value float64, unit string) float64 {
    if unit == "mi" {
        return value * 0.621371
    }
    return value
}

// 摄氏度 <-> 华氏度
func ConvertCelsius(value float64, unit string) float64 {
    if unit == "F" {
        return value*1.8 + 32
    }
    return value
}

// 米 <-> 英尺
func ConvertMeter(value float64, unit string) float64 {
    if unit == "ft" {
        return value * 3.28084
    }
    return value
}
```

---

## 第六部分：前端组件设计

### 6.1 UI 设计规范

#### 整体风格

采用 **渐变毛玻璃（Glassmorphism）** 设计风格，结合现代感与科技感：

- **毛玻璃效果**：使用 `backdrop-filter: blur()` 实现半透明模糊背景
- **渐变色彩**：主色调渐变增强视觉层次感
- **柔和阴影**：多层阴影营造悬浮感
- **圆角设计**：统一圆角半径，界面更加柔和

#### 毛玻璃效果 CSS 实现

```css
/* 毛玻璃卡片基础样式 */
.glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 深色主题毛玻璃 */
[data-theme="cyberpunk"] .glass-card,
[data-theme="tesla-red"] .glass-card,
[data-theme="space-gray"] .glass-card,
[data-theme="aurora-green"] .glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

/* 浅色主题毛玻璃 */
[data-theme="light"] .glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* 主色渐变背景 */
.gradient-bg {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );
}

/* 霓虹发光效果（赛博朋克主题） */
[data-theme="cyberpunk"] .neon-glow {
  box-shadow: 
    0 0 5px var(--color-primary),
    0 0 10px var(--color-primary),
    0 0 20px var(--color-primary);
}
```

#### 设计规范参数

| 参数 | 值 | 说明 |
|------|------|------|
| 圆角（小） | `8px` | 按钮、输入框、小卡片 |
| 圆角（中） | `12px` | 普通卡片、弹窗 |
| 圆角（大） | `16px` | 大卡片、主容器 |
| 圆角（圆形） | `9999px` | 标签、徽章 |
| 模糊强度 | `10px` | 标准毛玻璃效果 |
| 边框透明度 | `18%` | 毛玻璃边框 |
| 阴影 | `0 8px 32px` | 卡片悬浮阴影 |

### 6.2 导航结构（Tab 布局）

应用采用 **底部 Tab 导航**（移动端）和 **侧边导航**（PC端）的响应式布局：

#### Tab 定义

| Tab | 图标 | 路由 | 包含页面 |
|-----|------|------|----------|
| 首页 | `Home` | `/` | Overview（概览页） |
| 充电 | `Battery` | `/charges` | Charges（列表）→ ChargeDetail（详情） |
| 驾驶 | `Car` | `/drives` | Drives（列表）→ DriveDetail（详情） |
| 设置 | `Settings` | `/settings` | Settings（设置页） |

#### 导航组件结构

```
┌─────────────────────────────────────────────────────────────┐
│  PC 端布局 (≥1024px)                                         │
│  ┌──────────┬──────────────────────────────────────────────┐│
│  │          │  ┌─────────────────────────────────────────┐ ││
│  │  侧边栏   │  │              顶部栏                      │ ││
│  │          │  │  Logo    车辆选择器    状态    用户      │ ││
│  │  ○ 首页  │  └─────────────────────────────────────────┘ ││
│  │  ○ 充电  │  ┌─────────────────────────────────────────┐ ││
│  │  ○ 驾驶  │  │                                         │ ││
│  │  ○ 设置  │  │              主内容区                    │ ││
│  │          │  │                                         │ ││
│  │          │  │                                         │ ││
│  │          │  └─────────────────────────────────────────┘ ││
│  └──────────┴──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  移动端布局 (<1024px)                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              顶部栏                                      ││
│  │  Logo         车辆选择器              状态图标           ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                                                         ││
│  │                     主内容区                             ││
│  │                   (可滚动区域)                           ││
│  │                                                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │    🏠        🔋        🚗        ⚙️                     ││
│  │   首页      充电      驾驶      设置                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 6.3 响应式布局规范

#### 断点定义

| 断点名称 | 宽度范围 | 典型设备 | 布局模式 |
|----------|----------|----------|----------|
| `xs` | `< 480px` | 小屏手机 | 单列布局，底部 Tab |
| `sm` | `480px - 767px` | 大屏手机 | 单列布局，底部 Tab |
| `md` | `768px - 1023px` | 平板 | 双列布局，底部 Tab |
| `lg` | `1024px - 1279px` | 小屏电脑 | 多列布局，侧边导航 |
| `xl` | `≥ 1280px` | 大屏电脑 | 多列布局，侧边导航 |

#### Tailwind CSS 断点配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

#### 响应式布局规则

**卡片网格布局：**

| 断点 | 首页概览卡片 | 充电/驾驶列表 | 详情页图表 |
|------|-------------|--------------|-----------|
| `xs/sm` | 1 列 | 1 列（卡片式） | 1 列 |
| `md` | 2 列 | 1 列（卡片式） | 1 列 |
| `lg` | 3 列 | 表格式 | 2 列 |
| `xl` | 4 列 | 表格式 | 2 列 |

**组件响应式行为：**

```typescript
// 响应式 Grid 示例
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 数据卡片 */}
</div>

// 响应式表格/卡片切换
<div className="hidden lg:block">
  <Table data={charges} />  {/* PC端显示表格 */}
</div>
<div className="lg:hidden">
  <CardList data={charges} />  {/* 移动端显示卡片列表 */}
</div>
```

#### 触摸优化（移动端）

| 元素 | 最小尺寸 | 说明 |
|------|----------|------|
| 按钮 | `44px × 44px` | Apple HIG 推荐触摸目标 |
| 列表项 | `48px` 高度 | 便于手指点击 |
| Tab 图标 | `24px × 24px` | 加上内边距达到 44px |
| 输入框 | `48px` 高度 | 便于输入 |

### 6.4 页面结构

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # 应用主布局（响应式容器）
│   │   ├── Sidebar.tsx         # PC端侧边导航
│   │   ├── BottomNav.tsx       # 移动端底部Tab导航
│   │   ├── Header.tsx          # 顶部栏（Logo + 车辆选择器）
│   │   └── PageContainer.tsx   # 页面内容容器
│   ├── common/
│   │   ├── GlassCard.tsx       # 毛玻璃卡片组件
│   │   ├── StatCard.tsx        # 数据统计卡片
│   │   ├── Table.tsx           # 数据表格（PC端）
│   │   ├── CardList.tsx        # 卡片列表（移动端）
│   │   ├── Pagination.tsx      # 分页组件
│   │   ├── DateRangePicker.tsx # 日期范围选择器
│   │   ├── CarSelector.tsx     # 车辆选择下拉框
│   │   └── Loading.tsx         # 加载状态骨架屏
│   ├── charts/
│   │   ├── LineChart.tsx       # 折线图（ECharts 封装）
│   │   ├── AreaChart.tsx       # 面积图
│   │   ├── BarChart.tsx        # 柱状图
│   │   ├── GaugeChart.tsx      # 仪表盘（电量显示）
│   │   └── TimelineChart.tsx   # 状态时间线图
│   └── map/
│       └── TrackMap.tsx        # 轨迹地图（高德地图封装）
├── pages/
│   ├── Home/
│   │   └── index.tsx           # 首页概览
│   ├── Charges/
│   │   ├── index.tsx           # 充电列表
│   │   └── [id].tsx            # 充电详情
│   ├── Drives/
│   │   ├── index.tsx           # 驾驶列表
│   │   └── [id].tsx            # 驾驶详情
│   └── Settings/
│       └── index.tsx           # 系统设置
├── hooks/
│   ├── useTheme.ts             # 主题切换 Hook
│   ├── useResponsive.ts        # 响应式断点检测 Hook
│   └── useCar.ts               # 当前车辆状态 Hook
├── services/
│   └── api.ts                  # API 请求封装
├── store/
│   ├── carStore.ts             # 车辆状态（Zustand）
│   └── settingsStore.ts        # 设置状态（Zustand）
├── styles/
│   ├── globals.css             # 全局样式
│   ├── themes.css              # 主题变量定义
│   └── glass.css               # 毛玻璃效果样式
├── types/
│   └── index.ts                # TypeScript 类型定义
└── utils/
    ├── format.ts               # 格式化工具（日期、数字）
    └── unit.ts                 # 单位转换工具
```

### 6.5 核心组件说明

#### AppLayout 组件

应用主布局容器，实现响应式导航切换：

```tsx
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {isDesktop ? (
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64">
            <Header />
            <PageContainer>{children}</PageContainer>
          </main>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-auto pb-16">
            <PageContainer>{children}</PageContainer>
          </main>
          <BottomNav />
        </div>
      )}
    </div>
  );
};
```

#### GlassCard 组件

毛玻璃效果卡片，支持渐变边框：

```tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;  // 是否启用渐变边框
  glow?: boolean;      // 是否启用发光效果
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className,
  gradient = false,
  glow = false 
}) => (
  <div className={cn(
    'glass-card p-4 transition-all duration-300',
    gradient && 'gradient-border',
    glow && 'neon-glow',
    className
  )}>
    {children}
  </div>
);
```

#### BottomNav 组件

移动端底部导航栏：

```tsx
const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/charges', icon: Battery, label: '充电' },
  { path: '/drives', icon: Car, label: '驾驶' },
  { path: '/settings', icon: Settings, label: '设置' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-[var(--color-border)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full',
              'transition-colors duration-200',
              location.pathname === tab.path
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)]'
            )}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
```

#### StatCard 组件

数据统计卡片，用于首页概览：

```tsx
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon, label, value, unit, trend, trendValue
}) => (
  <GlassCard className="flex items-center gap-4">
    <div className="p-3 rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
    {trend && (
      <div className={cn(
        'text-sm',
        trend === 'up' && 'text-[var(--color-success)]',
        trend === 'down' && 'text-[var(--color-error)]'
      )}>
        {trendValue}
      </div>
    )}
  </GlassCard>
);
```

#### LineChart 组件

基于 ECharts 的折线图，自动适配主题：

```tsx
const LineChart: React.FC<LineChartProps> = ({ data, xField, yFields, ... }) => {
  const { theme } = useTheme();
  const chartTheme = chartThemes[theme];
  
  const option = useMemo(() => ({
    ...chartTheme,
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'time', data: data.map(d => d[xField]) },
    yAxis: { type: 'value' },
    series: yFields.map((field, i) => ({
      name: field.label,
      type: 'line',
      smooth: true,
      data: data.map(d => d[field.key]),
      itemStyle: { color: chartTheme.color[i] },
      areaStyle: field.area ? { opacity: 0.3 } : undefined,
    })),
    tooltip: { trigger: 'axis' },
  }), [data, theme]);

  return <ReactECharts option={option} style={{ height: '300px' }} />;
};
```

#### TrackMap 组件

基于高德地图的轨迹展示：

- 支持轨迹折线绘制
- 支持起点/终点标记
- 支持轨迹点 Tooltip
- 自动缩放适配轨迹范围

---

## 第七部分：非功能需求

### 7.1 性能要求

| 指标 | 要求 |
|------|------|
| API 响应时间 | P95 < 500ms |
| 首屏加载时间 | < 2s (移动端 3G) |
| 列表数据采样 | 超过 1000 条自动采样 |
| 图表数据点 | 单曲线最大 2000 点 |

### 7.2 兼容性要求

| 平台 | 浏览器 |
|------|--------|
| Desktop | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Mobile | iOS Safari 14+, Android Chrome 90+ |

### 7.3 安全要求

- API Key 传输使用 HTTPS
- 数据库连接只读权限
- 前端配置信息加密存储
- 无敏感数据明文日志

---

## 附录

### A. 参考资料

- [TeslaMate 官方文档](https://docs.teslamate.org/)
- [TeslaMate GitHub](https://github.com/teslamate-org/teslamate)
- [Apache ECharts 文档](https://echarts.apache.org/)
- [高德地图 JS API](https://lbs.amap.com/api/javascript-api-v2/summary)

### B. Grafana 看板 SQL 参考

详见 `teslamate-grafana/` 目录下的 JSON 文件，包含完整的 SQL 查询逻辑。

### C. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2024-01-15 | MVP 初始版本，含 6 个核心页面 |
