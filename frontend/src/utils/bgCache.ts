/**
 * 背景图片 IndexedDB 缓存工具
 * 使用 MD5 hash 比对来避免每次页面加载都从服务器获取大图片
 */

const DB_NAME = 'cyberui-bg-cache';
const STORE_NAME = 'background';
const DB_VERSION = 1;

interface BgCacheEntry {
    id: string;
    hash: string;
    image: string;
    originalImage: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** 从 IndexedDB 获取缓存的背景图片数据 */
export async function getCachedBackground(): Promise<BgCacheEntry | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('bg');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

/** 将背景图片数据写入 IndexedDB 缓存 */
export async function setCachedBackground(hash: string, image: string, originalImage: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const entry: BgCacheEntry = { id: 'bg', hash, image, originalImage };

            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // 忽略缓存写入失败
    }
}

/** 清除 IndexedDB 中的背景图片缓存 */
export async function clearCachedBackground(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete('bg');

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // 忽略
    }
}
