import React, { useState } from 'react';
import { SidebarSkeleton } from './Skeleton';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, UserSquare2,
  BookOpen, CalendarCheck2, ClipboardList, Wallet, Bell,
  CalendarDays, FileText, Clock, LogOut, User, School,
  ShieldCheck, BookMarked, Presentation, X,
  ChevronDown, Settings, BookCopy, Users2,
  Landmark, Library, FileSpreadsheet, BellRing, CalendarRange,
  History, UserCircle2, UsersRound
} from 'lucide-react';

interface MenuItem {
  path?: string;
  icon: any;
  label: string;
  section: string;
  subItems?: { path: string; label: string }[];
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  mobileOnly?: boolean;
  loading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, mobileOnly, loading }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleCollapse = () => { setIsCollapsed(!isCollapsed); setOpenDropdown(null); };
  const toggleDropdown = (label: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const adminMenuItems: MenuItem[] = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
    { label: 'User Management', icon: Users2, section: 'management', subItems: [
      { path: '/admin/admins', label: 'Admins' },
      { path: '/admin/students', label: 'Students' },
      { path: '/admin/teachers', label: 'Teachers' },
    ]},
    { label: 'Academic Setup', icon: Library, section: 'management', subItems: [
      { path: '/admin/classes', label: 'Classes' },
      { path: '/admin/subjects', label: 'Subjects' },
      { path: '/admin/subject-assignment', label: 'Subject Assignment' },
      { path: '/admin/assign-class-teacher', label: 'Assign Teacher' },
    ]},
    { path: '/admin/attendance', icon: CalendarCheck2, label: 'Attendance', section: 'academic' },
    { path: '/admin/exams', icon: FileSpreadsheet, label: 'Exams', section: 'academic' },
    { path: '/admin/timetable', icon: History, label: 'Timetable', section: 'academic' },
    { path: '/admin/calendar', icon: CalendarDays, label: 'Holiday Calendar', section: 'academic' },
    { path: '/admin/fees', icon: Wallet, label: 'Fees Management', section: 'finance' },
    { label: 'Communication', icon: Bell, section: 'communication', subItems: [
      { path: '/admin/notices', label: 'Notices' },
      { path: '/admin/events', label: 'Events' },
      { path: '/admin/leaves', label: 'Leave Management' },
    ]},
  ];

  const teacherMenuItems: MenuItem[] = [
    { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
    { path: '/teacher/attendance', icon: CalendarCheck2, label: 'Attendance', section: 'academic' },
    { path: '/teacher/homework', icon: ClipboardList, label: 'Homework', section: 'academic' },
    { path: '/teacher/exams', icon: ClipboardList, label: 'Exams', section: 'academic' },
    { path: '/teacher/results', icon: FileText, label: 'Results', section: 'academic' },
    { path: '/teacher/timetable', icon: Clock, label: 'Timetable', section: 'academic' },
    { path: '/teacher/calendar', icon: CalendarDays, label: 'Holiday Calendar', section: 'academic' },
    { label: 'Communication', icon: Bell, section: 'communication', subItems: [
      { path: '/teacher/notices', label: 'Notices' },
      { path: '/teacher/events', label: 'Events' },
      { path: '/teacher/leaves', label: 'Student Leaves' },
      { path: '/teacher/leave', label: 'Leave Application' },
    ]},
  ];

  const studentMenuItems: MenuItem[] = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
    { path: '/student/timetable', icon: Clock, label: 'Timetable', section: 'academic' },
    { path: '/student/calendar', icon: CalendarDays, label: 'Holiday Calendar', section: 'academic' },
    { path: '/student/leave', icon: FileText, label: 'Leave Application', section: 'communication' },
  ];

  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') return adminMenuItems;
    if (user?.role === 'teacher') return teacherMenuItems;
    if (user?.role === 'student') return studentMenuItems;
    return [];
  };

  const groupMenuItemsBySection = (items: MenuItem[]) => {
    const sections = {
      main: { title: '', order: 1, showTitle: false },
      management: { title: 'Management', order: 2, showTitle: true },
      academic: { title: 'Academic', order: 3, showTitle: true },
      finance: { title: 'Finance', order: 4, showTitle: true },
      communication: { title: 'Communication', order: 5, showTitle: true }
    };
    const grouped: Record<string, MenuItem[]> = {};
    items.forEach(item => {
      const section = item.section;
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    });
    return { grouped, sections };
  };

  const { grouped, sections } = groupMenuItemsBySection(getMenuItems());
  const sortedSections = Object.keys(grouped).sort((a, b) =>
    (sections[a as keyof typeof sections]?.order || 999) - (sections[b as keyof typeof sections]?.order || 999)
  );

  // Mobile sidebar is a full overlay drawer
  if (mobileOnly) {
    return (
      <>
        <style>{`
          .mobile-drawer {
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .mobile-drawer-open { transform: translateX(0); }
          .mobile-drawer-closed { transform: translateX(-100%); }
          .mobile-sidebar-scrollbar::-webkit-scrollbar { width: 3px; }
          .mobile-sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
          .mobile-nav-link { display: flex; align-items: center; padding: 11px 16px; border-radius: 12px; transition: all 0.18s; margin-bottom: 2px; }
          .mobile-subnav-link { display: flex; align-items: center; padding: 9px 16px 9px 48px; border-radius: 10px; transition: all 0.18s; margin-bottom: 1px; }
        `}</style>

        {/* Overlay */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]" onClick={toggleSidebar} />
        )}

        {/* Drawer */}
        <aside
          className={`mobile-drawer fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col ${isOpen ? 'mobile-drawer-open' : 'mobile-drawer-closed'}`}
          style={{ background: '#FFFFFF' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <School size={18} className="text-[#002B5B]" />
              </div>
              <div>
                <p className="text-[#002B5B] font-bold text-[15px] tracking-wide">SmartSchool</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest">ERP System</p>
              </div>
            </div>
            <button onClick={toggleSidebar} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="mx-4 mt-4 mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                {user?.profile_image
                  ? <img src={user.profile_image} alt="" className="w-full h-full object-cover rounded-xl" />
                  : <User size={18} className="text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#002B5B] font-semibold text-sm truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-gray-500 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto mobile-sidebar-scrollbar px-3 py-1">
            {sortedSections.map(sectionKey => {
              const sectionConfig = sections[sectionKey as keyof typeof sections];
              return (
                <div key={sectionKey}>
                  {sectionConfig?.showTitle && (
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 mt-5 mb-2">
                      {sectionConfig.title}
                    </p>
                  )}
                  {grouped[sectionKey].map(item => (
                    <div key={item.label}>
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className={`w-full mobile-nav-link ${openDropdown === item.label ? 'bg-blue-50 text-[#002B5B]' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            <item.icon size={17} className={openDropdown === item.label ? 'text-[#002B5B]' : 'text-gray-400'} />
                            <span className={`ml-3 text-[13px] font-medium flex-1 text-left ${openDropdown === item.label ? 'text-[#002B5B]' : 'text-gray-600'}`}>
                              {item.label}
                            </span>
                            <ChevronDown
                              size={13}
                              className={`text-gray-300 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180 text-blue-500' : ''}`}
                            />
                          </button>
                          {openDropdown === item.label && (
                            <div>
                              {item.subItems.map(sub => (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={toggleSidebar}
                                  className={({ isActive }) =>
                                    `mobile-subnav-link text-[12px] ${isActive ? 'bg-blue-50/50 text-[#002B5B] font-semibold' : 'text-gray-500 hover:bg-gray-50'}`
                                  }
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-2.5 flex-shrink-0 ${openDropdown === item.label ? 'bg-blue-200' : 'bg-gray-200'}`}></span>
                                  {sub.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.path!}
                          onClick={toggleSidebar}
                          className={({ isActive }) =>
                            `mobile-nav-link ${isActive ? 'bg-[#002B5B] text-white' : 'text-gray-600 hover:bg-gray-50'}`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon size={17} className={isActive ? 'text-white' : 'text-gray-400'} />
                              <span className={`ml-3 text-[13px] font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80"></div>
                              )}
                            </>
                          )}
                        </NavLink>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 space-y-1">
            <NavLink
              to={`/${user?.role}/profile`}
              onClick={toggleSidebar}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'bg-blue-50 text-[#002B5B]' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >
              {({ isActive }) => (
                <>
                  <User size={17} className={isActive ? 'text-[#002B5B]' : 'text-gray-400'} />
                  <span className={`ml-3 text-[13px] font-medium ${isActive ? 'text-[#002B5B]' : 'text-gray-600'}`}>My Profile</span>
                </>
              )}
            </NavLink>
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={17} />
              <span className="ml-3 text-[13px] font-medium">Logout</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  if (loading) {
    return <SidebarSkeleton />;
  }

  // Desktop sidebar (original)
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
      )}
      <aside
        className={`fixed lg:relative top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-14' : 'w-60'} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-gray-100`}
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className={`h-16 flex-shrink-0 flex items-center justify-between border-b border-gray-100 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'w-full justify-center' : 'space-x-3'}`}>
            <button 
              onClick={toggleCollapse}
              className="w-9 h-9 rounded-lg bg-[#002B5B] flex items-center justify-center shadow-sm hover:bg-[#003d82] transition-colors flex-shrink-0"
            >
              <GraduationCap className="text-white w-5 h-5" />
            </button>
            {!isCollapsed && (
              <span className="font-bold text-[#002B5B] text-[15px] tracking-tight truncate">SmartSchool ERP</span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar pt-3 pb-4 px-2 space-y-0.5">
          {sortedSections.map(sectionKey => {
            const sectionConfig = sections[sectionKey as keyof typeof sections];
            return (
              <div key={sectionKey}>
                {!isCollapsed && sectionConfig?.showTitle && (
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-4 mt-4 mb-1.5">
                    {sectionConfig.title}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {grouped[sectionKey].map(item => (
                    <li key={item.label}>
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className={`w-full flex items-center justify-between rounded-lg px-2 py-2 transition-all duration-200 ${openDropdown === item.label ? 'bg-blue-50 text-[#002B5B]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002B5B]'} ${isCollapsed ? 'justify-center' : ''}`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <item.icon size={18} className={openDropdown === item.label ? 'text-[#002B5B]' : 'text-gray-400'} />
                              {!isCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
                            </div>
                            {!isCollapsed && (
                              <ChevronDown size={12} className={`transition-transform duration-200 text-gray-300 ${openDropdown === item.label ? 'rotate-180 text-blue-500' : ''}`} />
                            )}
                          </button>
                          {openDropdown === item.label && !isCollapsed && (
                            <ul className="mt-0.5 space-y-0.5">
                              {item.subItems.map(sub => (
                                <li key={sub.path}>
                                  <NavLink
                                    to={sub.path}
                                    className={({ isActive }) =>
                                      `flex items-center py-2 pl-10 pr-4 text-[12px] rounded-lg transition-all duration-200 ${isActive ? 'text-[#002B5B] font-semibold bg-blue-50/50' : 'text-gray-500 hover:text-[#002B5B] hover:bg-gray-50'}`
                                    }
                                  >
                                    {sub.label}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.path!}
                          className={({ isActive }) =>
                            `flex items-center rounded-lg px-2 py-2 transition-all duration-200 ${isActive ? 'bg-[#002B5B] text-white shadow-md shadow-blue-900/10 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002B5B]'} ${isCollapsed ? 'justify-center' : ''}`
                          }
                          onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                              {!isCollapsed && <span className="ml-2.5 text-[13px] font-medium">{item.label}</span>}
                            </>
                          )}
                        </NavLink>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <NavLink
            to={`/${user?.role}/profile`}
            className={({ isActive }) =>
              `flex items-center rounded-xl px-2 py-2 transition-all duration-200 ${isActive ? 'bg-blue-50 text-[#002B5B]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#002B5B]'} ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <User size={18} className={isActive ? 'text-[#002B5B]' : 'text-gray-400'} />
                {!isCollapsed && <span className="ml-2.5 text-sm font-medium">My Profile</span>}
              </>
            )}
          </NavLink>
          <button
            onClick={logout}
            className={`w-full flex items-center rounded-xl px-2 py-2 text-red-500 hover:bg-red-50 transition-all duration-200 mt-1 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="ml-2.5 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
