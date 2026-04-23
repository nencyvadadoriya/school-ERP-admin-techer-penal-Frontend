import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, UserSquare2,
  BookOpen, CalendarCheck2, ClipboardList, Wallet, Bell,
  CalendarDays, FileText, Clock, LogOut, User, School,
  ShieldCheck, BookMarked, Presentation, X, ChevronRight,
  GraduationCap as GradCap, UserCog, BookCopy, Tag,
  BarChart3, CreditCard, Megaphone, PartyPopper, UserCheck,
  BookOpenCheck, PenLine, CheckSquare, Calendar, AlignLeft,
  Home, Settings, Users2, Landmark, GraduationCap as StudentIcon,
  Library, FileSpreadsheet, BellRing, CalendarRange, History,
  UserCircle2, UsersRound
} from 'lucide-react';
import { FaUser } from 'react-icons/fa';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const theme = {
  primary: '#002B5B',
  secondary: '#2D54A8',
};

// Icon colors for variety
const iconColors = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#FFF1F2', color: '#E11D48' },
  { bg: '#F0FDF4', color: '#16A34A' },
  { bg: '#FEF9C3', color: '#CA8A04' },
  { bg: '#E0F2FE', color: '#0284C7' },
  { bg: '#FDF4FF', color: '#9333EA' },
  { bg: '#FFF5F5', color: '#DC2626' },
];

const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenuItems = [
    { path: '/admin/teachers', icon: Users2, label: 'Teachers' },
    { path: '/admin/admins', icon: ShieldCheck, label: 'Admins' },
    { path: '/admin/classes', icon: Landmark, label: 'Classes' },
    { path: '/admin/subjects', icon: Library, label: 'Subjects' },
    { path: '/admin/exams', icon: FileSpreadsheet, label: 'Exams' },
    { path: '/admin/notices', icon: BellRing, label: 'Notices' },
    { path: '/admin/events', icon: PartyPopper, label: 'Events' },
    { path: '/admin/leaves', icon: CalendarRange, label: 'Leaves' },
    { path: '/admin/timetable', icon: History, label: 'Timetable' },
    { path: '/admin/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/admin/subject-assignment', icon: BookCopy, label: 'Subject Assign' },
    { path: '/admin/assign-class-teacher', icon: UsersRound, label: 'Class Teacher' },
    { path: '/admin/profile', icon: UserCircle2, label: 'Profile' },
  ];

  const teacherMenuItems = [
    { path: '/teacher/results', icon: BarChart3, label: 'Results' },
    { path: '/teacher/timetable', icon: Clock, label: 'Timetable' },
    { path: '/teacher/notices', icon: Bell, label: 'Notices' },
    { path: '/teacher/events', icon: PartyPopper, label: 'Events' },
    { path: '/teacher/leaves', icon: UserCheck, label: 'Student Leaves' },
    { path: '/teacher/leave', icon: FileText, label: 'My Leave' },
    { path: '/teacher/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/teacher/profile', icon: User, label: 'Profile' },
  ];

  const studentMenuItems = [
    { path: '/student/profile', icon: User, label: 'Profile' },
  ];

  const getItems = () => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') return adminMenuItems;
    if (user?.role === 'teacher') return teacherMenuItems;
    if (user?.role === 'student') return studentMenuItems;
    return adminMenuItems;
  };

  const items = getItems();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') return 'Admin Panel';
    if (user?.role === 'teacher') return 'Teacher Panel';
    if (user?.role === 'student') return 'Student Panel';
    return 'Panel';
  };

  return (
    <>
      <style>{`
        .menu-sheet-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          z-index: 200; backdrop-filter: blur(3px);
          animation: fadeIn 0.2s ease;
        }
        .menu-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          z-index: 201; border-radius: 28px 28px 0 0;
          max-height: 88vh; overflow-y: auto;
          animation: slideUpSheet 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
          background: #fff;
        }
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .menu-icon-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 8px 4px; border-radius: 14px;
          transition: all 0.15s ease; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          background: transparent;
        }
        .menu-icon-btn:active { transform: scale(0.92); }
        .menu-icon-btn.active-item {
          background: rgba(0, 43, 91, 0.04);
        }
        .menu-icon-circle {
          width: 44px; height: 44px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8);
          border: 1px solid rgba(0, 43, 91, 0.05);
        }
        .menu-icon-btn:active .menu-icon-circle {
          transform: scale(0.9) translateY(2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .menu-sheet::-webkit-scrollbar { width: 0; }
      `}</style>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="menu-sheet-overlay" onClick={onClose} />

          {/* Sheet */}
          <div className="menu-sheet">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* User Header */}
            <div className="mx-4 mt-2 mb-4 rounded-2xl p-3.5 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                {user?.profile_image
                  ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                  : <FaUser className="text-white text-lg" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-white/60 text-[11px]">{getRoleLabel()}</p>
              </div>
              {/* Close btn */}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 active:bg-white/25"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Grid of Icons */}
            <div className="px-3 pb-4">
              <div className="grid grid-cols-5 gap-1">
                {items.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <div
                      key={item.path}
                      className="menu-icon-btn"
                    >
                      <div 
                        className={`menu-icon-circle ${isActive ? 'active-circle' : ''}`}
                        onClick={() => handleNav(item.path)}
                        style={{ 
                          background: isActive 
                            ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` 
                            : `linear-gradient(135deg, #ffffff, #f8fafc)`,
                          border: isActive ? 'none' : '1px solid rgba(0, 43, 91, 0.08)',
                          boxShadow: isActive 
                            ? `0 8px 20px ${theme.primary}40` 
                            : '0 4px 12px rgba(0,0,0,0.04)'
                        }}
                      >
                        <item.icon
                          size={20}
                          strokeWidth={isActive ? 2.5 : 2}
                          style={{ color: isActive ? '#fff' : theme.primary }}
                        />
                      </div>
                      <span
                        className={`text-[10px] text-center leading-tight mt-1 ${isActive ? 'font-bold' : 'font-semibold'}`}
                        style={{ color: isActive ? theme.primary : '#4b5563' }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* Logout tile */}
                <div className="menu-icon-btn">
                  <div 
                    className="menu-icon-circle" 
                    onClick={handleLogout}
                    style={{ background: '#FFF1F2' }}
                  >
                    <LogOut size={18} style={{ color: '#E11D48' }} />
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: '#E11D48' }}>
                    Logout
                  </span>
                </div>
              </div>
            </div>

            {/* Safe area bottom padding */}
            <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: '16px' }} />
          </div>
        </>
      )}
    </>
  );
};

export default MobileMenuSheet;