import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('zh-cn');

export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format);
}

export function formatRelativeTime(date: string | Date, language: 'zh' | 'en' = 'zh'): string {
  return dayjs(date).locale(language === 'zh' ? 'zh-cn' : 'en').fromNow();
}

export function formatDuration(minutes: number, language: 'zh' | 'en' = 'zh'): string {
  if (minutes < 60) {
    return `${minutes}${language === 'zh' ? '分钟' : 'm'}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}${language === 'zh' ? '小时' : 'h'}`;
  }
  return `${hours}${language === 'zh' ? '小时' : 'h'}${mins}${language === 'zh' ? '分钟' : 'm'}`;
}

export function formatDistance(km: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatEnergy(kwh: number): string {
  if (kwh < 1) {
    return `${(kwh * 1000).toFixed(0)} Wh`;
  }
  return `${kwh.toFixed(2)} kWh`;
}

export function formatEfficiency(whPerKm: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const whPerMile = whPerKm * 1.60934;
    return `${whPerMile.toFixed(0)} Wh/mi`;
  }
  return `${whPerKm.toFixed(0)} Wh/km`;
}

export function formatTemperature(celsius: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const fahrenheit = celsius * 9 / 5 + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

export function formatSpeed(kmh: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const mph = kmh * 0.621371;
    return `${mph.toFixed(0)} mph`;
  }
  return `${kmh.toFixed(0)} km/h`;
}

export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
