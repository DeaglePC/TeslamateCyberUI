import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import clsx from 'clsx';

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="13" x2="23" y2="11" />
      <rect x="3" y="8" width="8" height="8" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-6.75A1 1 0 0 0 12.36 4H7.64a1 1 0 0 0-.93.63L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Layout() {
  const { theme, language } = useSettingsStore();
  const { t } = useTranslation(language);
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('home'), icon: HomeIcon },
    { path: '/charges', label: t('charges'), icon: BatteryIcon },
    { path: '/drives', label: t('drives'), icon: CarIcon },
    { path: '/settings', label: t('settings'), icon: SettingsIcon },
  ];

  const themeColors = {
    cyber: {
      bg: 'bg-[#0a0a0f]',
      sidebar: 'bg-[rgba(20,20,35,0.8)]',
      primary: 'text-[#00f0ff]',
      text: 'text-[#e0e0e0]',
      muted: 'text-[#808080]',
      border: 'border-[rgba(0,240,255,0.3)]',
      active: 'bg-[rgba(0,240,255,0.1)]',
    },
    tesla: {
      bg: 'bg-[#111111]',
      sidebar: 'bg-[rgba(30,30,30,0.9)]',
      primary: 'text-[#cc0000]',
      text: 'text-[#ffffff]',
      muted: 'text-[#888888]',
      border: 'border-[rgba(255,255,255,0.1)]',
      active: 'bg-[rgba(204,0,0,0.1)]',
    },
    dark: {
      bg: 'bg-[#1a1a2e]',
      sidebar: 'bg-[rgba(30,30,50,0.85)]',
      primary: 'text-[#4361ee]',
      text: 'text-[#edf2f4]',
      muted: 'text-[#8d99ae]',
      border: 'border-[rgba(67,97,238,0.3)]',
      active: 'bg-[rgba(67,97,238,0.1)]',
    },
    tech: {
      bg: 'bg-[#0d1b2a]',
      sidebar: 'bg-[rgba(27,38,59,0.9)]',
      primary: 'text-[#0077b6]',
      text: 'text-[#caf0f8]',
      muted: 'text-[#778da9]',
      border: 'border-[rgba(0,119,182,0.3)]',
      active: 'bg-[rgba(0,119,182,0.1)]',
    },
    aurora: {
      bg: 'bg-[#0b132b]',
      sidebar: 'bg-[rgba(28,38,65,0.85)]',
      primary: 'text-[#72efdd]',
      text: 'text-[#e0fbfc]',
      muted: 'text-[#98c1d9]',
      border: 'border-[rgba(114,239,221,0.3)]',
      active: 'bg-[rgba(114,239,221,0.1)]',
    },
  };

  const colors = themeColors[theme];

  return (
    <div className={clsx('min-h-screen flex', colors.bg, colors.text)}>
      {/* PC端侧边栏 */}
      <aside className={clsx(
        'hidden md:flex flex-col w-64 glass-strong border-r',
        colors.border
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-inherit">
          <h1 className={clsx('text-2xl font-bold', colors.primary)}>
            <span className="neon-text">CyberUI</span>
          </h1>
          <p className={clsx('text-sm mt-1', colors.muted)}>TeslaMate Dashboard</p>
        </div>

        {/* 导航 */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive ? [colors.active, colors.primary, 'border', colors.border] : [colors.muted, 'hover:' + colors.text]
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 底部信息 */}
        <div className={clsx('p-4 border-t', colors.border)}>
          <p className={clsx('text-xs', colors.muted)}>TeslaMate CyberUI v1.0</p>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t flex justify-around py-2 z-50',
        colors.border
      )}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all',
                isActive ? colors.primary : colors.muted
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
