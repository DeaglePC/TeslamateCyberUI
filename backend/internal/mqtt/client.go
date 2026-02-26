package mqtt

import (
	"crypto/tls"
	"fmt"
	"strconv"
	"strings"
	"time"

	"teslamate-cyberui/internal/config"
	"teslamate-cyberui/internal/logger"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// Client 包含 MQTT 连接和缓存
type Client struct {
	client mqtt.Client
	cache  *Cache
}

// GlobalCache 用于应用内部直接读取全局的车辆缓存 (方便在 Handler 里面读取)
var GlobalCache = NewCache()

// connectHandler 连接成功时的回调
var connectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
	logger.Info("Connected to Teslamate MQTT Broker")
}

// connectionLostHandler 连接丢失时的回调
var connectionLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
	logger.Errorf("Lost connection to Teslamate MQTT Broker: %v", err)
}

// NewClient 初始化并返回新的 MQTT Client
func NewClient(cfg config.MQTTConfig) (*Client, error) {
	broker := fmt.Sprintf("tcp://%s:%s", cfg.Host, cfg.Port)

	opts := mqtt.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetClientID(cfg.ClientID)

	if cfg.Username != "" {
		opts.SetUsername(cfg.Username)
	}
	if cfg.Password != "" {
		opts.SetPassword(cfg.Password)
	}

	opts.SetAutoReconnect(true)
	opts.SetMaxReconnectInterval(10 * time.Second)
	opts.SetPingTimeout(10 * time.Second)
	opts.SetKeepAlive(60 * time.Second)
	// Allow insecure TLS for local instances if they use self-signed certificates
	opts.SetTLSConfig(&tls.Config{InsecureSkipVerify: true})

	opts.OnConnect = connectHandler
	opts.OnConnectionLost = connectionLostHandler

	client := mqtt.NewClient(opts)

	if token := client.Connect(); token.Wait() && token.Error() != nil {
		return nil, fmt.Errorf("MQTT connect error: %v", token.Error())
	}

	return &Client{
		client: client,
		cache:  GlobalCache,
	}, nil
}

// SubscribeCars 为指定的所有的 cars 订阅 teslamate 的 topic
func (c *Client) SubscribeCars(carIDs []int16) {
	for _, id := range carIDs {
		topic := fmt.Sprintf("teslamate/cars/%d/#", id)

		// messagePubHandler 处理收到的所有主题的消息
		var messagePubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
			// topic 格式: teslamate/cars/1/battery_level
			parts := strings.Split(msg.Topic(), "/")
			if len(parts) >= 4 {
				carIDStr := parts[2]
				metric := parts[3]

				carID, err := strconv.ParseInt(carIDStr, 10, 16)
				if err == nil {
					c.cache.Set(int16(carID), metric, string(msg.Payload()))
					// logger.Debugf("MQTT Update Car %d %s: %s", carID, metric, string(msg.Payload()))
				}
			}
		}

		token := c.client.Subscribe(topic, 1, messagePubHandler)
		token.Wait()
		if token.Error() != nil {
			logger.Errorf("Failed to subscribe to MQTT topic %s: %v", topic, token.Error())
		} else {
			logger.Infof("Subscribed to MQTT topic: %s", topic)
		}
	}
}

// Disconnect 断开 MQTT 连接
func (c *Client) Disconnect() {
	if c.client.IsConnected() {
		c.client.Disconnect(250)
		logger.Info("Disconnected from MQTT Broker")
	}
}
