import { useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import clsx from 'clsx';

interface SetupModalProps {
    onComplete: () => void;
}

export default function SetupModal({ onComplete: _onComplete }: SetupModalProps) {
    const { language, setBaseUrl, setApiKey } = useSettingsStore();

    const [baseUrlInput, setBaseUrlInput] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');

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
                className="w-full max-w-md rounded-2xl p-6 border"
                style={{
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    boxShadow: `0 0 40px ${themeColors.primary}20`,
                }}
            >
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
                            placeholder="http://localhost:8080"
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
                            {error}
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
