import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaUser, FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, CheckCircle } from 'lucide-react';

const theme = { primary: '#002B5B', secondary: '#2D54A8' };

interface HeaderProps { toggleSidebar?: () => void; }

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    fetchNotifications();
    if (socket) {
      socket.on('notification', (n: any) => { setNotifications(prev => [n, ...prev]); const a = new Audio('/notification-sound.mp3'); a.play().catch(() => {}); });
    }
    return () => { if (socket) socket.off('notification'); };
  }, [socket]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowNotifications(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchNotifications = async () => {
    try { const r = await notificationAPI.getMyNotifications(); if (r.data.success) setNotifications(r.data.data); } catch {}
  };

  const markAsRead = async (id: string) => {
    try { await notificationAPI.markAsRead(id); setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n)); } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <FaBars />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-black" style={{ backgroundColor: '#EF4444' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h3 className="text-sm font-bold" style={{ color: theme.primary }}>Notifications {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-[9px] text-white rounded-full font-black" style={{ backgroundColor: '#EF4444' }}>{unreadCount}</span>}</h3>
                <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={14} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center"><Bell size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No notifications</p></div>
                ) : notifications.map(n => (
                  <div key={n._id} onClick={() => !n.is_read && markAsRead(n._id)} className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? '' : 'bg-gray-200'}`} style={!n.is_read ? { backgroundColor: theme.secondary } : {}}></div>
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

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
            {user?.profile_image
              ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
              : <FaUser className="text-white text-sm" />
            }
          </div>
          <span className="hidden md:block text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
