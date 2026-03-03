---
name: tesla-stats
description: Access and analyze Tesla vehicle status, drive statistics, battery degradation, SoC history, and UI settings from a local TeslamateCyberUI server. Use this skill for "real-time status," "SoC history," "efficiency," "UI settings," or "charge history."
metadata: {"openclaw":{"emoji":"🚗","requires":{"bins":["python3"]},"primaryEnv":"TESLA_STATS_API_KEY"}}
---

# Tesla Stats (TeslamateCyberUI)

Full-featured integration for your local Tesla monitoring and UI backend.

## Core Capabilities

- **Real-time Monitoring**: Battery, range, position, climate, and car state.
- **Historical Data**: SoC (State of Charge) history, states timeline (driving/charging/idle).
- **Drive & Charge**: Comprehensive history, speed histograms, GPS tracks, and efficiency.
- **Health & Stats**: Battery degradation tracking and dashboard overviews.
- **UI Management**: Read/update settings, and manage background images.

## Usage Guide

### 1. Vehicle & Status
- **List Cars**: `python3 {baseDir}/scripts/tesla_api.py get_cars`
- **Real-time Status**: `python3 {baseDir}/scripts/tesla_api.py get_car_status '{"id": 1}'`
- **SoC History**: `python3 {baseDir}/scripts/tesla_api.py get_soc_history '{"id": 1, "hours": 24}'`
- **Timeline**: `python3 {baseDir}/scripts/tesla_api.py get_states_timeline '{"id": 1, "hours": 48}'`

### 2. Drive & Charge History
- **Drive History**: `python3 {baseDir}/scripts/tesla_api.py get_drives '{"id": 1, "page": 1}'`
- **Charge Sessions**: `python3 {baseDir}/scripts/tesla_api.py get_charges '{"id": 1}'`
- **Drive Details**: `python3 {baseDir}/scripts/tesla_api.py get_drive_detail '{"id": 123}'`

### 3. UI & Settings
- **Get Settings**: `python3 {baseDir}/scripts/tesla_api.py get_settings`
- **Update Setting**: `python3 {baseDir}/scripts/tesla_api.py update_setting '{"key": "theme", "value": "dark"}'`
- **Background Image**: `python3 {baseDir}/scripts/tesla_api.py get_background_hash`

### 4. System & Auth
- **Test Auth**: `python3 {baseDir}/scripts/tesla_api.py test_auth`

## Environment Variables
- `TESLA_STATS_BASE_URL`: `http://localhost:8080/api/v1`
- `TESLA_STATS_API_KEY`: For Bearer Token.
- `TESLA_X_API_KEY`: For X-API-Key header.

## Notes
- Time-based queries support `from`, `to` (ISO strings), and `hours` (integer).
- If the car ID is unknown, call `get_cars` first or assume `id: 1`.
