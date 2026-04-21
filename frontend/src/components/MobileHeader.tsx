import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, Menu, School } from 'lucide-react';
import { FaUser } from 'react-icons/fa';

interface MobileHeaderProps {
  toggleSidebar?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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
    <div className="hidden">
      <style>{`
        .mobile-header-gradient {
          background: linear-gradient(135deg, #002B5B 0%, #1a3f7a 50%, #2D54A8 100%);
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

      <header className="mobile-header-gradient sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left spacer to center logo */}
          <div className="w-9" />

          {/* Center - Logo + Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <School size={15} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[14px] leading-tight tracking-wide">SmartSchool ERP</p>
            </div>
          </div>

          {/* Right - Notifications + Avatar */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 transition-colors relative"
              >
                <Bell size={18} className="text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notif-sheet absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" style={{ right: '-12px' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #002B5B, #2D54A8)' }}>
                    <h3 className="text-sm font-bold text-white">
                      Notifications {unreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-red-500 text-white rounded-full font-black">{unreadCount}</span>
                      )}
                    </h3>
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg bg-white/10 text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No notifications</p>
                      </div>
                    ) : notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => !n.is_read && markAsRead(n._id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer ${!n.is_read ? 'notif-item-unread' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                          <div className="flex-1">
                            <p className={`text-xs ${!n.is_read ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{n.title || n.message}</p>
                            {n.message && n.title && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>}
                            <p className="text-[10px] text-gray-300 mt-1">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white/20 cursor-pointer"
              onClick={() => navigate(`/${user?.role}/profile`)}
            >
              {user?.profile_image
                ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                : <FaUser className="text-white text-sm" />
              }
            </div>
          </div>
        </div>

        {/* User info bar */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-green-400"></div>
          <p className="text-white/80 text-[11px] font-medium">{user?.first_name} {user?.last_name}</p>
          <span className="text-white/30 text-[11px]">•</span>
          <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Admin Panel</p>
          <span className="text-white/30 text-[11px]">•</span>
          <p className="text-white/50 text-[11px]">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        </div>
      </header>
    </div>
  );
};

export default MobileHeader;