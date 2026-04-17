import React, { useState } from 'react';
import api from '../services/api';
import { FaBell, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AutoNotificationManager: React.FC = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

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

  const notificationTypes = [
    { label: 'Homework Reminders', endpoint: 'homework-reminders', color: 'blue' },
    { label: 'Fees Due Alerts', endpoint: 'fees-alerts', color: 'orange' },
    { label: 'Exam Date Alerts', endpoint: 'exam-alerts', color: 'purple' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
          <FaBell className="text-xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Auto Notifications Center</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4 italic">
        Send automated reminders via In-app, Email, and SMS.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notificationTypes.map((notif) => (
          <button
            key={notif.endpoint}
            disabled={loading[notif.label]}
            onClick={() => handleSendNotification(notif.label, notif.endpoint)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 
              ${loading[notif.label] 
                ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                : `bg-${notif.color}-50 border-${notif.color}-100 hover:border-${notif.color}-300 hover:shadow-md active:scale-95`
              }`}
          >
            <div className={`mb-2 p-2 rounded-full bg-${notif.color}-100 text-${notif.color}-600`}>
              {loading[notif.label] ? (
                <FaSpinner className="animate-spin text-lg" />
              ) : (
                <FaBell className="text-lg" />
              )}
            </div>
            <span className={`text-[11px] font-bold text-${notif.color}-700`}>{notif.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AutoNotificationManager;
