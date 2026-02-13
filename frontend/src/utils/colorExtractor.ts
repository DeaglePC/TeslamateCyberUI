/**
 * 从图片中提取主色调，用于自动生成主题色
 * 使用 Canvas 采样 + K-Means 聚类算法
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// 将 RGB 转为 HSL
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

// 将 HSL 转为 hex 字符串
function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  h /= 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 计算两个 RGB 颜色的欧几里得距离
function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

// 简化的 K-Means 聚类，提取主色调
function kMeansClustering(pixels: RGB[], k: number, maxIterations: number = 20): RGB[] {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) return [...pixels];

  // 初始化聚类中心（均匀采样）
  const step = Math.floor(pixels.length / k);
  const centroids: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    // 分配像素到最近聚类
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      clusters[minIdx].push(pixel);
    }

    // 更新聚类中心
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;

      const newCentroid: RGB = {
        r: Math.round(clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length),
        g: Math.round(clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length),
        b: Math.round(clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length),
      };

      if (colorDistance(newCentroid, centroids[i]) > 1) {
        converged = false;
      }
      centroids[i] = newCentroid;
    }

    if (converged) break;
  }

  return centroids;
}

/**
 * 从 base64 图片中提取主色调
 * @param imageBase64 - data:image/xxx;base64,xxx 格式的图片
 * @returns 提取出的主色 hex 值
 */
export function extractDominantColor(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // 缩小尺寸以提高性能
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 收集有效像素（过滤掉太暗和太亮的像素）
        const pixels: RGB[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // 跳过透明像素
          if (a < 128) continue;

          const hsl = rgbToHsl(r, g, b);

          // 过滤掉太暗（l < 0.08）、太亮（l > 0.92）和饱和度极低（s < 0.05）的颜色
          if (hsl.l >= 0.08 && hsl.l <= 0.92 && hsl.s >= 0.05) {
            pixels.push({ r, g, b });
          }
        }

        if (pixels.length === 0) {
          // 如果所有像素都被过滤掉了，使用默认颜色
          resolve('#00f0ff');
          return;
        }

        // K-Means 提取 5 个聚类
        const clusters = kMeansClustering(pixels, 5);

        // 按"鲜艳度"排序：高饱和度 + 中等亮度优先
        const scored = clusters.map((c) => {
          const hsl = rgbToHsl(c.r, c.g, c.b);
          // 评分公式：饱和度权重高，亮度偏好 0.4-0.6 范围
          const lightnessScore = 1 - Math.abs(hsl.l - 0.5) * 2;
          const score = hsl.s * 0.7 + lightnessScore * 0.3;
          return { color: c, hsl, score };
        });

        scored.sort((a, b) => b.score - a.score);

        // 取评分最高的颜色
        const best = scored[0];
        // 调整为适合作为主题色的版本：提高饱和度，调整亮度
        const themePrimary = hslToHex(
          best.hsl.h,
          Math.min(best.hsl.s * 1.3, 1), // 略微提高饱和度
          Math.max(Math.min(best.hsl.l, 0.6), 0.4) // 亮度限制在 0.4-0.6
        );

        resolve(themePrimary);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageBase64;
  });
}

/**
 * 根据主色生成完整的主题色配置
 * @param primaryHex - 主色 hex 值
 * @returns 完整的 ThemeColors 对象所需的颜色值
 */
export function generateThemeFromColor(primaryHex: string) {
  // 解析 hex
  const r = parseInt(primaryHex.slice(1, 3), 16);
  const g = parseInt(primaryHex.slice(3, 5), 16);
  const b = parseInt(primaryHex.slice(5, 7), 16);
  const hsl = rgbToHsl(r, g, b);

  // 主色
  const primary = primaryHex;

  // 辅助色（互补色方向偏移 30 度）
  const accentHue = (hsl.h + 30) % 360;
  const accent = hslToHex(accentHue, Math.min(hsl.s * 1.1, 1), 0.5);

  // 柔和色（降低饱和度和亮度）
  const muted = hslToHex(hsl.h, 0.2, 0.55);

  // 功能色 - 保持语义但受主色影响
  const success = hslToHex(140, 0.7, 0.45);
  const warning = hslToHex(40, 0.85, 0.55);
  const danger = hslToHex(0, 0.75, 0.5);

  // 背景色（主色的极暗版本）
  const bg = hslToHex(hsl.h, Math.min(hsl.s * 0.3, 0.3), 0.04);
  const cardBg = `rgba(${Math.round(r * 0.1)}, ${Math.round(g * 0.1)}, ${Math.round(b * 0.15)}, 0.92)`;
  const border = `rgba(${r}, ${g}, ${b}, 0.3)`;

  // 渐变
  const gradient: [string, string] = [
    `rgba(${r}, ${g}, ${b}, 0.5)`,
    `rgba(${r}, ${g}, ${b}, 0)`,
  ];

  // 时间线颜色（基于主色色相旋转）
  const timeline = {
    driving: hslToHex((hsl.h + 60) % 360, 0.8, 0.5),
    charging: hslToHex(140, 0.7, 0.45),
    offline: hslToHex(hsl.h, 0.1, 0.2),
    asleep: hslToHex(hsl.h, 0.1, 0.2),
    online: primary,
    updating: hslToHex(30, 0.85, 0.55),
  };

  // 图表颜色（基于主色的色相旋转）
  const chart = [
    primary,
    hslToHex((hsl.h + 72) % 360, 0.75, 0.5),
    hslToHex((hsl.h + 144) % 360, 0.7, 0.5),
    hslToHex((hsl.h + 216) % 360, 0.65, 0.5),
    hslToHex((hsl.h + 288) % 360, 0.6, 0.5),
  ];

  return {
    primary,
    muted,
    success,
    warning,
    danger,
    accent,
    bg,
    cardBg,
    border,
    gradient,
    timeline,
    chart,
  };
}
