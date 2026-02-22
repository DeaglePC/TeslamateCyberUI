package main

import (
	"log"
	"teslamate-cyberui/internal/config"
	"teslamate-cyberui/internal/handler"
	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/middleware"
	"teslamate-cyberui/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化日志
	logger.Init(cfg.Log.Level)
	applog := logger.GetLogger()

	var repo *repository.Repository
	if !cfg.Server.EnableMock {
		// 连接数据库
		db, err := repository.NewPostgresDB(cfg.Database)
		if err != nil {
			applog.Fatalf("Failed to connect database: %v", err)
		}
		defer db.Close()

		applog.Info("Database connected successfully")

		// 初始化仓储层
		repo = repository.NewRepository(db)
	} else {
		applog.Info("Mock data is ENABLED. Skipping database connection.")
	}

	// 初始化处理器
	h := handler.NewHandler(repo)

	// 设置Gin模式
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	r := gin.New()

	// 中间件
	r.Use(gin.Recovery())
	r.Use(logger.GinLogger())

	// CORS配置：如果配置了具体的Origin则使用，否则允许所有
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	// 如果配置了*或没有配置，使用AllowAllOrigins
	if len(cfg.Server.CORSOrigins) == 0 || (len(cfg.Server.CORSOrigins) == 1 && cfg.Server.CORSOrigins[0] == "*") {
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowCredentials = false // AllowAllOrigins和AllowCredentials不能同时为true
	} else {
		corsConfig.AllowOrigins = cfg.Server.CORSOrigins
	}
	r.Use(cors.New(corsConfig))

	// 注册路由
	// Note: the original code had /api/v1, keeping it for now.
	api := r.Group("/api/v1")
	api.Use(middleware.APIKeyAuth(cfg.Server.APIKey))
	if cfg.Server.EnableMock {
		applog.Info("Mock data is ENABLED")
	}
	api.Use(middleware.MockData(cfg.Server.EnableMock))
	{
		// 车辆相关
		api.GET("/cars", h.GetCars)
		api.GET("/cars/:id/status", h.GetCarStatus)

		// 充电相关
		api.GET("/cars/:id/charges", h.GetCharges)
		api.GET("/charges/:id", h.GetChargeDetail)
		api.GET("/charges/:id/stats", h.GetChargeStats)
		api.GET("/cars/:id/charges/stats_summary", h.GetChargeStatsSummary)

		// 驾驶相关
		api.GET("/cars/:id/drives", h.GetDrives)
		api.GET("/cars/:id/drives/stats_summary", h.GetDriveStatsSummary)
		api.GET("/cars/:id/drives/speed_histogram", h.GetSpeedHistogram)
		api.GET("/cars/:id/drives/positions", h.GetAllDrivesPositions)
		api.GET("/drives/:id", h.GetDriveDetail)
		api.GET("/drives/:id/positions", h.GetDrivePositions)
		api.GET("/drives/:id/speed_histogram", h.GetDriveSpeedHistogram)

		// 统计相关
		api.GET("/cars/:id/stats/overview", h.GetOverviewStats)
		api.GET("/cars/:id/stats/efficiency", h.GetEfficiencyStats)
		api.GET("/cars/:id/stats/battery", h.GetBatteryStats)
		api.GET("/cars/:id/stats/soc-history", h.GetSocHistory)
		api.GET("/cars/:id/stats/states-timeline", h.GetStatesTimeline)

		// UI设置相关
		api.GET("/settings", h.GetUISettings)
		api.POST("/settings", h.UpdateUISetting)
		api.PUT("/settings", h.BatchUpdateUISettings)

		// 背景图片相关
		api.GET("/background-image", h.GetBackgroundImage)
		api.POST("/background-image", h.UploadBackgroundImage)
		api.DELETE("/background-image", h.DeleteBackgroundImage)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 启动服务
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	applog.Infof("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		applog.Fatalf("Failed to start server: %v", err)
	}
}
