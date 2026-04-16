import React, { useState, useEffect } from 'react';
import { noticeAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

const TeacherNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotices = async () => {
    try {
      const r = await noticeAPI.getAll();
      // Filter for notices relevant to teachers or all
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        <p className="text-sm text-gray-500">School notices (Added by Admin)</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {notices.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            No notices yet
          </div>
        ) : (
          notices.map((n) => (
            <div key={n._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <Badge status={n.priority} />
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {n.target_audience}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Published: {new Date(n.createdAt).toLocaleDateString()} by {n.published_by}
                  </p>
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
