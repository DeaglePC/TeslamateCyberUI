/**
 * 地理坐标转换工具
 * WGS-84 (GPS) <-> GCJ-02 (高德/腾讯/Google中国)
 * 用于解决中国境内地图偏移问题
 */

// 常量定义
const PI = 3.1415926535897932384626;
const A = 6378245.0; // 长半轴
const EE = 0.00669342162296594323; // 扁率

/**
 * 判断坐标是否在中国境外
 * @param lat 纬度
 * @param lon 经度
 * @returns boolean
 */
export function isOutOfChina(lat: number, lon: number): boolean {
    if (lon < 72.004 || lon > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
}

/**
 * WGS-84 转 GCJ-02
 * @param lat WGS-84 纬度
 * @param lon WGS-84 经度
 * @returns [lat, lon] GCJ-02 坐标
 */
export function wgsToGcj(lat: number, lon: number): [number, number] {
    if (isOutOfChina(lat, lon)) {
        return [lat, lon];
    }

    let dLat = transformLat(lon - 105.0, lat - 35.0);
    let dLon = transformLon(lon - 105.0, lat - 35.0);

    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);

    return [lat + dLat, lon + dLon];
}

/**
 * GCJ-02 转 WGS-84
 * @param lat GCJ-02 纬度
 * @param lon GCJ-02 经度
 * @returns [lat, lon] WGS-84 坐标
 */
export function gcjToWgs(lat: number, lon: number): [number, number] {
    if (isOutOfChina(lat, lon)) {
        return [lat, lon];
    }

    let dLat = transformLat(lon - 105.0, lat - 35.0);
    let dLon = transformLon(lon - 105.0, lat - 35.0);

    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);

    const mgLat = lat + dLat;
    const mgLon = lon + dLon;

    return [lat * 2 - mgLat, lon * 2 - mgLon];
}

function transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLon(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}
