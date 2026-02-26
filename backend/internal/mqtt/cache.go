package mqtt

import (
	"sync"
)

// Cache 存储特斯拉车辆的实时状态，通过 car_id 索引，再通过 topic 索引对应的值
type Cache struct {
	mu   sync.RWMutex
	data map[int16]map[string]string
}

// NewCache 创建一个新的缓存实例
func NewCache() *Cache {
	return &Cache{
		data: make(map[int16]map[string]string),
	}
}

// Set 存入或更新特定车辆特定的 topic 数据
func (c *Cache) Set(carID int16, topic string, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, ok := c.data[carID]; !ok {
		c.data[carID] = make(map[string]string)
	}
	c.data[carID][topic] = value

	// 打印 cache 中的数据更新
	// logger.Infof("Cache updated: CarID=%d, Topic=%s, Value=%s", carID, topic, value)
}

// Get 获取特定车辆特定的 topic 数据
func (c *Cache) Get(carID int16, topic string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	carData, ok := c.data[carID]
	if !ok {
		return "", false
	}
	val, ok := carData[topic]
	return val, ok
}

// GetAllForCar 获取特定车辆的所有缓存数据
func (c *Cache) GetAllForCar(carID int16) map[string]string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	carData, ok := c.data[carID]
	if !ok {
		return nil
	}

	// 浅拷贝返回，防止外部修改 maps 导致并发问题
	result := make(map[string]string, len(carData))
	for k, v := range carData {
		result[k] = v
	}
	return result
}
