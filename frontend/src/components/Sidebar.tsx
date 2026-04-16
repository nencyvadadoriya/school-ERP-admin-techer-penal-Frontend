import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconType } from 'react-icons';

import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaCalendarCheck,
  FaClipboardList,
  FaMoneyBillWave,
  FaBell,
  FaCalendarAlt,
  FaFileAlt,
  FaClock,
  FaSignOutAlt,
  FaUser,
  FaSchool,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

interface MenuItem {
  path: string;
  icon: IconType;
  label: string;
  section: string;
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const adminMenuItems: MenuItem[] = [
    { path: '/admin/dashboard', icon: FaTachometerAlt, label: 'Dashboard', section: 'main' },
    { path: '/admin/admins', icon: FaUser, label: 'Admin Management', section: 'management' },
    { path: '/admin/students', icon: FaUserGraduate, label: 'Students', section: 'management' },
    { path: '/admin/teachers', icon: FaChalkboardTeacher, label: 'Teachers', section: 'management' },
    { path: '/admin/subject-assignment', icon: FaBook, label: 'Subject Assignment', section: 'management' },
    { path: '/admin/assign-class-teacher', icon: FaChalkboardTeacher, label: 'Assign Class Teacher', section: 'management' },
    { path: '/admin/classes', icon: FaSchool, label: 'Classes', section: 'management' },
    { path: '/admin/subjects', icon: FaBook, label: 'Subjects', section: 'management' },
    { path: '/admin/attendance', icon: FaCalendarCheck, label: 'Attendance', section: 'academic' },
    { path: '/admin/exams', icon: FaClipboardList, label: 'Exams', section: 'academic' },
    { path: '/admin/fees', icon: FaMoneyBillWave, label: 'Fees', section: 'finance' },
    { path: '/admin/notices', icon: FaBell, label: 'Notices', section: 'communication' },
    { path: '/admin/events', icon: FaCalendarAlt, label: 'Events', section: 'communication' },
    { path: '/admin/leaves', icon: FaFileAlt, label: 'Leave Management', section: 'communication' },
    { path: '/admin/timetable', icon: FaClock, label: 'Timetable', section: 'academic' },
    { path: '/admin/calendar', icon: FaCalendarAlt, label: 'Holiday Calendar', section: 'academic' },
  ];

  const teacherMenuItems: MenuItem[] = [
    { path: '/teacher/dashboard', icon: FaTachometerAlt, label: 'Dashboard', section: 'main' },
    { path: '/teacher/attendance', icon: FaCalendarCheck, label: 'Attendance', section: 'academic' },
    { path: '/teacher/homework', icon: FaClipboardList, label: 'Homework', section: 'academic' },
    { path: '/teacher/exams', icon: FaClipboardList, label: 'Exams', section: 'academic' },
    { path: '/teacher/results', icon: FaFileAlt, label: 'Results', section: 'academic' },
    { path: '/teacher/timetable', icon: FaClock, label: 'Timetable', section: 'academic' },
    { path: '/teacher/calendar', icon: FaCalendarAlt, label: 'Holiday Calendar', section: 'academic' },
    { path: '/teacher/leaves', icon: FaFileAlt, label: 'Student Leaves', section: 'communication' },
    { path: '/teacher/notices', icon: FaBell, label: 'Notices', section: 'communication' },
    { path: '/teacher/events', icon: FaCalendarAlt, label: 'Events', section: 'communication' },
    { path: '/teacher/leave', icon: FaFileAlt, label: 'Leave Application', section: 'communication' },
  ];

  const studentMenuItems: MenuItem[] = [
    { path: '/student/dashboard', icon: FaTachometerAlt, label: 'Dashboard', section: 'main' },
    { path: '/student/attendance', icon: FaCalendarCheck, label: 'Attendance', section: 'academic' },
    { path: '/student/homework', icon: FaClipboardList, label: 'Homework', section: 'academic' },
    { path: '/student/results', icon: FaFileAlt, label: 'Results', section: 'academic' },
    { path: '/student/fees', icon: FaMoneyBillWave, label: 'Fees', section: 'finance' },
    { path: '/student/timetable', icon: FaClock, label: 'Timetable', section: 'academic' },
    { path: '/student/calendar', icon: FaCalendarAlt, label: 'Holiday Calendar', section: 'academic' },
    { path: '/student/notices', icon: FaBell, label: 'Notices & Events', section: 'communication' },
    { path: '/student/leave', icon: FaFileAlt, label: 'Leave Application', section: 'communication' },
  ];

  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'admin') return adminMenuItems;
    if (user?.role === 'teacher') return teacherMenuItems;
    if (user?.role === 'student') return studentMenuItems;
    return [];
  };

  // Group menu items by section
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
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(item);
    });

    return { grouped, sections };
  };

  const { grouped, sections } = groupMenuItemsBySection(getMenuItems());

  // Sort sections by order
  const sortedSections = Object.keys(grouped).sort((a, b) =>
    (sections[a]?.order || 999) - (sections[b]?.order || 999)
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary-500 text-white p-2 rounded-lg shadow-lg"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 z-50 lg:z-auto h-screen bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-20' : 'w-56'
          } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:transform-none`}
      >
        {/* Logo Section with Collapse Button */}
        <div className={`h-14 flex-shrink-0 flex items-center justify-between border-b border-gray-200 bg-primary-500 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-white">School ERP</h1>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="text-white hover:bg-primary-600 p-1 rounded-lg transition-colors hidden lg:block"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Menu Items with Section Titles - Scrollable Area */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-2">
          {!isCollapsed ? (
            // Expanded view with section titles
            <div className="space-y-4">
              {sortedSections.map(sectionKey => {
                const sectionConfig = sections[sectionKey];
                const shouldShowTitle = sectionConfig?.showTitle !== false;

                return (
                  <div key={sectionKey}>
                    {shouldShowTitle && sectionConfig?.title && (
                      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                        {sectionConfig.title}
                      </h3>
                    )}
                    <ul className="space-y-0.5">
                      {grouped[sectionKey].map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              `flex items-center rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-50 text-primary-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              } space-x-2 px-3 py-2`
                            }
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                          >
                            <item.icon className="text-sm flex-shrink-0" />
                            <span className="text-[11px] font-medium truncate">{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            // Collapsed view - only icons with tooltips, no section titles
            <ul className="space-y-0.5">
              {sortedSections.map(sectionKey => (
                <React.Fragment key={sectionKey}>
                  {grouped[sectionKey].map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center justify-center rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } px-2 py-3`
                        }
                        onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                        title={item.label}
                      >
                        <item.icon className="text-base flex-shrink-0" />
                      </NavLink>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          )}
        </nav>

        {/* Profile & Logout - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 p-2">
          {!isCollapsed ? (
            <div className="space-y-0.5">
              <NavLink
                to={`/${user?.role}/profile`}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } space-x-2 px-3 py-2`
                }
              >
                <FaUser className="text-sm flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">Profile</span>
              </NavLink>
              <button
                onClick={logout}
                className="w-full flex items-center rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 space-x-2 px-3 py-2"
              >
                <FaSignOutAlt className="text-sm flex-shrink-0" />
                <span className="text-[11px] font-medium truncate">Logout</span>
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <NavLink
                to={`/${user?.role}/profile`}
                className={({ isActive }) =>
                  `flex items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } px-2 py-3`
                }
                title="Profile"
              >
                <FaUser className="text-base flex-shrink-0" />
              </NavLink>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 px-2 py-3"
                title="Logout"
              >
                <FaSignOutAlt className="text-base flex-shrink-0" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;