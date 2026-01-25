package main

import (
	"log"
	"teslamate-cyberui/internal/config"
	"teslamate-cyberui/internal/handler"
	"teslamate-cyberui/internal/logger"
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

	// 连接数据库
	db, err := repository.NewPostgresDB(cfg.Database)
	if err != nil {
		applog.Fatalf("Failed to connect database: %v", err)
	}
	defer db.Close()

	applog.Info("Database connected successfully")

	// 初始化仓储层
	repo := repository.NewRepository(db)

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
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.Server.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 注册路由
	// Note: the original code had /api/v1, keeping it for now.
	api := r.Group("/api/v1")
	{
		// 车辆相关
		api.GET("/cars", h.GetCars)
		api.GET("/cars/:id/status", h.GetCarStatus)

		// 充电相关
		api.GET("/cars/:id/charges", h.GetCharges)
		api.GET("/charges/:id", h.GetChargeDetail)
		api.GET("/charges/:id/stats", h.GetChargeStats)

		// 驾驶相关
		api.GET("/cars/:id/drives", h.GetDrives)
		api.GET("/drives/:id", h.GetDriveDetail)
		api.GET("/drives/:id/positions", h.GetDrivePositions)

		// 统计相关
		api.GET("/cars/:id/stats/overview", h.GetOverviewStats)
		api.GET("/cars/:id/stats/efficiency", h.GetEfficiencyStats)
		api.GET("/cars/:id/stats/battery", h.GetBatteryStats)
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
