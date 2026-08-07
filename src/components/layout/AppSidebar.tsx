import { useState, useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  LayoutGrid,
  Store,
  BarChart2,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Ticket,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import '@/components/dashboard/Dashboard.css';

interface AppSidebarProps {
  isEditing?: boolean;
  autoHideSidebar?: boolean;
  expandedWidth?: number;
  collapsedWidth?: number;
  showIcons?: boolean;
  showLabels?: boolean;
  forceCollapsed?: boolean | null;
}

export function AppSidebar({
  isEditing = false,
  autoHideSidebar = false,
  expandedWidth = 260,
  collapsedWidth = 68,
  showIcons = true,
  showLabels = true,
  forceCollapsed = null
}: AppSidebarProps) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_pinned") === "true";
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ label: string; y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem("sidebar_pinned", isPinned ? "true" : "false");
  }, [isPinned]);

  const isExpanded = forceCollapsed === true
    ? false
    : (forceCollapsed === false
      ? true
      : ((isPinned || isHovered || isEditing) && (!autoHideSidebar || isHovered || isEditing || isPinned)));

  const handleItemMouseEnter = (label: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isExpanded) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
        label,
        y: rect.top + rect.height / 2
      });
    }
  };

  const handleItemMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleNav = (to: string) => {
    navigate({ to });
  };

  return (
    <>
      <style>{`
        ${(!showIcons) ? `
          .dash-sidebar .nav-icon {
            display: none !important;
          }
        ` : ''}
        ${(!showLabels) ? `
          .dash-sidebar .nav-label,
          .dash-sidebar .nav-section-title,
          .dash-sidebar .nav-divider {
            display: none !important;
          }
        ` : ''}
      `}</style>
      <aside
        data-hms-context="app-sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredItem(null);
        }}
        className={`dash-sidebar ${!isExpanded ? 'collapsed' : ''} ${isEditing ? 'editing-focus' : ''}`}
        style={{
          width: isExpanded ? `${expandedWidth}px` : `${collapsedWidth}px`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: !isExpanded ? 'pointer' : 'default'
        }}
      >
        {!isExpanded && (
          <div
            className="sidebar-header"
            style={{
              height: '52px',
              display: 'flex',
              justifyContent: 'center',
              padding: '0',
              alignItems: 'center',
              transition: 'all 0.05s ease',
              borderBottom: '1px solid var(--border-light, #e2e8f0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <button
                type="button"
                title="Open sidebar"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: isLogoHovered ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isLogoHovered ? '#1a73e8' : '#64748b',
                  transition: 'all 0.05s ease'
                }}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPinned(true);
                }}
              >
                <PanelLeftOpen size={20} />
              </button>
            </div>
          </div>
        )}

        <div
          className="sidebar-nav"
          style={{ paddingTop: !isExpanded ? '0' : '16px' }}
        >
          {/* Dashboard */}
          <a
            href="#"
            className={`nav-item ${path === '/dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNav('/dashboard'); }}
            style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}
            onMouseEnter={(e) => handleItemMouseEnter("Dashboard", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <LayoutGrid size={20} className="nav-icon" color="#3b82f6" />
            {isExpanded && <span className="nav-label" style={{ flex: 1 }}>Dashboard</span>}
            {isExpanded && path === '/dashboard' && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  title={isPinned ? "Unpin sidebar" : "Pin sidebar to lock"}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPinned ? '#2563eb' : '#94a3b8',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.05s ease'
                  }}
                  className="sidebar-toggle"
                >
                  <Pin size={14} className={isPinned ? 'fill-blue-600 text-blue-600' : ''} />
                </button>
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={() => { setIsPinned(false); setIsHovered(false); }}
                  title="Collapse sidebar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.05s ease'
                  }}
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            )}
          </a>

          {/* Tickets */}
          <a
            href="#"
            className={`nav-item ${path.startsWith('/tickets') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNav('/tickets'); }}
            onMouseEnter={(e) => handleItemMouseEnter("Tickets", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <Ticket size={20} className="nav-icon" color="#10b981" />
            {isExpanded && <span className="nav-label">Tickets</span>}
          </a>

          {/* Menu Item 2 */}
          <a
            href="#"
            className="nav-item"
            onClick={(e) => { e.preventDefault(); handleNav('/dashboard'); }}
            onMouseEnter={(e) => handleItemMouseEnter("Menu Item 2", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <Store size={20} className="nav-icon" color="#f59e0b" />
            {isExpanded && <span className="nav-label">Menu Item 2</span>}
          </a>

          {/* Section: REPORTS */}
          {isExpanded && <div className="nav-section-title">REPORTS</div>}
          {isExpanded && <div className="nav-divider" style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 12px 12px 12px' }} />}

          <a
            href="#"
            className="nav-item"
            onClick={(e) => { e.preventDefault(); }}
            onMouseEnter={(e) => handleItemMouseEnter("Report Builder", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <BarChart2 size={20} className="nav-icon" color="#8b5cf6" />
            {isExpanded && <span className="nav-label">Report Builder</span>}
          </a>

          <a
            href="#"
            className="nav-item"
            onClick={(e) => { e.preventDefault(); }}
            onMouseEnter={(e) => handleItemMouseEnter("Testing Reports", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <FlaskConical size={20} className="nav-icon" color="#ec4899" />
            {isExpanded && <span className="nav-label">Testing Reports</span>}
          </a>

          {/* Section: SYSTEM */}
          {user && (user.role === 'admin' || user.role === 'sub_admin') && (
            <>
              {isExpanded && <div className="nav-section-title" style={{ marginTop: '16px' }}>SYSTEM</div>}
              {isExpanded && <div className="nav-divider" style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 12px 12px 12px' }} />}

              <a
                href="#"
                className={`nav-item ${path.startsWith('/admin') ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNav('/admin'); }}
                onMouseEnter={(e) => handleItemMouseEnter(user.role === 'sub_admin' ? "Help Admin" : "Superadmin", e)}
                onMouseLeave={handleItemMouseLeave}
              >
                <ShieldCheck size={20} className="nav-icon" color="#14b8a6" />
                {isExpanded && <span className="nav-label">{user.role === 'sub_admin' ? "Help Admin" : "Superadmin"}</span>}
              </a>
            </>
          )}
        </div>
      </aside>

      {!isExpanded && hoveredItem && (
        <div
          className="sidebar-fixed-tooltip"
          style={{
            position: 'fixed',
            left: '76px',
            top: `${hoveredItem.y}px`,
            transform: 'translateY(-50%)',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 99999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {hoveredItem.label}
        </div>
      )}
    </>
  );
}
