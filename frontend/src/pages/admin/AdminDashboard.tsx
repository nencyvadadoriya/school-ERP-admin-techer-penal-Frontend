import React, { useState, useEffect } from 'react';
import AutoNotificationManager from '../../components/AutoNotificationManager';
import {
  Users2, GraduationCap, Landmark, Wallet, CalendarCheck2, FileSpreadsheet,
  BarChart3, Trophy, UsersRound, Library, Percent, BellRing, ArrowUpRight,
  ArrowDownRight, Eye, Download, MoreHorizontal, CheckCircle2, History, Clock,
  AlertTriangle, UserPlus, LayoutDashboard, CalendarDays, Calendar,
  ShieldCheck, Search, Home, PieChart, UserCircle2, ChevronDown, X, TrendingUp
} from 'lucide-react';
import Skeleton, { DashboardSkeleton, ListSkeleton, FormSkeleton } from'../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { dashboardAPI, attendanceAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0,
    attendancePercentage: 0, pendingLeaves: 0, feesCollected: 0,
    pendingTeacherLeaves: 0, pendingStudentLeaves: 0, feesPending: 0,
    totalFees: 0, pendingFeesCount: 0,
    charts: { weeklyAttendance: [], genderDistribution: [], teacherWorkload: [] }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAttendance, setCheckingAttendance] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showStatsSheet, setShowStatsSheet] = useState<boolean>(false);

  const theme = {
    primary: '#002B5B', secondary: '#2D54A8', accent: '#FFC107',
    background: '#F0F2F5', white: '#FFFFFF',
    textPrimary: '#1F2937', textSecondary: '#6B7280'
  };

  const monthlyFeesData = [
    { month: 'Jan', collected: 125000, pending: 45000, target: 170000 },
    { month: 'Feb', collected: 142000, pending: 38000, target: 180000 },
    { month: 'Mar', collected: 158000, pending: 25000, target: 183000 },
    { month: 'Apr', collected: 135000, pending: 42000, target: 177000 },
    { month: 'May', collected: 148000, pending: 35000, target: 183000 },
    { month: 'Jun', collected: 165000, pending: 28000, target: 193000 },
  ];

  const classPerformanceData = [
    { class: '10A', avgScore: 78, students: 42, rank: 2, improvement: 5 },
    { class: '10B', avgScore: 74, students: 40, rank: 3, improvement: 3 },
    { class: '9A', avgScore: 82, students: 45, rank: 1, improvement: 7 },
    { class: '9B', avgScore: 71, students: 43, rank: 4, improvement: 2 },
    { class: '8A', avgScore: 79, students: 44, rank: 2, improvement: 4 },
    { class: '8B', avgScore: 76, students: 41, rank: 3, improvement: 6 },
  ];

  const monthlyAttendance = [
    { month: 'Jan', percentage: 92, target: 90, previousYear: 88 },
    { month: 'Feb', percentage: 89, target: 90, previousYear: 87 },
    { month: 'Mar', percentage: 94, target: 90, previousYear: 89 },
    { month: 'Apr', percentage: 91, target: 90, previousYear: 86 },
    { month: 'May', percentage: 87, target: 90, previousYear: 85 },
    { month: 'Jun', percentage: 93, target: 90, previousYear: 88 },
  ];

  const weeklyAttendanceData = [
    { day: 'Mon', present: 420, absent: 45, total: 465 },
    { day: 'Tue', present: 435, absent: 30, total: 465 },
    { day: 'Wed', present: 445, absent: 20, total: 465 },
    { day: 'Thu', present: 430, absent: 35, total: 465 },
    { day: 'Fri', present: 425, absent: 40, total: 465 },
    { day: 'Sat', present: 410, absent: 55, total: 465 },
  ];

  const genderDistributionData = [
    { name: 'Boys', value: 245, color: '#002B5B' },
    { name: 'Girls', value: 220, color: '#2D54A8' },
  ];

  useEffect(() => {
    fetchDashboard();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => setIsMobile(window.innerWidth < 768);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.admin();
      setStats({
        ...res.data.data,
        pendingTeacherLeaves: res.data.data?.pendingTeacherLeaves ?? 0,
        pendingStudentLeaves: res.data.data?.pendingStudentLeaves ?? 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCheckMissingAttendance = async () => {
    setCheckingAttendance(true);
    try {
      const res = await attendanceAPI.checkMissingAttendance();
      if (res.data.success)
        toast.success(res.data.message + ` Reminders sent to ${res.data.missing_count} teachers.`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to check attendance');
    } finally { setCheckingAttendance(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F5] p-4">
      <DashboardSkeleton />
    </div>
  );

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
            // border-radius: 0 0 32px 32px;
            padding: 40px 20px 80px 20px;
            margin-bottom: -60px;
          }
          .pending-row { display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;margin-bottom:8px; }
        `}</style>

        <div className="relative">
          {/* Header */}
          <div className="mobile-header-gradient text-white relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-black tracking-tight">Welcome, Admin</h2>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500, margin: '0 0 10px' }}>
                  SmartSchool ERP Dashboard
                </p>
              <div className="flex items-center justify-between text-[11px] text-white/70">
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
                { Icon: GraduationCap, lbl: 'Students', val: stats.totalStudents || 250, color: '#3B82F6', bg: '#EFF6FF' },
                { Icon: Wallet, lbl: 'Fees', val: `₹${((stats.totalFees || 0) / 1000).toFixed(0)}K`, color: '#F59E0B', bg: '#FFFBEB' },
                { Icon: UsersRound, lbl: 'Boys', val: 150, color: '#2563EB', bg: '#F0F9FF' },
                { Icon: UsersRound, lbl: 'Girls', val: 100, color: '#DB2777', bg: '#FDF2F8' },
                { Icon: Library, lbl: 'Classes', val: stats.totalClasses || 0, color: '#8B5CF6', bg: '#F5F3FF' },
                { Icon: Users2, lbl: 'Teachers', val: stats.totalTeachers || 0, color: '#10B981', bg: '#ECFDF5' },
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
                <span>View All Stats & Charts</span>
              </div>
              <ChevronDown size={16} />
            </button>

            {/* Pending Tasks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={15} style={{ color: theme.primary }} />
                Pending Tasks
              </h3>
              <div className="space-y-2">
                <div className="pending-row" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: theme.primary }} />
                    <span className="text-[11px] font-bold" style={{ color: theme.primary }}>Teacher Leaves</span>
                  </div>
                  <span className="text-base font-black" style={{ color: theme.primary }}>{stats.pendingTeacherLeaves ?? 0}</span>
                </div>
                <div className="pending-row" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-700">Student Leaves</span>
                  </div>
                  <span className="text-base font-black text-amber-700">{stats.pendingStudentLeaves ?? 0}</span>
                </div>
                <div className="pending-row" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-700">Pending Fees</span>
                  </div>
                  <span className="text-base font-black text-emerald-700">₹{((stats.feesPending ?? 213000) / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>

            {/* Performance Rankings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Trophy size={15} style={{ color: theme.primary }} />
                Top Class Rankings
              </h3>
              <div className="space-y-2">
                {classPerformanceData.sort((a, b) => b.avgScore - a.avgScore).slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-xs shadow-sm" style={{ color: theme.primary }}>
                      {i + 1}
                    </div>
                    <span className="font-bold text-gray-800 text-sm flex-1">{item.class}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold" style={{ color: theme.primary }}>{item.avgScore}%</span>
                      <ArrowUpRight size={12} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AutoNotificationManager darkMode={false} />
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
                  <h3 className="font-extrabold text-gray-900">All Stats & Charts</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCheckMissingAttendance}
                      disabled={checkingAttendance}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow active:scale-95"
                      style={{ background: theme.primary }}
                    >
                      {checkingAttendance ? 'Checking...' : 'Check Attendance'}
                    </button>
                    <button onClick={() => setShowStatsSheet(false)} className="p-2 rounded-xl bg-gray-100">
                      <X size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-5 pb-10">
                  {/* Gender Distribution */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Gender Distribution</h4>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie data={genderDistributionData} innerRadius={55} outerRadius={78} paddingAngle={8} dataKey="value">
                            {genderDistributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                      {genderDistributionData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs font-bold text-gray-500">{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendance Trends */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Attendance Trends</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.secondary} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={theme.secondary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="percentage" stroke={theme.secondary} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPct)" name="Attendance %" />
                          <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={1.5} name="Target" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Weekly Attendance */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Weekly Attendance</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                          <Bar dataKey="present" name="Present" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={14} />
                          <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Fees Collection */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Fees Collection</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyFeesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} formatter={(v: number) => [`₹${(v / 1000).toFixed(1)}K`, '']} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                          <Bar dataKey="collected" name="Collected" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={18} />
                          <Bar dataKey="pending" name="Pending" fill={theme.secondary} radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Class Performance */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wider">Class Performance</h4>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                          <Bar dataKey="avgScore" name="Avg Score" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={18} />
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
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002B5B]/10 w-64"
            />
          </div>
          <button
            onClick={handleCheckMissingAttendance}
            disabled={checkingAttendance}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
            style={{ background: theme.primary }}
          >
            {checkingAttendance ? 'Checking...' : 'Check Attendance'}
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { Icon: GraduationCap, label: 'Total Students', value: stats.totalStudents || 250, color: theme.primary, bg: 'bg-[#002B5B]/10' },
          { Icon: Users2, label: 'Total Teachers', value: stats.totalTeachers || 10, color: theme.primary, bg: 'bg-[#002B5B]/10' },
          { Icon: Library, label: 'Total Classes', value: stats.totalClasses || 4, color: theme.secondary, bg: 'bg-[#2D54A8]/10' },
          { Icon: CalendarCheck2, label: 'Attendance', value: `${stats.attendancePercentage || 100}%`, color: theme.secondary, bg: 'bg-[#2D54A8]/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
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
                <AreaChart data={monthlyAttendance}>
                  <defs>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.secondary} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={theme.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                  <Area type="monotone" dataKey="percentage" stroke={theme.secondary} strokeWidth={2} fillOpacity={1} fill="url(#colorPercentage)" name="Current" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Two Side-by-Side Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CalendarCheck2 size={18} className="text-blue-600" />
                Weekly Attendance
              </h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                    <Bar dataKey="present" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-blue-600" />
                Gender Distribution
              </h3>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={genderDistributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {genderDistributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {genderDistributionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs font-bold text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Full Width Fees Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" />
              Monthly Fees Collection
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFeesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: 'none', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(v: number) => [`₹${(v / 1000).toFixed(1)}K`, '']}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} />
                  <Bar dataKey="collected" name="Collected" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="pending" name="Pending" fill={theme.secondary} radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4: Performance Rankings */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Performance Rankings
            </h3>
            <div className="space-y-3">
              {classPerformanceData.sort((a, b) => b.avgScore - a.avgScore).slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm text-gray-900">
                      {i + 1}
                    </div>
                    <span className="font-bold text-[15px] text-gray-800 tracking-tight">{item.class}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-black text-gray-900">{item.avgScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Lists (1/3 Width) */}
        <div className="space-y-6">
          {/* Class Performance (Moved to Sidebar) */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600" />
              Class Performance
            </h3>
            <div style={{ height: '315px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                  <Bar dataKey="avgScore" name="Avg Score" fill={theme.primary} radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Target vs Actual Attendance (Moved to Sidebar) */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Percent size={18} className="text-blue-600" />
              Target vs Actual Attendance
            </h3>
            <div style={{ height: '285px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="percentage" stroke={theme.secondary} strokeWidth={2} name="Actual" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeDasharray="5 5" name="Target" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm h-[362px] flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History size={18} style={{ color: theme.primary }} /> Pending Tasks
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {[
                { bg: '#F0F9FF', border: theme.primary + '10', Icon: AlertTriangle, iconColor: theme.primary, label: 'Teacher Leaves', val: stats.pendingTeacherLeaves ?? 0 },
                { bg: '#FFF7ED', border: '#F59E0B10', Icon: History, iconColor: '#D97706', label: 'Student Leaves', val: stats.pendingStudentLeaves ?? 0 },
                { bg: '#ECFDF5', border: '#10B98110', Icon: Wallet, iconColor: '#059669', label: 'Pending Fees', val: `₹${((stats.feesPending ?? 7000) / 1000).toFixed(0)}K` },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: row.bg, borderColor: row.border }}>
                  <div className="flex items-center gap-3">
                    <row.Icon size={16} style={{ color: row.iconColor }} />
                    <span className="text-sm font-bold text-gray-700">{row.label}</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notifications (Moved to sidebar next to Rankings) */}
          <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm h-[290px]">
            <AutoNotificationManager darkMode={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;