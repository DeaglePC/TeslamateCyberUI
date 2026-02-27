/**
 * URL 参数解析工具
 * 支持通过 URL 参数传递后端地址和 API Key，例如：
 * https://tsl.deaglepc.cn/?backend=https://tsldemo.deaglepc.cn/&apikey=xxx
 */

export interface UrlBackendParams {
    backend: string | null;
    apikey: string | null;
}

/**
 * 从当前 URL 的 query string 中解析 backend 和 apikey 参数
 */
export function getUrlParams(): UrlBackendParams {
    const params = new URLSearchParams(window.location.search);
    const backend = params.get('backend');
    const apikey = params.get('apikey');

    return {
        backend: backend ? backend.replace(/\/$/, '') : null, // 移除尾部斜杠
        apikey: apikey || null,
    };
}

/**
 * 从 URL 中移除 backend 和 apikey 参数（不触发页面刷新）
 * 使用 history.replaceState 静默更新 URL
 */
export function clearUrlParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('backend');
    url.searchParams.delete('apikey');

    // 如果清理后没有剩余参数，移除 "?" 号
    const cleanUrl = url.searchParams.toString()
        ? `${url.pathname}?${url.searchParams.toString()}${url.hash}`
        : `${url.pathname}${url.hash}`;

    window.history.replaceState({}, '', cleanUrl);
}
