import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
import Layout from '@/components/Layout';
import SetupModal from '@/components/SetupModal';
import HomePage from '@/pages/Home';
import ChargeListPage from '@/pages/ChargeList';
import ChargeDetailPage from '@/pages/ChargeDetail';
import DriveListPage from '@/pages/DriveList';
import DriveDetailPage from '@/pages/DriveDetail';
import SettingsPage from '@/pages/Settings';

function App() {
  const { theme, baseUrl, backgroundImage, fetchBackgroundImage } = useSettingsStore();
  const [showSetup, setShowSetup] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 更新主题颜色：影响浏览器地址栏、iOS 安全区域等
  useEffect(() => {
    const colors = getThemeColors(theme);
    
    // 更新 <meta name="theme-color"> 标签
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', colors.bg);
    }
    
    // 更新 CSS 变量，让 body 背景色与主题一致
    document.documentElement.style.setProperty('--theme-bg', colors.bg);
    document.body.style.backgroundColor = colors.bg;
  }, [theme]);

  // 初始化时加载背景图片
  useEffect(() => {
    if (baseUrl) {
      fetchBackgroundImage();
    }
  }, [baseUrl, fetchBackgroundImage]);

  // Check if setup is needed on mount
  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('cyberui-settings');
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          if (!settings.state?.baseUrl) {
            setShowSetup(true);
          }
        } catch {
          setShowSetup(true);
        }
      } else {
        setShowSetup(true);
      }
      setInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Also check when baseUrl changes
  useEffect(() => {
    if (initialized && !baseUrl) {
      setShowSetup(true);
    }
  }, [baseUrl, initialized]);

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  if (!initialized) {
    return null; // Wait for initialization
  }

  // 背景图片样式
  const backgroundStyle: React.CSSProperties = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {};

  return (
    <div 
      className={`min-h-screen bg-${theme}-bg text-${theme}-text`}
      style={backgroundStyle}
    >
      {/* 如果有背景图片，添加一个半透明遮罩层以保证文字可读性 */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 0 
          }} 
        />
      )}
      <div className="relative z-10">
        {showSetup && <SetupModal onComplete={handleSetupComplete} />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="charges" element={<ChargeListPage />} />
              <Route path="charges/:id" element={<ChargeDetailPage />} />
              <Route path="drives" element={<DriveListPage />} />
              <Route path="drives/:id" element={<DriveDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
