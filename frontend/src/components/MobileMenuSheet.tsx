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
  Home, Settings
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
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/students', icon: GraduationCap, label: 'Students' },
    { path: '/admin/teachers', icon: UserSquare2, label: 'Teachers' },
    { path: '/admin/admins', icon: ShieldCheck, label: 'Admins' },
    { path: '/admin/attendance', icon: CalendarCheck2, label: 'Attendance' },
    { path: '/admin/classes', icon: School, label: 'Classes' },
    { path: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
    { path: '/admin/exams', icon: ClipboardList, label: 'Exams' },
    { path: '/admin/fees', icon: Wallet, label: 'Fees' },
    { path: '/admin/notices', icon: Bell, label: 'Notices' },
    { path: '/admin/events', icon: PartyPopper, label: 'Events' },
    { path: '/admin/leaves', icon: FileText, label: 'Leaves' },
    { path: '/admin/timetable', icon: Clock, label: 'Timetable' },
    { path: '/admin/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/admin/subject-assignment', icon: BookCopy, label: 'Subject Assign' },
    { path: '/admin/assign-class-teacher', icon: UserCheck, label: 'Class Teacher' },
    { path: '/admin/profile', icon: User, label: 'Profile' },
  ];

  const teacherMenuItems = [
    { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/teacher/attendance', icon: CalendarCheck2, label: 'Attendance' },
    { path: '/teacher/homework', icon: BookOpen, label: 'Homework' },
    { path: '/teacher/exams', icon: ClipboardList, label: 'Exams' },
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
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/timetable', icon: Clock, label: 'Timetable' },
    { path: '/student/leave', icon: FileText, label: 'Leave' },
    { path: '/student/calendar', icon: CalendarDays, label: 'Calendar' },
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
          gap: 7px; padding: 12px 6px; border-radius: 18px;
          transition: all 0.15s ease; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          background: transparent;
        }
        .menu-icon-btn:active { transform: scale(0.92); }
        .menu-icon-btn.active-item {
          background: rgba(0, 43, 91, 0.06);
        }
        .menu-icon-circle {
          width: 54px; height: 54px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .menu-icon-btn:active .menu-icon-circle {
          transform: scale(0.9);
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
              <div className="grid grid-cols-4 gap-1">
                {items.map((item, i) => {
                  const colorSet = iconColors[i % iconColors.length];
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      className={`menu-icon-btn ${isActive ? 'active-item' : ''}`}
                      onClick={() => handleNav(item.path)}
                    >
                      <div className="menu-icon-circle" style={{ background: isActive ? theme.primary : colorSet.bg }}>
                        <item.icon
                          size={22}
                          style={{ color: isActive ? '#fff' : colorSet.color }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold text-center leading-tight"
                        style={{ color: isActive ? theme.primary : '#374151' }}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                {/* Logout tile */}
                <button
                  className="menu-icon-btn"
                  onClick={handleLogout}
                >
                  <div className="menu-icon-circle" style={{ background: '#FFF1F2' }}>
                    <LogOut size={22} style={{ color: '#E11D48' }} />
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: '#E11D48' }}>
                    Logout
                  </span>
                </button>
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