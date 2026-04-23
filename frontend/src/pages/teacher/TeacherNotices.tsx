import React, { useState, useEffect } from 'react';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { noticeAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { FileText, RefreshCcw, User, Calendar, Info } from 'lucide-react';

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
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-16 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-black tracking-tight">School Notices</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Official Announcements</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="px-4 md:px-8 -mt-10 md:mt-8 space-y-4 relative z-20">
        {/* Desktop Only Actions Card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-gray-100 p-6 items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">School Notices</h1>
            <p className="text-sm font-medium text-gray-500">Official announcements and important updates from management</p>
          </div>
         
        </div>

        {/* Notices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {notices.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <FileText size={24} />
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1">No Active Notices</h3>
              <p className="text-[10px] font-medium text-gray-400">Announcements will appear here.</p>
            </div>
          ) : (
            notices.map((n) => (
              <div key={n._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col relative group hover:shadow-md transition-all">
                <div className="absolute top-2.5 right-2.5 scale-[0.6] transform origin-top-right">
                  <Badge status={n.priority} />
                </div>

                <div className="flex-grow pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded-lg bg-[#002B5B]/5 text-[#002B5B] text-[7px] font-black uppercase tracking-wider">
                      {n.target_audience}
                    </span>
                  </div>

                  <h3 className="text-[10px] font-black text-gray-900 mb-1 leading-tight group-hover:text-[#002B5B] transition-colors line-clamp-2">
                    {n.title}
                  </h3>

                  <p className="text-[9px] font-medium text-gray-500 leading-relaxed line-clamp-3">
                    {n.content}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><User size={8} /> By</span>
                    <span className="text-[8px] font-bold text-gray-700">{n.published_by || 'Admin'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end"><Calendar size={8} /> Date</span>
                    <span className="text-[8px] font-bold text-gray-700">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherNotices;
