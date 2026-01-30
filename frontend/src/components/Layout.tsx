import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import { useRef, useCallback, useEffect, useState } from 'react';
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

// Main tab paths for swipe navigation
const SWIPE_TABS = ['/', '/charges', '/drives', '/settings'];

export default function Layout() {
  const { theme, language } = useSettingsStore();
  const { t } = useTranslation(language);
  const location = useLocation();
  const navigate = useNavigate();

  const colors = getThemeColors(theme);

  // Touch state for swipe detection
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Slide direction for transition animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const navItems = [
    { path: '/', label: t('home'), icon: HomeIcon },
    { path: '/charges', label: t('charges'), icon: BatteryIcon },
    { path: '/drives', label: t('drives'), icon: CarIcon },
    { path: '/settings', label: t('settings'), icon: SettingsIcon },
  ];

  // Get current tab index for swipe navigation
  const getCurrentTabIndex = useCallback(() => {
    // Check for exact match first
    const exactIndex = SWIPE_TABS.indexOf(location.pathname);
    if (exactIndex !== -1) return exactIndex;

    // Check for prefix match (e.g., /drives/123 -> /drives)
    for (let i = SWIPE_TABS.length - 1; i >= 0; i--) {
      if (SWIPE_TABS[i] !== '/' && location.pathname.startsWith(SWIPE_TABS[i])) {
        return i;
      }
    }
    return 0;
  }, [location.pathname]);

  // Handle swipe navigation
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();

    if (direction === 'left' && currentIndex < SWIPE_TABS.length - 1) {
      // Swipe left = go to next tab (content comes from right)
      setSlideDirection('left');
      navigate(SWIPE_TABS[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      // Swipe right = go to previous tab (content comes from left)
      setSlideDirection('right');
      navigate(SWIPE_TABS[currentIndex - 1]);
    }
  }, [getCurrentTabIndex, navigate]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Reset touch state
    touchStartRef.current = null;

    // Swipe detection thresholds
    const minDistance = 50; // Minimum swipe distance in pixels
    const maxTime = 500; // Maximum swipe duration in ms
    const maxVerticalRatio = 0.5; // Maximum vertical/horizontal ratio (to ensure horizontal swipe)

    // Check if it's a valid horizontal swipe
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > minDistance && deltaTime < maxTime && absY / absX < maxVerticalRatio) {
      handleSwipe(deltaX < 0 ? 'left' : 'right');
    }
  }, [handleSwipe]);

  // Attach touch listeners to main content area
  useEffect(() => {
    const element = mainContentRef.current;
    if (!element) return;

    // Only enable on mobile (md breakpoint is 768px)
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const attachListeners = () => {
      if (mediaQuery.matches) {
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
    };

    const detachListeners = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };

    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        attachListeners();
      } else {
        detachListeners();
      }
    };

    // Initial setup
    attachListeners();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      detachListeners();
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // Clear slide direction after animation completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        setSlideDirection(null);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [slideDirection, location.pathname]);

  return (
    <div
      className={clsx('min-h-screen flex')}
      style={{ backgroundColor: colors.bg, color: colors.muted }}
    >
      {/* PC端侧边栏 */}
      <aside
        className={clsx('hidden md:flex flex-col w-64 glass-strong border-r')}
        style={{ borderColor: colors.border }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'inherit' }}>
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            <span className="neon-text">CyberUI</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.muted }}>TeslaMate Dashboard</p>
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
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border',
                  isActive ? '' : 'border-transparent hover:bg-white/5'
                )}
                style={{
                  backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
                  borderColor: isActive ? `${colors.primary}40` : 'transparent',
                  color: isActive ? colors.primary : colors.muted
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 底部信息 */}
        <div className="p-4 border-t" style={{ borderColor: 'inherit' }}>
          <p className="text-xs" style={{ color: colors.muted }}>TeslaMate CyberUI v1.0</p>
        </div>
      </aside>

      {/* 主内容区 - 添加 ref 用于滑动检测 */}
      <main ref={mainContentRef} className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <div
          key={location.pathname}
          className={clsx(
            'flex-1 p-4 md:p-6 overflow-auto',
            slideDirection === 'left' && 'page-slide-left',
            slideDirection === 'right' && 'page-slide-right'
          )}
        >
          <div className="max-w-[1920px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav
        className={clsx('md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t flex justify-around py-2 z-50')}
        style={{ borderColor: colors.border }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx('flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all')}
              style={{ color: isActive ? colors.primary : colors.muted }}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold tracking-wide leading-tight pt-0.5 antialiased">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

