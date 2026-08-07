import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, X, Camera, User, RefreshCw, Maximize2, MessageSquare, Ticket } from 'lucide-react';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';
import { mockNotifications } from '../Notifications/mockData';
import type { NotificationItem } from '../Notifications/types';
import logo from '@/assets/logo.png';
import '@/components/dashboard/Dashboard.css';
import '@/components/Notifications/Notifications.css';

const PRESET_THEMES = [
  { id: 'corporate-blue', label: 'Corporate Blue' },
  { id: 'emerald', label: 'Emerald Green' },
  { id: 'indigo-violet', label: 'Indigo Violet' },
  { id: 'graphite', label: 'Graphite Charcoal' },
  { id: 'ocean-teal', label: 'Ocean Teal' },
  { id: 'amber', label: 'Amber Orange' }
];

interface HeaderProps {
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  onViewAllClick?: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string, options?: any) => void;
  onSettingsClick?: () => void;
  onContactSupportClick?: () => void;
  onTicketsClick?: () => void;
  headerConfig?: any;
  isEditing?: boolean;
  showCustomerProfile?: boolean;
  customerName?: string;
  customerNameStyle?: string;
  customerNameColor?: string;
  customerColorFollow?: boolean;
  showCustomerLogo?: boolean;
  customerLogo?: string;
}

export function TwinHeader({
  notifications = mockNotifications,
  onMarkAllRead = () => {},
  onNotificationClick = () => {},
  onViewAllClick = () => {},
  onLogout,
  onNavigate,
  onSettingsClick,
  onContactSupportClick,
  onTicketsClick,
  headerConfig,
  isEditing = false,
  showCustomerProfile = false,
  customerName = 'Default Customer',
  customerNameStyle = 'h1',
  customerNameColor = '#1e293b',
  customerColorFollow = true,
  showCustomerLogo = false,
  customerLogo = ''
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('corporate-blue');
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const [themeToast, setThemeToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const longPressTimerRef = useRef<any>(null);
  const didLongPressRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<any>(null);

  // Initialize theme from document element on mount
  useEffect(() => {
    const active = document.documentElement.getAttribute('data-theme') || 'corporate-blue';
    setCurrentTheme(active);
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleCycleTheme = () => {
    const currentIndex = PRESET_THEMES.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % PRESET_THEMES.length;
    const nextTheme = PRESET_THEMES[nextIndex];
    document.documentElement.setAttribute('data-theme', nextTheme.id);
    setCurrentTheme(nextTheme.id);
  };

  const handleMouseDownButton = () => {
    didLongPressRef.current = false;
    setIsHolding(true);
    longPressTimerRef.current = setTimeout(() => {
      const currentMode = document.documentElement.getAttribute('data-theme-mode') || 'light';
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme-mode', nextMode);
      window.dispatchEvent(new CustomEvent('theme-mode-change', { detail: nextMode }));
      didLongPressRef.current = true;
      setIsHolding(false);

      // Show temporary toast
      const emoji = nextMode === 'dark' ? '🌙' : '☀️';
      const capitalized = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
      
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setThemeToast({
        message: `${emoji} Switched to ${capitalized} Mode`,
        visible: true
      });
      toastTimeoutRef.current = setTimeout(() => {
        setThemeToast(prev => ({ ...prev, visible: false }));
      }, 3000);
    }, 500);
  };

  const handleMouseUpButton = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsHolding(false);
    if (!didLongPressRef.current) {
      handleCycleTheme();
    }
    didLongPressRef.current = false;
  };

  const handleMouseLeaveButton = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsHolding(false);
    didLongPressRef.current = false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getFontSize = (style?: string, defaultSize: string = '1rem') => {
    switch (style) {
      case 'h1': return '1.5rem';
      case 'h2': return '1.25rem';
      case 'h3': return '1.05rem';
      case 'h4': return '0.85rem';
      case 'h5': return '0.75rem';
      case 'h6': return '0.65rem';
      default: return defaultSize;
    }
  };

  return (
    <header className={`dash-header ${isEditing ? 'editing-focus' : ''}`}>
      <div
        className="header-left"
        onClick={() => onNavigate && onNavigate('overview')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '12px',
          cursor: 'pointer'
        }}
      >
        {(!headerConfig || headerConfig.showLogo) && headerConfig?.logo !== '' && (
          <img
            src={headerConfig?.logo || logo}
            alt="OomniEye Logo"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {(!headerConfig || headerConfig.showCompanyName) && (
            <div
              style={{
                fontWeight: 'bold',
                fontSize: getFontSize(headerConfig?.companyNameStyle, '1.05rem'),
                lineHeight: '1.2',
                color: headerConfig?.companyNameColor || 
                  (headerConfig && (headerConfig.textColorApply === 'both' || headerConfig.textColorApply === 'name') ? headerConfig.textColor : 'var(--text-main)'),
                textTransform: 'none',
                letterSpacing: 'normal'
              }}
            >
              {headerConfig?.companyName || 'OomniEye'}
            </div>
          )}
          {(!headerConfig || headerConfig.showCompanyCaption) && (
            <div
              style={{
                fontWeight: '600',
                fontSize: getFontSize(headerConfig?.companyCaptionStyle, '0.75rem'),
                lineHeight: '1.2',
                color: headerConfig?.companyCaptionColor || 
                  (headerConfig && (headerConfig.textColorApply === 'both' || headerConfig.textColorApply === 'caption') ? headerConfig.textColor : 'var(--text-muted, #64748b)'),
                marginTop: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {headerConfig?.companyCaption || 'Digital Twin Solutions'}
            </div>
          )}
        </div>
      </div>

      <div className="header-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        {showCustomerProfile && (
          <>
            {/* Logo in Center */}
            {showCustomerLogo && customerLogo && (
              <img
                src={customerLogo}
                alt="Customer Logo"
                style={{ height: '40px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
              />
            )}

            {/* Text/Font in Center */}
            <span style={{ 
              fontWeight: 700, 
              fontSize: getFontSize(customerNameStyle), 
              color: customerColorFollow ? (headerConfig?.textColor || 'var(--text-main)') : customerNameColor, 
              letterSpacing: '0.02em' 
            }}>
              {customerName}
            </span>
          </>
        )}
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="header-icon-btn"
            onMouseEnter={() => setShowThemeTooltip(true)}
            onMouseLeave={() => {
              setShowThemeTooltip(false);
              handleMouseLeaveButton();
            }}
            onMouseDown={handleMouseDownButton}
            onMouseUp={handleMouseUpButton}
            style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="theme-hold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" stroke={isHolding ? "rgba(0, 0, 0, 0.1)" : "currentColor"} />
              {isHolding && (
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="url(#theme-hold-grad)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset="62.83"
                  style={{
                    transformOrigin: '12px 12px',
                    transform: 'rotate(-90deg)',
                    animation: 'circular-hold 1s linear forwards',
                    filter: 'drop-shadow(0 0 3px #a855f7) drop-shadow(0 0 1px #3b82f6)'
                  }}
                />
              )}
              <circle
                cx="12"
                cy="6"
                r="2.5"
                fill="#ef4444"
                stroke="#ef4444"
                style={{
                  transformOrigin: '12px 12px',
                  transform: `rotate(${PRESET_THEMES.findIndex(t => t.id === currentTheme) * 60}deg)`,
                  transition: 'transform 0.05s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </svg>
          </button>
          
          {showThemeTooltip && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: '0',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: isHolding ? '8px 12px' : '10px 14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              zIndex: 99999,
              width: isHolding ? '120px' : '240px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: isHolding ? 'center' : 'left',
              pointerEvents: 'none',
              transition: 'width 0.05s ease, padding 0.05s ease'
            }}>
              {isHolding ? (
                <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#e2e8f0' }}>
                  Hold for 500ms
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'color-mix(in srgb, var(--primary) 80%, white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Theme: {PRESET_THEMES.find(t => t.id === currentTheme)?.label || 'Corporate Blue'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span><strong>Click</strong> to cycle through preset themes.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span><strong>Press & hold</strong> to switch between Light and Dark mode.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button 
          className="header-icon-btn" 
          title="Refresh"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={18} />
        </button>

        {/* Fullscreen button */}
        <button 
          className="header-icon-btn" 
          title="Fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          <Maximize2 size={18} />
        </button>

        {/* Vertical Divider */}
        <div style={{ height: '18px', width: '1px', backgroundColor: '#cbd5e1', margin: '0 4px' }} />

        {/* Comments/Feedback button */}
        <button 
          className="header-icon-btn" 
          title="Contact Support"
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
            if (onContactSupportClick) onContactSupportClick();
          }}
        >
          <MessageSquare size={18} />
        </button>

        {/* Tickets button with badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="header-icon-btn" 
            title="My Tickets"
            onClick={() => {
              setShowNotifications(false);
              setShowProfileMenu(false);
              if (onTicketsClick) onTicketsClick();
            }}
          >
            <Ticket size={18} />
          </button>
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            pointerEvents: 'none'
          }}>
            3
          </span>
        </div>

        <button 
          className="header-icon-btn" 
          title="Settings" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
            if (onSettingsClick) onSettingsClick();
          }}
        >
          <Settings size={18} />
        </button>

        <div className="header-bell-wrapper">
          <button
            className="header-icon-btn"
            title="Notifications"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="header-bell-indicator" />}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={onMarkAllRead}
              onNotificationClick={(n) => {
                onNotificationClick(n);
                setShowNotifications(false);
              }}
              onViewAllClick={() => {
                onViewAllClick();
                setShowNotifications(false);
              }}
              onSettingsClick={() => {
                if (onNavigate) {
                  onNavigate('account', { tab: 'notifications' });
                }
                setShowNotifications(false);
              }}
            />
          )}
        </div>

        <div className="header-profile-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={{
              background: profileImage ? 'transparent' : '#F3BA2F',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'transform 0.05s',
              userSelect: 'none',
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              "R"
            )}
          </div>

          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: '0',
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
                width: '230px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div
                  onClick={triggerFileSelect}
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: profileImage ? 'transparent' : '#F3BA2F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '18px',
                    userSelect: 'none',
                    flexShrink: 0
                  }}
                  title="Upload profile picture"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    "R"
                  )}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    opacity: isAvatarHovered ? 1 : 0,
                    transition: 'opacity 0.05s ease',
                    borderRadius: '50%'
                  }}>
                    <Camera size={14} />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  minWidth: 0
                }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    Riya
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: '450',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Product manager
                  </div>
                </div>
              </div>

              <div style={{ padding: '4px 0', background: '#ffffff' }}>
                <div
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('account', { editMode: true });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.05s'
                  }}
                  title="View and update your profile settings"
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '1.5px solid #2563eb',
                    backgroundColor: 'transparent',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={15} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                    Edit Profile
                  </span>
                </div>

                <div style={{ height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.06)', margin: '4px 0' }} />

                <div
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.05s'
                  }}
                  title="Sign out from your account"
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <X size={15} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>
                    Sign Out
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {themeToast.visible && (
        <div className="theme-toggle-toast">
          {themeToast.message}
        </div>
      )}
    </header>
  );
}
