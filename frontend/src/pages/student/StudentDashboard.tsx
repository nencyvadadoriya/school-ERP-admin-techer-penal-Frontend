import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaClipboardList, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { dashboardAPI, homeworkAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    dashboardAPI.student()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Check for new homework assigned today
    homeworkAPI.checkMyHomework()
      .then(r => {
        if (r.data.success && r.data.has_new_homework) {
          r.data.homework.forEach((hw: any) => {
            toast.info(`New Homework: ${hw.title} assigned by ${hw.teacher_name} for ${hw.subject_code}`, {
              position: "top-right",
              autoClose: 6000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          });
        }
      })
      .catch(err => console.error('Error checking new homework:', err));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.first_name || 'Student'}</h1>
        <p className="text-gray-500 text-sm">Here's your school overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Attendance" value={`${data?.attendancePercentage || 0}%`} icon={FaCalendarCheck} color="green" />
        <StatCard title="Homework" value={data?.pendingHomework || 0} icon={FaClipboardList} color="blue" subtitle="pending" />
        <StatCard title="Fees Due" value={`₹${data?.feeDue || 0}`} icon={FaMoneyBillWave} color="red" />
        <StatCard title="Exams" value={data?.upcomingExams?.length || 0} icon={FaClock} color="purple" subtitle="upcoming" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Exams</h2>
          {!data?.upcomingExams?.length ? (
            <p className="text-gray-400">No upcoming exams</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingExams.map((ex: any) => (
                <div key={ex._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{ex.exam_name}</p>
                    <p className="text-sm text-gray-400">{ex.subject_code} | {new Date(ex.exam_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Latest Notices</h2>
          {!data?.notices?.length ? (
            <p className="text-gray-400">No new notices</p>
          ) : (
            <div className="space-y-3">
              {data.notices.map((n: any) => (
                <div key={n._id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;