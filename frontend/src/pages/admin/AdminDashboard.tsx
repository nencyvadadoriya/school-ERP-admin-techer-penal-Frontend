import React, { useState, useEffect } from 'react';
import AutoNotificationManager from '../../components/AutoNotificationManager';
import { 
  FaUserGraduate, FaChalkboardTeacher, FaSchool, FaMoneyBillWave, 
  FaCalendarCheck, FaFileAlt, FaChartLine, FaTrophy, FaUsers,
  FaBookOpen, FaPercentage, FaBell
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, ComposedChart 
} from 'recharts';
import { dashboardAPI, attendanceAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalTeachers: 0, 
    totalClasses: 0, 
    attendancePercentage: 0, 
    pendingLeaves: 0, 
    feesCollected: 0,
    feesPending: 0,
    charts: {
      weeklyAttendance: [],
      genderDistribution: [],
      teacherWorkload: []
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAttendance, setCheckingAttendance] = useState<boolean>(false);

  // Sample additional data (replace with API calls)
  const monthlyFeesData = [
    { month: 'Jan', collected: 125000, pending: 45000, target: 170000 },
    { month: 'Feb', collected: 142000, pending: 38000, target: 180000 },
    { month: 'Mar', collected: 158000, pending: 25000, target: 183000 },
    { month: 'Apr', collected: 135000, pending: 42000, target: 177000 },
    { month: 'May', collected: 148000, pending: 35000, target: 183000 },
    { month: 'Jun', collected: 165000, pending: 28000, target: 193000 },
  ];

  const classPerformanceData = [
    { class: '10A', avgScore: 78, students: 42, rank: 2 },
    { class: '10B', avgScore: 74, students: 40, rank: 3 },
    { class: '9A', avgScore: 82, students: 45, rank: 1 },
    { class: '9B', avgScore: 71, students: 43, rank: 4 },
    { class: '8A', avgScore: 79, students: 44, rank: 2 },
    { class: '8B', avgScore: 76, students: 41, rank: 3 },
  ];

  const resultDistribution = [
    { range: '90-100%', students: 45, color: '#10b981' },
    { range: '75-89%', students: 78, color: '#3b82f6' },
    { range: '60-74%', students: 62, color: '#f59e0b' },
    { range: '40-59%', students: 35, color: '#f97316' },
    { range: 'Below 40%', students: 12, color: '#ef4444' },
  ];

  const monthlyAttendance = [
    { month: 'Jan', percentage: 92, target: 90 },
    { month: 'Feb', percentage: 89, target: 90 },
    { month: 'Mar', percentage: 94, target: 90 },
    { month: 'Apr', percentage: 91, target: 90 },
    { month: 'May', percentage: 87, target: 90 },
    { month: 'Jun', percentage: 93, target: 90 },
  ];

  const genderData = [
    { name: 'Boys', value: 245, color: '#3b82f6' },
    { name: 'Girls', value: 220, color: '#ec489a' },
  ];

  const teacherWorkload = [
    { teacher: 'Mr. Sharma', classes: 5, students: 180, rating: 4.5 },
    { teacher: 'Ms. Patel', classes: 4, students: 145, rating: 4.8 },
    { teacher: 'Dr. Singh', classes: 6, students: 210, rating: 4.3 },
    { teacher: 'Mrs. Verma', classes: 3, students: 98, rating: 4.9 },
    { teacher: 'Mr. Kumar', classes: 5, students: 167, rating: 4.2 },
  ];

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.admin();
      setStats(res.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const handleCheckMissingAttendance = async () => {
    setCheckingAttendance(true);
    try {
      const res = await attendanceAPI.checkMissingAttendance();
      if (res.data.success) {
        toast.success(res.data.message + ` Reminders sent to ${res.data.missing_count} teachers.`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to check attendance');
    } finally {
      setCheckingAttendance(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Complete school overview & analytics</p>
          </div>
          <button 
            onClick={handleCheckMissingAttendance}
            disabled={checkingAttendance}
            className={`flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm text-sm font-medium ${checkingAttendance ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <FaBell className={checkingAttendance ? 'animate-bounce' : ''} />
            {checkingAttendance ? 'Checking...' : 'Check Attendance & Notify Teachers'}
          </button>
        </div>

        {/* Auto Notification Center */}
        <AutoNotificationManager />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Existing stats cards... */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Students</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FaUserGraduate className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Teachers</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTeachers}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FaChalkboardTeacher className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Classes</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalClasses || 0}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FaSchool className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Attendance</p>
                <p className="text-xl font-bold text-gray-900">{stats.attendancePercentage || 0}%</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FaCalendarCheck className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Leaves</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingLeaves || 0}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <FaFileAlt className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Fees Collection</p>
                <p className="text-sm font-bold text-gray-900">₹{(stats.feesCollected || 0).toLocaleString()}</p>
              </div>
              <div className="p-2 bg-teal-50 rounded-lg">
                <FaMoneyBillWave className="w-4 h-4 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Existing Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Attendance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaCalendarCheck className="text-orange-500" /> Weekly Attendance Trend
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.weeklyAttendance.length > 0 ? stats.charts.weeklyAttendance : [
                  { name: 'Mon', present: 0, absent: 0 },
                  { name: 'Tue', present: 0, absent: 0 },
                  { name: 'Wed', present: 0, absent: 0 },
                  { name: 'Thu', present: 0, absent: 0 },
                  { name: 'Fri', present: 0, absent: 0 },
                  { name: 'Sat', present: 0, absent: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Fees Collection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaMoneyBillWave className="text-teal-500" /> Monthly Fees Collection
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFeesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" name="Collected" strokeWidth={2} />
                  <Line type="monotone" dataKey="target" stroke="#3b82f6" name="Target" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Class Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" /> Class-wise Performance
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="class" type="category" width={40} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#f59e0b" name="Average Score" radius={[0, 4, 4, 0]}>
                    {classPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.avgScore >= 75 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Result Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaPercentage className="text-purple-500" /> Result Distribution
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="students"
                    label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {resultDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Attendance Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaChartLine className="text-blue-500" /> Attendance Trend
            </h2>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fill="#93c5fd" name="Attendance %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaUsers className="text-pink-500" /> Gender Distribution
            </h2>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.charts.genderDistribution.length > 0 ? stats.charts.genderDistribution : [
                      { name: 'Boys', value: 0, color: '#3b82f6' },
                      { name: 'Girls', value: 0, color: '#ec489a' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {(stats.charts.genderDistribution.length > 0 ? stats.charts.genderDistribution : [
                      { name: 'Boys', value: 0, color: '#3b82f6' },
                      { name: 'Girls', value: 0, color: '#ec489a' },
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Teacher Workload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaChalkboardTeacher className="text-green-500" /> Teacher Workload
            </h2>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.teacherWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="teacher" type="category" width={70} tick={{ fontSize: 10 }} />
                  <Tooltip /> 
                  <Bar dataKey="classes" fill="#8b5cf6" name="Classes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;