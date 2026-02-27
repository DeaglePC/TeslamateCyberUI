import { useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { getUrlParams } from '@/utils/urlParams';
import clsx from 'clsx';

interface SetupModalProps {
    onComplete: () => void;
    initialError?: string;  // URL 参数连接失败时的初始错误信息
}

export default function SetupModal({ onComplete: _onComplete, initialError = '' }: SetupModalProps) {
    const { language, setBaseUrl, setApiKey, setLanguage, baseUrl, apiKey } = useSettingsStore();

    // 优先级：URL 参数 > store 已有值 > 环境变量
    const urlParams = getUrlParams();
    const [baseUrlInput, setBaseUrlInput] = useState(urlParams.backend || baseUrl || import.meta.env.VITE_API_BASE_URL || '');
    const [apiKeyInput, setApiKeyInput] = useState(urlParams.apikey || apiKey || '');
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState(initialError);

    const themeColors = {
        primary: '#00f0ff',
        muted: '#808080',
        border: 'rgba(0,240,255,0.3)',
        bg: '#0a0a0f',
        cardBg: 'rgba(20,20,35,0.95)',
    };

    const testConnection = async () => {
        setTesting(true);
        setError('');

        try {
            const url = baseUrlInput.replace(/\/$/, ''); // Remove trailing slash
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                headers: apiKeyInput ? { 'X-API-Key': apiKeyInput } : {},
            });

            if (response.ok) {
                // Save settings and complete
                setBaseUrl(url);
                setApiKey(apiKeyInput);
                // Wait for zustand persist to write to localStorage, then reload page
                setTimeout(() => {
                    window.location.reload();
                }, 200);
            } else {
                setError(language === 'zh' ? '连接失败，请检查地址和 API Key' : 'Connection failed. Check URL and API Key.');
            }
        } catch {
            setError(language === 'zh' ? '无法连接到服务器' : 'Cannot connect to server');
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!baseUrlInput.trim()) {
            setError(language === 'zh' ? '请输入后端地址' : 'Please enter backend URL');
            return;
        }
        testConnection();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        >
            <div
                className="relative w-full max-w-md rounded-2xl p-6 border"
                style={{
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    boxShadow: `0 0 40px ${themeColors.primary}20`,
                }}
            >
                {/* Language Toggle */}
                <button
                    type="button"
                    onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                    className="absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full transition-colors hover:bg-white/5 border"
                    style={{
                        borderColor: themeColors.border,
                        color: themeColors.primary,
                    }}
                >
                    {language === 'zh' ? 'EN' : '中文'}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: themeColors.primary }}
                    >
                        CyberUI
                    </h1>
                    <p style={{ color: themeColors.muted }}>
                        {language === 'zh' ? '配置后端连接' : 'Configure Backend Connection'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Base URL */}
                    <div>
                        <label
                            className="block text-sm mb-2"
                            style={{ color: themeColors.muted }}
                        >
                            {language === 'zh' ? '后端地址' : 'Backend URL'}
                        </label>
                        <input
                            type="url"
                            value={baseUrlInput}
                            onChange={(e) => setBaseUrlInput(e.target.value)}
                            placeholder={import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}
                            className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
                            style={{
                                borderColor: themeColors.border,
                                color: themeColors.primary,
                            }}
                            autoFocus
                        />
                    </div>

                    {/* API Key */}
                    <div>
                        <label
                            className="block text-sm mb-2"
                            style={{ color: themeColors.muted }}
                        >
                            {language === 'zh' ? 'API Key（可选）' : 'API Key (optional)'}
                        </label>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={language === 'zh' ? '如果后端启用了鉴权' : 'If backend auth is enabled'}
                            className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
                            style={{
                                borderColor: themeColors.border,
                                color: themeColors.primary,
                            }}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="p-3 rounded-lg text-sm"
                            style={{
                                backgroundColor: 'rgba(255,0,0,0.1)',
                                color: '#ff6b6b',
                                border: '1px solid rgba(255,0,0,0.3)',
                            }}
                        >
                            {/* 根据错误类型代码动态翻译 */}
                            {error === 'auth_failed'
                                ? (language === 'zh' ? 'API Key 错误或未配置' : 'Invalid or missing API Key')
                                : error === 'connection_failed'
                                    ? (language === 'zh' ? '连接失败，请检查地址' : 'Connection failed, check URL')
                                    : error === 'server_unreachable'
                                        ? (language === 'zh' ? '无法连接到服务器' : 'Cannot connect to server')
                                        : error}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={testing}
                        className={clsx(
                            'w-full p-4 rounded-lg font-semibold transition-all',
                            testing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        )}
                        style={{
                            backgroundColor: themeColors.primary,
                            color: themeColors.bg,
                        }}
                    >
                        {testing
                            ? (language === 'zh' ? '测试连接中...' : 'Testing connection...')
                            : (language === 'zh' ? '连接' : 'Connect')}
                    </button>
                    {/* View documentation link */}
                    <div className="pt-2 text-center">
                        <a
                            href="https://github.com/DeaglePC/TeslamateCyberUI"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm transition-colors hover:underline inline-flex items-center gap-1"
                            style={{ color: themeColors.primary }}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            {language === 'zh' ? '阅读后端配置文档（GitHub）' : 'Read Setup Documentation (GitHub)'}
                        </a>
                    </div>

                </form>

                {/* Footer note */}
                <p
                    className="text-xs text-center mt-4"
                    style={{ color: themeColors.muted }}
                >
                    {language === 'zh'
                        ? '这些设置将保存在浏览器本地'
                        : 'These settings are saved locally in your browser'}
                </p>
            </div>
        </div>
    );
}
