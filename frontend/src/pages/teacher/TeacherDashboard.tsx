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
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  useEffect(() => {
    dashboardAPI.teacher()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    attendanceAPI.checkMyMissingAttendance()
      .then(r => {
        if (r.data.success && r.data.has_missing) {
          const classes = r.data.missing_classes.join(', ');
          toast.warning(`Pending Attendance: You haven't marked attendance for ${classes} today.`, {
            position: "top-right",
            autoClose: 5000,
          });
        }
      })
      .catch(err => console.error('Error checking missing attendance:', err));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
    </div>
  );

  return (
    <div className="space-y-4 p-3 md:p-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>
            Welcome back, {user?.first_name || 'Teacher'}!
          </h1>
          <p className="text-[10px] font-medium text-gray-500">Here's your school overview for today</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-gray-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-[10px] text-gray-400">School Session 2024-25</p>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
            <FaCalendarCheck size={18} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: "My Classes", value: data?.myClasses?.length || 0, icon: FaChalkboardTeacher, color: '#3b82f6', bg: 'bg-blue-50' },
          { title: "Total Students", value: data?.totalStudentsInClasses || 0, icon: FaUsers, color: '#10b981', bg: 'bg-green-50' },
          { title: "Student Leaves", value: data?.pendingStudentLeaves || 0, icon: FaFileAlt, color: '#f59e0b', bg: 'bg-amber-50', sub: 'pending' },
          { title: "Homework Given", value: data?.homeworkGiven || 0, icon: FaClipboardList, color: '#8b5cf6', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow group`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bg}`} style={{ color: stat.color }}>
                <stat.icon size={16} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Status</span>
            </div>
            <h3 className="text-xl font-black" style={{ color: theme.primary }}>{stat.value}</h3>
            <p className="text-xs font-bold text-gray-500">{stat.title}</p>
            {stat.sub && <p className="text-[8px] font-medium text-amber-600 uppercase tracking-tight">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black flex items-center gap-2" style={{ color: theme.primary }}>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><FaChartLine size={12} /></div>
              Monthly Attendance
            </h2>
            <select className="text-[10px] font-bold bg-gray-50 border-none rounded-lg px-2 py-1 outline-none">
              <option>Last 6 Months</option>
            </select>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts?.attendanceTrend || []}>
                <defs>
                  <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                />
                <Area type="monotone" dataKey="percentage" stroke={theme.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorAttend)" name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Strength */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black flex items-center gap-2" style={{ color: theme.primary }}>
              <div className="p-1.5 rounded-lg bg-green-50 text-green-600"><FaUsers size={12} /></div>
              Gender Distribution
            </h2>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.classStrength || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class_code" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '10px', fontWeight: 'bold'}} />
                <Bar dataKey="boys" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={15} name="Boys" />
                <Bar dataKey="girls" fill="#ec489a" radius={[4, 4, 0, 0]} barSize={15} name="Girls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* performance and fee status grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
          {/* Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: theme.primary }}>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><FaTrophy size={12} /></div>
              Subject Performance
            </h2>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts?.subjectPerformance || []} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} width={60} />
                  <Tooltip contentStyle={{borderRadius: '10px', border: 'none', fontSize: '10px'}} />
                  <Bar dataKey="avgScore" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} name="Avg %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 justify-center" style={{ color: theme.primary }}>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600"><FaMoneyBillWave size={12} /></div>
              Fee Collection
            </h2>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: data?.charts?.feeStatus?.paid || 0 },
                      { name: 'Partial', value: data?.charts?.feeStatus?.partial || 0 },
                      { name: 'Unpaid', value: data?.charts?.feeStatus?.unpaid || 0 }
                    ]}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" stroke="none" />
                    <Cell fill="#f59e0b" stroke="none" />
                    <Cell fill="#ef4444" stroke="none" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Classes and Exams */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-black" style={{ color: theme.primary }}>My Classes</h2>
            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Session</span>
          </div>
          <div className="p-3 space-y-2">
            {!data?.myClasses?.length ? (
              <p className="text-center py-6 text-[10px] text-gray-400 font-medium">No classes assigned</p>
            ) : (
              data.myClasses.map((c: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs shadow-sm" style={{ color: theme.primary }}>
                      {c.standard}{c.division}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.class_code}</p>
                      <p className="text-[9px] text-gray-500 font-medium">{c.medium} Medium | {c.shift}</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-primary-600"><FaChartLine size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-black" style={{ color: theme.primary }}>Upcoming Exams</h2>
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><FaCalendarCheck size={12} /></div>
          </div>
          <div className="p-3 space-y-2">
            {!data?.upcomingExamsNext2Days?.length ? (
              <p className="text-center py-6 text-[10px] text-gray-400 font-medium">No schedules found</p>
            ) : (
              data.upcomingExamsNext2Days.map((ex: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{ex.exam_name}</p>
                    <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider">{ex.class_code} • {ex.subject_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-900">{new Date(ex.exam_date).toLocaleDateString()}</p>
                    <p className="text-[8px] text-gray-500 font-bold uppercase">Date</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
