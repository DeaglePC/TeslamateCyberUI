import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import Layout from '@/components/Layout';
import HomePage from '@/pages/Home';
import ChargeListPage from '@/pages/ChargeList';
import ChargeDetailPage from '@/pages/ChargeDetail';
import DriveListPage from '@/pages/DriveList';
import DriveDetailPage from '@/pages/DriveDetail';
import SettingsPage from '@/pages/Settings';

function App() {
  const { theme } = useSettingsStore();

  return (
    <div className={`min-h-screen bg-${theme}-bg text-${theme}-text`}>
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
