import React, { useState } from 'react';
import api from '../services/api';
import { FaBell, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface AutoNotificationManagerProps {
  darkMode?: boolean;
}

const AutoNotificationManager: React.FC<AutoNotificationManagerProps> = ({ darkMode = false }) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Theme colors
  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    accent: '#FFC107',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  const handleSendNotification = async (type: string, endpoint: string) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      await api.post(`/auto-notifications/${endpoint}`);
      toast.success(`${type} notifications sent successfully!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to send ${type} notifications`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const studentNotifications = [
    { label: 'Homework', endpoint: 'homework-reminder' },
    { label: 'Exam Date', endpoint: 'exam-date' },
    { label: 'Result', endpoint: 'result-publish' },
  ];

  const teacherNotifications = [
    { label: 'Homework', endpoint: 'homework-assign-reminder' },
    { label: 'Meeting', endpoint: 'meeting-alert' },
    { label: 'Message', endpoint: 'admin-message' },
  ];

  // Get color based on index for consistent theme
  const getButtonStyle = (index: number, isLoading: boolean) => {
    const colors = [
      { bg: theme.primary, lightBg: '#E8EEF5', text: theme.primary },
      { bg: theme.secondary, lightBg: '#EAF0FA', text: theme.secondary },
      { bg: theme.accent, lightBg: '#FFF8E7', text: '#B8860B' },
    ];
    
    const color = colors[index % colors.length];
    
    if (isLoading) {
      return {
        backgroundColor: darkMode ? '#374151' : '#F3F4F6',
        color: darkMode ? '#9CA3AF' : '#6B7280',
        border: 'none'
      };
    }
    
    if (darkMode) {
      return {
        backgroundColor: `${color.bg}20`,
        color: '#FFFFFF',
        border: `1px solid ${color.bg}40`
      };
    }
    
    return {
      backgroundColor: color.lightBg,
      color: color.text,
      border: `1px solid ${color.bg}20`
    };
  };

  return (
    <div className={`rounded-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <FaBell size={18} style={{ color: theme.primary }} />
        <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Notifications</h3>
      </div>

      {/* Student Notifications */}
      <div className="mb-4">
        <p className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider mb-3`}>Students</p>
        <div className="grid grid-cols-3 gap-3">
          {studentNotifications.map((notif, idx) => (
            <button
              key={notif.endpoint}
              disabled={loading[notif.label]}
              onClick={() => handleSendNotification(notif.label, notif.endpoint)}
              style={getButtonStyle(idx, loading[notif.label])}
              className="py-3 px-2 rounded-lg text-xs font-medium transition-all text-center hover:opacity-80"
            >
              {loading[notif.label] ? (
                <FaSpinner className="animate-spin inline mr-1 text-xs" />
              ) : (
                <FaBell size={11} className="inline mr-1" />
              )}
              {notif.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher Notifications */}
      <div>
        <p className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider mb-3`}>Teachers</p>
        <div className="grid grid-cols-3 gap-3">
          {teacherNotifications.map((notif, idx) => (
            <button
              key={notif.endpoint}
              disabled={loading[notif.label]}
              onClick={() => handleSendNotification(notif.label, notif.endpoint)}
              style={getButtonStyle(idx + 1, loading[notif.label])}
              className="py-3 px-2 rounded-lg text-xs font-medium transition-all text-center hover:opacity-80"
            >
              {loading[notif.label] ? (
                <FaSpinner className="animate-spin inline mr-1 text-xs" />
              ) : (
                <FaBell size={11} className="inline mr-1" />
              )}
              {notif.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutoNotificationManager;