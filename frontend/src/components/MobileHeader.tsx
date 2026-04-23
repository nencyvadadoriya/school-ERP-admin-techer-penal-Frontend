import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, LogOut } from 'lucide-react';
import { FaUser } from 'react-icons/fa';

interface MobileHeaderProps {
  toggleSidebar?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    if (socket) {
      socket.on('notification', (n: any) => {
        setNotifications(prev => [n, ...prev]);
        const a = new Audio('/notification-sound.mp3');
        a.play().catch(() => {});
      });
    }
    return () => { if (socket) socket.off('notification'); };
  }, [socket]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchNotifications = async () => {
    try {
      const r = await notificationAPI.getMyNotifications();
      if (r.data.success) setNotifications(r.data.data);
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getRoleLabel = () => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') return 'Admin Panel';
    if (user?.role === 'teacher') return 'Teacher Panel';
    if (user?.role === 'student') return 'Student Panel';
    return 'SmartSchool ERP';
  };

  return (
    <>
      <style>{`
        .mobile-header-white {
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
        }
        .notif-sheet {
          animation: slideDownFade 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-item-unread { background: linear-gradient(90deg, rgba(45,84,168,0.07) 0%, transparent 100%); }
      `}</style>

      <header className="mobile-header-white sticky top-0 z-30 shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left - Menu Button & Logo */}
          <div className="flex items-center gap-2">
            
            <div className="flex items-center gap-1.5 ml-1">
             
              <p className="text-[#002B5B] font-black text-[13px] tracking-tight whitespace-nowrap">SmartSchool ERP</p>
            </div>
          </div>

          {/* Right - Notifications + Profile */}
          <div className="flex items-center gap-1.5">
            {(user?.role !== 'admin' && user?.role !== 'sub_admin') && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:bg-gray-100 transition-all border border-gray-100 relative"
                >
                  <Bell size={18} className="text-[#002B5B]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-[-45px] mt-2 w-[280px] sm:w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden notif-sheet">
                    <div className="flex items-center justify-between px-2.5 py-2 border-b border-gray-50">
                      <h3 className="text-[11px] font-bold text-[#002B5B]">Notifications {unreadCount > 0 && <span className="ml-1 px-1 py-0.5 text-[7px] text-white rounded-full font-black bg-red-500">{unreadCount}</span>}</h3>
                      <button onClick={() => setShowNotifications(false)} className="p-0.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={12} /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center"><Bell size={20} className="mx-auto text-gray-300 mb-1" /><p className="text-[10px] text-gray-400">No notifications</p></div>
                      ) : notifications.map(n => (
                        <div key={n._id} onClick={() => !n.is_read && markAsRead(n._id)} className={`px-2.5 py-2 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'notif-item-unread' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-[#2D54A8]' : 'bg-gray-200'}`}></div>
                            <div className="flex-1">
                              <p className={`text-[10px] leading-tight ${!n.is_read ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{n.title || n.message}</p>
                              {n.message && n.title && <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{n.message}</p>}
                              <p className="text-[8px] text-gray-300 mt-0.5">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative" ref={profileRef}>
              <div
                className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer border-2 border-gray-100 active:scale-95 transition-transform shadow-sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user?.profile_image
                  ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                  : <FaUser className="text-[#002B5B] text-sm" />
                }
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="p-2 border-b border-gray-50 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#002B5B] flex items-center justify-center text-white font-black text-xs overflow-hidden border border-gray-50 shadow-sm">
                      {user?.profile_image 
                        ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                        : (user?.first_name?.[0] || 'U')
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#002B5B] font-bold text-[11px] truncate leading-none">{user?.first_name} {user?.last_name}</p>
                      <p className="text-gray-400 text-[9px] truncate leading-none mt-1">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
                    >
                      <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center text-red-500">
                        <LogOut size={13} />
                      </div>
                      <span className="font-bold text-[11px] text-red-600">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

    </>
  );
};

export default MobileHeader;