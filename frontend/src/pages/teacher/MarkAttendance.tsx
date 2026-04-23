import React, { useEffect, useMemo, useState } from 'react';
import Skeleton, { ListSkeleton, CardSkeleton } from '../../components/Skeleton';
import { attendanceAPI, dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Users, CheckCircle2, XCircle, ChevronDown, 
  Settings, LayoutGrid, CalendarDays, Save
} from 'lucide-react';

const MarkAttendance: React.FC = () => {
  const { user } = useAuth(); 
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [classCode, setClassCode] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadClasses = async () => {
    try { 
      setLoadingClasses(true);
      const r = await dashboardAPI.teacher();
      const cls = r?.data?.data?.myClasses || [];
      setMyClasses(cls);
      if (cls.length > 0 && !classCode) {
        setClassCode(cls[0].class_code);
      }
    } catch (e) {
      console.error("Error loading classes:", e);
      setMyClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadDailyAttendance = async () => {
    if (!classCode || !date) return;
    setLoading(true);
    try {
      const r = await attendanceAPI.getDaily({ class_code: classCode, date });
      const responseData = r?.data?.data;
      const records = responseData?.records || [];
      // Sort records by roll number
      const sortedRecords = Array.isArray(records) 
        ? [...records].sort((a, b) => {
            const rollA = parseInt(a.roll_no) || 0;
            const rollB = parseInt(b.roll_no) || 0;
            return rollA - rollB;
          })
        : [];
      setRows(sortedRecords);
    } catch (e: any) {
      console.error("Error loading attendance:", e);
      setRows([]);
      if (e.response?.status !== 404) {
        toast.error("Failed to load attendance records");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user?.assigned_class]);

  useEffect(() => {
    if (classCode && date) {
      loadDailyAttendance();
    }
  }, [classCode, date]);

  const handleStatusToggle = (index: number) => {
    const newRows = [...rows];
    newRows[index].status = newRows[index].status === 'Present' ? 'Absent' : 'Present';
    setRows(newRows);
  };

  const handleSelectAll = (checked: boolean) => {
    const newRows = rows.map(row => ({
      ...row,
      status: checked ? 'Present' : 'Absent'
    }));
    setRows(newRows);
  };

  const handleSave = async () => {
    if (!classCode || !date) {
      toast.error("Please select class and date");
      return;
    }
    setSaving(true);
    try {
      await attendanceAPI.mark({
        class_code: classCode,
        teacher_code: user?.teacher_code,
        date,
        records: rows.map(s => ({
          student_id: s.student_id,
          gr_number: s.gr_number,
          status: s.status
        }))
      });
      toast.success("Attendance saved successfully");
    } catch (e) {
      console.error("Error saving attendance:", e);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    if (!Array.isArray(rows)) return { present: 0, absent: 0 };
    return {
      present: rows.filter(s => s && (s.status === 'Present' || s.status === 'Late')).length,
      absent: rows.filter(s => s && s.status === 'Absent').length,
    };
  }, [rows]);

  const isAllSelected = rows.length > 0 && rows.every(r => r.status === 'Present');

  if (loadingClasses) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <CardSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Desktop Header Card (Second Image Style) */}
      <div className="hidden md:block px-8 pt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="max-w-[60%]">
            <h1 className="text-2xl font-black text-[#002B5B] tracking-tight">Attendance Management</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Track student daily presence efficiently</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={handleSave} 
              disabled={saving || rows.length === 0}
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#002B5B] text-white shadow-lg rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#003B7B] transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#002B5B]/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-12 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl font-black tracking-tight">Mark Attendance</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Manage Daily Presence</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 -mt-6 md:mt-6 relative z-20 space-y-4">
        {/* Save Button Overlapping Header (Mobile Only) */}
        <div className="flex justify-center -mt-2 mb-4 md:hidden">
          <button 
            onClick={handleSave} 
            disabled={saving || rows.length === 0}
            className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 bg-white text-[#002B5B] shadow-xl rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 border border-gray-100"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>

        {/* Filters and Stats in One Row for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Settings Card */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Select Class</label>
                <div className="relative">
                  <select 
                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
                    value={classCode} 
                    onChange={e => setClassCode(e.target.value)}
                  >
                    <option value="">Select a class...</option>
                    {myClasses.map((c: any) => (
                      <option key={c.class_code} value={c.class_code}>
                        {c.class_code} (Std {c.standard}-{c.division})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </div>
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Select Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-2 md:gap-4">
            {[
              { label: 'Total Students', value: rows.length, color: 'text-[#002B5B]' },
              { label: 'Present Today', value: rows.filter(r => r.status === 'Present').length, color: 'text-green-600' },
              { label: 'Absent Today', value: rows.filter(r => r.status === 'Absent').length, color: 'text-red-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-2.5 md:p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md h-full">
                <span className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                <span className={`text-sm md:text-xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3">
          {rows.length > 0 && (
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Student List ({rows.length})</span>
              <button 
                onClick={() => setRows(prev => prev.map(r => ({ ...r, status: isAllSelected ? 'Absent' : 'Present' })))}
                className="text-[10px] md:text-xs font-black text-[#002B5B] uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                {isAllSelected ? 'Unselect All' : 'Select All'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
            {rows.map((row, idx) => (
              <div key={idx} className="bg-white rounded-xl p-2.5 md:p-3 border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:border-[#002B5B]/20">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[#002B5B] font-black text-[10px] md:text-sm border border-gray-100">
                    {row.roll_no}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-black text-gray-900 leading-tight">{row.student_name}</p>
                    <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Roll No: {row.roll_no}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 md:gap-2">
                  {['Present', 'Absent', 'Leave'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        const newRows = [...rows];
                        newRows[idx].status = status;
                        setRows(newRows);
                      }}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-[10px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${
                        row.status === status 
                          ? 'bg-[#002B5B] border-[#002B5B] text-white shadow-md'
                          : 'bg-white border-gray-100 text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : 'L'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
