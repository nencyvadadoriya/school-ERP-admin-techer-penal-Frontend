import React, { useState, useEffect } from 'react';
import { noticeAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { FaFileAlt } from 'react-icons/fa';

const TeacherNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  const fetchNotices = async () => {
    try {
      const r = await noticeAPI.getAll();
      const allNotices = r.data.data || [];
      const teacherNotices = allNotices.filter((n: any) => 
        n.target_audience === 'All' || n.target_audience === 'Teachers'
      );
      setNotices(teacherNotices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      <p className="text-sm font-bold text-gray-500 animate-pulse">Loading school notices...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>School Notices</h1>
          <p className="text-[10px] font-medium text-gray-500">Official announcements and important updates from management</p>
        </div>
        <button onClick={fetchNotices} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold border border-gray-200 transition-all active:scale-95 hover:bg-gray-100 text-[11px]">
          Refresh Notices
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {notices.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FaFileAlt size={24} />
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">No Active Notices</h3>
            <p className="text-[10px] font-medium text-gray-500 max-w-xs mx-auto">
              There are no new announcements at the moment.
            </p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-4 flex flex-col relative overflow-hidden group">
              {/* Priority Indicator */}
              <div className="absolute top-0 right-0 p-3 scale-75 transform origin-top-right">
                <Badge status={n.priority} />
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-[8px] font-black uppercase tracking-wider">
                    {n.target_audience}
                  </span>
                </div>

                <h3 className="text-sm font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                  {n.title}
                </h3>

                <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-3">
                  {n.content}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Published By</span>
                  <span className="text-[10px] font-bold text-gray-700">{n.published_by || 'Admin'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Date</span>
                  <span className="text-[10px] font-bold text-gray-700">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherNotices;
