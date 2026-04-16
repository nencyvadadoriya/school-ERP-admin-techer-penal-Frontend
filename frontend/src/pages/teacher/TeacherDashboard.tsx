import React, { useState, useEffect } from 'react';
import { 
  FaCalendarCheck, FaUsers, FaClipboardList, FaChalkboardTeacher, 
  FaFileAlt, FaChartLine, FaTrophy, FaGraduationCap, FaUserSlash, FaMoneyBillWave 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area 
} from 'recharts';
import { dashboardAPI, attendanceAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    dashboardAPI.teacher()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Check for missing attendance
    attendanceAPI.checkMyMissingAttendance()
      .then(r => {
        if (r.data.success && r.data.has_missing) {
          const classes = r.data.missing_classes.join(', ');
          toast.warning(`Pending Attendance: You haven't marked attendance for ${classes} today.`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      })
      .catch(err => console.error('Error checking missing attendance:', err));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base md:text-lg font-bold text-gray-900">Welcome, {user?.first_name || 'Teacher'}</h1>
        <p className="text-gray-500 text-xs mt-0.5">Here's your overview for today</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard title="My Classes" value={data?.myClasses?.length || 0} icon={FaChalkboardTeacher} color="blue" />
        <StatCard title="Total Students" value={data?.totalStudentsInClasses || 0} icon={FaUsers} color="green" />
        <StatCard 
          title="Student Leaves" 
          value={data?.pendingStudentLeaves || 0} 
          icon={FaFileAlt} 
          color={data?.pendingStudentLeaves > 0 ? "orange" : "blue"} 
          subtitle="pending approval" 
        />
        <StatCard title="Homework Given" value={data?.homeworkGiven || 0} icon={FaClipboardList} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaChartLine className="text-blue-500" /> Monthly Attendance Trend
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fill="#93c5fd" name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Strength Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaUsers className="text-green-500" /> Class Strength (Boys vs Girls)
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.classStrength || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class_code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="boys" fill="#3b82f6" name="Boys" />
                <Bar dataKey="girls" fill="#ec489a" name="Girls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Subject-wise Performance
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.subjectPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#f59e0b" name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaMoneyBillWave className="text-teal-500" /> Students Fee Status
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: data?.charts?.feeStatus?.paid || 0 },
                    { name: 'Partial', value: data?.charts?.feeStatus?.partial || 0 },
                    { name: 'Unpaid', value: data?.charts?.feeStatus?.unpaid || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaGraduationCap className="text-indigo-500" /> Top Performing Students
          </h2>
          <div className="space-y-3">
            {data?.charts?.topStudents?.length > 0 ? (
              data.charts.topStudents.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  <span className="text-sm font-bold text-blue-600">{s.avg}%</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No data available</p>
            )}
          </div>
        </div>

        {/* Weak Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaUserSlash className="text-red-500" /> Students Needing Attention
          </h2>
          <div className="space-y-3">
            {data?.charts?.weakStudents?.length > 0 ? (
              data.charts.weakStudents.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  <span className="text-sm font-bold text-red-600">{s.avg}%</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No data available</p>
            )}
          </div>
        </div>

        {/* Homework Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaClipboardList className="text-purple-500" /> Homework Distribution by Subject
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.homeworkData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Homework Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holiday / Leave Impact Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FaCalendarCheck className="text-orange-500" /> Today's Leave Impact
          </h2>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.holidayImpact || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">My Classes</h2>
          {!data?.myClasses?.length ? <p className="text-gray-400 text-xs">No classes assigned</p>
          : <div className="space-y-2">
            {data.myClasses.map((c: any, idx: number)=>(
              <div key={c._id || c.class_code || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{c.class_code}</p>
                  <p className="text-xs text-gray-500">Std {c.standard} – {c.division} | {c.medium}</p>
                </div>
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">{c.shift}</span>
              </div>
            ))}
          </div>}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Upcoming Exams</h2>
          {!data?.upcomingExamsNext2Days?.length ? <p className="text-gray-400 text-xs">No exams in next 2 days</p>
          : <div className="space-y-2">
            {data.upcomingExamsNext2Days.map((ex: any, idx: number)=>(
              <div key={ex._id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{ex.exam_name}</p>
                  <p className="text-xs text-gray-500">{ex.class_code} | {ex.subject_code}</p>
                </div>
                <p className="text-xs text-gray-500">{new Date(ex.exam_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">My Leave Applications</h2>
          {!data?.myLeaves?.length ? <p className="text-gray-400 text-xs">No leave applications</p>
          : <table className="w-full text-xs">
            <thead><tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">From</th><th className="pb-2 font-medium">To</th><th className="pb-2 font-medium">Status</th>
            </tr></thead>
            <tbody>{data.myLeaves.map((l: any, idx: number)=>(
              <tr key={l._id || idx} className="border-t border-gray-50">
                <td className="py-2">{l.leave_type}</td>
                <td className="py-2">{new Date(l.from_date).toLocaleDateString()}</td>
                <td className="py-2">{new Date(l.to_date).toLocaleDateString()}</td>
                <td className="py-2"><Badge status={l.status} /></td>
              </tr>
            ))}</tbody>
          </table>}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
