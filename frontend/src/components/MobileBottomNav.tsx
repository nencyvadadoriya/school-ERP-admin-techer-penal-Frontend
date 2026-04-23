import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck2, Wallet,
  GraduationCap, BookOpen, ClipboardList, Menu
} from 'lucide-react';
import MobileMenuSheet from './MobileMenuSheet';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const adminTabs = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/attendance', icon: CalendarCheck2, label: 'Attendance' },
    { path: '/admin/fees', icon: Wallet, label: 'Fees' },
  ];

  const teacherTabs = [
    { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/teacher/attendance', icon: CalendarCheck2, label: 'Attendance' },
    { path: '/teacher/homework', icon: BookOpen, label: 'Homework' },
    { path: '/teacher/exams', icon: ClipboardList, label: 'Exams' },
  ];

  const studentTabs = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/student/timetable', icon: CalendarCheck2, label: 'Timetable' },
    { path: '/student/leave', icon: ClipboardList, label: 'Leave' },
    { path: '/student/calendar', icon: GraduationCap, label: 'Calendar' },
  ];

  const getTabs = () => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') return adminTabs;
    if (user?.role === 'teacher') return teacherTabs;
    if (user?.role === 'student') return studentTabs;
    return adminTabs;
  };

  const tabs = getTabs();

  return (
    <>
      <style>{`
        .bottom-nav-bar {
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          box-shadow: 0 -4px 24px rgba(0, 43, 91, 0.10);
        }
        .bottom-tab-active { color: #002B5B; }
        .bottom-tab-active .tab-icon-bg {
          background: linear-gradient(135deg, #002B5B 0%, #2D54A8 100%);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 43, 91, 0.2);
        }
        .bottom-tab-active .tab-icon-bg svg { color: white !important; }
        .bottom-tab-active .tab-label { color: #002B5B; font-weight: 700; }
        .bottom-tab-inactive .tab-icon-bg { background: transparent; transform: translateY(0) scale(1); }
        .bottom-tab-inactive .tab-label { color: #9ca3af; font-weight: 500; }
        .menu-tab-active .tab-icon-bg {
          background: linear-gradient(135deg, #002B5B 0%, #2D54A8 100%);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 43, 91, 0.2);
        }
        .menu-tab-active .tab-icon-bg svg { color: white !important; }
        .menu-tab-active .tab-label { color: #002B5B; font-weight: 700; }
        .tab-icon-bg {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tab-label {
          font-size: 10px; margin-top: 2px;
          transition: color 0.2s; letter-spacing: 0.01em;
        }
        .bottom-tab {
          display: flex; flex-direction: column; align-items: center;
          padding: 8px 0 2px; flex: 1; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .bottom-tab:active .tab-icon-bg { transform: translateY(-2px) scale(0.98); }
      `}</style>

      <nav className="bottom-nav-bar fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map((tab: any) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`bottom-tab ${isActive ? 'bottom-tab-active' : 'bottom-tab-inactive'}`}
            >
              <div className="tab-icon-bg">
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              </div>
              <span className="tab-label">{tab.label}</span>
            </NavLink>
          );
        })}

        <button
          className={`bottom-tab ${menuOpen ? 'menu-tab-active' : 'bottom-tab-inactive'}`}
          onClick={() => setMenuOpen(true)}
        >
          <div className="tab-icon-bg">
            <Menu size={18} className={menuOpen ? 'text-white' : 'text-gray-400'} />
          </div>
          <span className="tab-label">Menu</span>
        </button>
      </nav>

      <MobileMenuSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default MobileBottomNav;