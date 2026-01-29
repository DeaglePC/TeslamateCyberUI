import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settings';
import Layout from '@/components/Layout';
import SetupModal from '@/components/SetupModal';
import HomePage from '@/pages/Home';
import ChargeListPage from '@/pages/ChargeList';
import ChargeDetailPage from '@/pages/ChargeDetail';
import DriveListPage from '@/pages/DriveList';
import DriveDetailPage from '@/pages/DriveDetail';
import SettingsPage from '@/pages/Settings';

function App() {
  const { theme, baseUrl } = useSettingsStore();
  const [showSetup, setShowSetup] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

  return (
    <div className={`min-h-screen bg-${theme}-bg text-${theme}-text`}>
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
  );
}

export default App;
