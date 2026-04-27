import React, { useState, useEffect } from 'react';
import Skeleton, { DashboardSkeleton } from '../../components/Skeleton';
import {
  CalendarCheck, Users, ClipboardList, Presentation,
  FileText, BarChart3, Trophy, GraduationCap, UserMinus, Banknote,
  TrendingUp, ChevronDown, Clock, AlertTriangle, History, X, ShieldCheck, Calendar, Library
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { dashboardAPI, attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Static Data for charts and lists
  const staticData = {
    charts: {
      attendanceTrend: [
        { month: 'Jan', percentage: 85 },
        { month: 'Feb', percentage: 88 },
        { month: 'Mar', percentage: 92 },
        { month: 'Apr', percentage: 90 },
        { month: 'May', percentage: 87 },
        { month: 'Jun', percentage: 94 },
      ],
      classStrength: [
        { class_code: '10A', boys: 25, girls: 20 },
        { class_code: '10B', boys: 22, girls: 23 },
        { class_code: '9A', boys: 20, girls: 25 },
        { class_code: '9B', boys: 18, girls: 22 },
      ],
      subjectPerformance: [
        { subject: 'Mathematics', avgScore: 78, class: '10A' },
        { subject: 'Physics', avgScore: 82, class: '10B' },
        { subject: 'Chemistry', avgScore: 75, class: '9A' },
        { subject: 'Mathematics', avgScore: 85, class: '9B' },
      ],
      studentPerformanceTrend: [
        { week: 'W1', score: 72 },
        { week: 'W2', score: 75 },
        { week: 'W3', score: 78 },
        { week: 'W4', score: 82 },
      ],
      behaviorAnalysis: [
        { name: 'Excellent', value: 45, color: '#10B981' },
        { name: 'Good', value: 35, color: '#3B82F6' },
        { name: 'Average', value: 15, color: '#F59E0B' },
        { name: 'Below Avg', value: 5, color: '#EF4444' },
      ],
      schoolResources: [
        { resource: 'Library', usage: 88 },
        { resource: 'Lab', usage: 72 },
        { resource: 'Sports', usage: 65 },
        { resource: 'IT', usage: 92 },
      ]
    },
    upcomingExamsNext2Days: [
      { exam_name: 'Unit Test 1', class_code: '10A', subject_code: 'MATH', exam_date: new Date().toISOString() },
      { exam_name: 'Weekly Quiz', class_code: '9B', subject_code: 'PHY', exam_date: new Date(Date.now() + 86400000).toISOString() },
    ],
    myClasses: [
      { standard: '10', division: 'A', class_code: '10-A-MS', medium: 'English', shift: 'Morning' },
      { standard: '10', division: 'B', class_code: '10-B-MS', medium: 'English', shift: 'Morning' },
      { standard: '9', division: 'A', class_code: '9-A-MS', medium: 'English', shift: 'Morning' },
      { standard: '9', division: 'B', class_code: '9-B-MS', medium: 'English', shift: 'Morning' },
    ],
    totalStudentsInClasses: 185,
    pendingStudentLeaves: 4,
    homeworkGiven: 12
  };
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showStatsSheet, setShowStatsSheet] = useState<boolean>(false);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    accent: '#FFC107',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);

    dashboardAPI.teacher()
      .then(r => {
        const apiData = r.data.data || {};
        const mergedCharts = {
          ...staticData.charts,
          ...(apiData.charts || {})
        };
        setData({ 
          ...staticData, 
          ...apiData,
          charts: mergedCharts
        });
      })
      .catch((err) => {
        console.error('Dashboard API Error:', err);
        setData(staticData);
      })
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

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => setIsMobile(window.innerWidth < 768);

  if (loading) return <DashboardSkeleton />;

  // ─── MOBILE VIEW ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F0F2F5]">
        <style>{`
          .stats-sheet-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;backdrop-filter:blur(3px); }
          .stats-sheet { position:fixed;bottom:0;left:0;right:0;z-index:201;border-radius:24px 24px 0 0;max-height:85vh;overflow-y:auto;animation:slideUp 0.3s cubic-bezier(0.4,0,0.2,1); }
          @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
          .mobile-header-gradient {
            background: #002B5B;
            border-radius: 0 0 32px 32px;
            padding: 40px 20px 80px 20px;
            margin-bottom: -60px;
          }
          .pending-row { display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;margin-bottom:8px; }
        `}</style>

        <div className="relative">
          {/* Header */}
          <div className="mobile-header-gradient text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black tracking-tight">Welcome, {user?.first_name || 'Teacher'}</h2>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <div className="flex items-center gap-1.5 font-medium uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-white/40" />
                  <span>TEACHER PANEL</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar size={12} className="text-white/40" />
                  <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          <div className="p-4 space-y-5 relative z-20 pb-24">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 px-1">
              {[
                { Icon: Library, lbl: 'My Classes', val: data?.myClasses?.length || 0, color: '#3B82F6', bg: '#EFF6FF' },
                { Icon: GraduationCap, lbl: 'Students', val: data?.totalStudentsInClasses || 0, color: '#10B981', bg: '#ECFDF5' },
                { Icon: CalendarCheck, lbl: 'Leaves', val: data?.pendingStudentLeaves || 0, color: '#F59E0B', bg: '#FFFBEB' },
                { Icon: ClipboardList, lbl: 'Homework', val: data?.homeworkGiven || 0, color: '#8B5CF6', bg: '#F5F3FF' },
                { Icon: Trophy, lbl: 'Exams', val: data?.upcomingExamsNext2Days?.length || 0, color: '#EF4444', bg: '#FEF2F2' },
                { Icon: History, lbl: 'Notices', val: 0, color: '#6366F1', bg: '#EEF2FF' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white px-2 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center justify-center min-h-[85px]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-1.5 shadow-sm border border-gray-50"
                    style={{ backgroundColor: s.bg }}
                  >
                    <s.Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div className="w-full px-1">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-tight leading-none truncate mb-1">{s.lbl}</p>
                    <p className="text-[11px] font-black text-gray-900 leading-none">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Stats Button */}
            <button
              onClick={() => setShowStatsSheet(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>View Analytics & Schedules</span>
              </div>
              <ChevronDown size={16} />
            </button>

            {/* Upcoming Exams */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={15} style={{ color: theme.primary }} />
                Upcoming Exams
              </h3>
              <div className="space-y-2">
                {!data?.upcomingExamsNext2Days?.length ? (
                  <p className="text-center py-4 text-[11px] text-gray-400 font-medium">No exams scheduled for next 2 days</p>
                ) : (
                  data.upcomingExamsNext2Days.map((ex: any, idx: number) => (
                    <div key={idx} className="pending-row" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-red-700">{ex.exam_name}</span>
                        <span className="text-[9px] text-red-500 font-bold uppercase">{ex.class_code} • {ex.subject_code}</span>
                      </div>
                      <span className="text-xs font-black text-red-700">{new Date(ex.exam_date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Classes List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Presentation size={15} style={{ color: theme.primary }} />
                Assigned Classes
              </h3>
              <div className="space-y-2">
                {data?.myClasses?.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center font-black text-xs shadow-sm text-[#002B5B]">
                      {c.standard}{c.division}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{c.class_code}</p>
                      <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight">{c.medium} • {c.shift}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Stats Bottom Sheet */}
          {showStatsSheet && (
            <>
              <div className="stats-sheet-overlay" onClick={() => setShowStatsSheet(false)} />
              <div className="stats-sheet bg-white">
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900">Analytics & Charts</h3>
                  <button onClick={() => setShowStatsSheet(false)} className="p-2 rounded-xl bg-gray-100">
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>

                <div className="p-4 space-y-5 pb-10">
                  {/* Attendance Trend */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Attendance Trends</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.charts?.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.primary} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="percentage" stroke={theme.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttend)" name="Attendance %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gender Distribution */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Class-wise Gender Distribution</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.classStrength || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="class_code" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                          <Bar dataKey="boys" name="Boys" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={12} />
                          <Bar dataKey="girls" name="Girls" fill="#EC4899" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Subject Performance */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Subject Performance</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.subjectPerformance?.length ? data.charts.subjectPerformance : staticData.charts.subjectPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Bar dataKey="avgScore" name="Avg %" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Student Progress Trend */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Student Progress Trend</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.charts?.studentPerformanceTrend?.length ? data.charts.studentPerformanceTrend : staticData.charts.studentPerformanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} name="Avg Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Behavior Analysis */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Behavior Analysis</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-3 mt-2">
                      {(data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis).map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-[9px] font-bold text-gray-600">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* School Resource Usage */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">School Resource Usage</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.schoolResources?.length ? data.charts.schoolResources : staticData.charts.schoolResources} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="resource" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Bar dataKey="usage" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20} name="Usage %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── DESKTOP VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Welcome, {user?.first_name || 'Teacher'}!</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { Icon: Library, label: 'My Classes', value: data?.myClasses?.length || 0, color: theme.primary, bg: 'bg-[#002B5B]/10' },
          { Icon: GraduationCap, label: 'Total Students', value: data?.totalStudentsInClasses || 0, color: theme.primary, bg: 'bg-[#002B5B]/10' },
          { Icon: CalendarCheck, label: 'Student Leaves', value: data?.pendingStudentLeaves || 0, color: theme.secondary, bg: 'bg-[#2D54A8]/10', },
          { Icon: ClipboardList, label: 'Homework', value: data?.homeworkGiven || 0, color: theme.secondary, bg: 'bg-[#2D54A8]/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-xl font-extrabold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.Icon size={18} style={{ color: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Charts (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Row 1: Large Main Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Attendance Trends
            </h3>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts?.attendanceTrend?.length ? data.charts.attendanceTrend : staticData.charts.attendanceTrend}>
                  <defs>
                    <linearGradient id="colorAttendDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.primary} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                  <Area type="monotone" dataKey="percentage" stroke={theme.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorAttendDesktop)" name="Attendance %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Two Side-by-Side Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users size={18} style={{ color: theme.primary }} /> Gender Distribution
              </h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.classStrength?.length ? data.charts.classStrength : staticData.charts.classStrength}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="class_code" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                    <Bar dataKey="boys" fill={theme.primary} name="Boys" radius={[4, 4, 0, 0]} barSize={15} />
                    <Bar dataKey="girls" fill="#EC4899" name="Girls" radius={[4, 4, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Trophy size={18} style={{ color: '#F59E0B' }} /> Assigned Subjects Performance
              </h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.subjectPerformance?.length ? data.charts.subjectPerformance : staticData.charts.subjectPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: 'none' }}
                      formatter={(value: any, name: any, props: any) => [`${value}%`, `Avg Score (${props.payload.class})`]}
                    />
                    <Bar dataKey="avgScore" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={15} name="Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 3: Student & School Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Performance Trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" /> Student Progress Trend
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.charts?.studentPerformanceTrend?.length ? data.charts.studentPerformanceTrend : staticData.charts.studentPerformanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} name="Avg Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Behavior Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-500" /> Behavior Analysis
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {(data?.charts?.behaviorAnalysis?.length ? data.charts.behaviorAnalysis : staticData.charts.behaviorAnalysis).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[10px] font-bold text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            
          </div>
        </div>

        {/* Right Column - Sidebar Lists (1/3 Width) */}
        <div className="space-y-6">
          {/* Assigned Classes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Library size={18} style={{ color: theme.primary }} /> My Classes
            </h3>
            <div style={{ height: '315px' }} className="overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {data?.myClasses?.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 group transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-base shadow-sm text-[#002B5B]">
                        {c.standard}{c.division}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{c.class_code}</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase">{c.medium} Medium • {c.shift}</p>
                      </div>
                    </div>
                    <TrendingUp size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CalendarCheck size={18} className="text-red-500" /> Upcoming Exams
            </h3>
            <div style={{ height: '285px' }} className="overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {!data?.upcomingExamsNext2Days?.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                    <AlertTriangle size={24} className="mb-2 opacity-20" />
                    <p className="text-xs font-medium">No schedules found</p>
                  </div>
                ) : (
                  data.upcomingExamsNext2Days.map((ex: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-red-50/50 border border-red-100 group transition-all hover:bg-red-50">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ex.exam_name}</p>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight">{ex.class_code} • {ex.subject_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-gray-900 bg-white px-2 py-1 rounded-lg shadow-sm border border-red-50">
                          {new Date(ex.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* School Resource Usage */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Library size={18} className="text-indigo-500" /> School Resource Usage Index
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.schoolResources?.length ? data.charts.schoolResources : staticData.charts.schoolResources} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="resource" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                    <Bar dataKey="usage" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} name="Usage %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

