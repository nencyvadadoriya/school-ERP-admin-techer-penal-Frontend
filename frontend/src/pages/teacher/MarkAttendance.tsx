import React, { useEffect, useMemo, useState } from 'react';
import { attendanceAPI, dashboardAPI, studentAPI, subjectAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MarkAttendance: React.FC = () => {
  const { user } = useAuth(); 
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [classCode, setClassCode] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

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
      setRows(Array.isArray(records) ? records : []);
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

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Mark Attendance</h1>
          <p className="text-[10px] font-medium text-gray-500">Daily attendance management for your assigned classes</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || rows.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          style={{ backgroundColor: theme.primary }}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : 'Save Attendance'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Settings</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider ml-1">Class</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
                  value={classCode} 
                  onChange={e => setClassCode(e.target.value)}
                  disabled={loadingClasses}
                >
                  <option value="">Select Class</option>
                  {myClasses.map((c: any) => (
                    <option key={c.class_code} value={c.class_code}>
                      {c.class_code} (Std {c.standard}-{c.division})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider ml-1">Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xl font-black text-green-600">{totals.present}</p>
                <p className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Present</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xl font-black text-red-600">{totals.absent}</p>
                <p className="text-[9px] font-bold text-red-700 uppercase tracking-wider">Absent</p>
              </div>
              <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900">{rows.length}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">All</span>
                  <div 
                    onClick={() => handleSelectAll(!isAllSelected)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${isAllSelected ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-200 ${isAllSelected ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student List Card */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-black" style={{ color: theme.primary }}>Student List</h2>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderBottomColor: theme.primary }}></div>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-5 py-3 w-12 text-center">#</th>
                    <th className="px-5 py-3">Student Info</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
                      </td>
                    </tr>
                  ) : (!Array.isArray(rows) || rows.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        <p className="text-xs font-bold uppercase tracking-widest">No students found</p>
                      </td>
                    </tr>
                  ) : rows.map((s, idx) => (
                    s && (
                      <tr key={s.student_id || idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-2.5 text-center text-[10px] font-bold text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{s.student_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">GR: {s.gr_number}</span>
                              {s.roll_no && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter bg-blue-50 px-1 rounded">Roll: {s.roll_no}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <div 
                              onClick={() => handleStatusToggle(idx)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                s.status === 'Present' 
                                  ? 'bg-green-50 border-green-200 text-green-700' 
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                                s.status === 'Present' ? 'bg-green-600 border-green-600' : 'bg-white border-red-300'
                              }`}>
                                {s.status === 'Present' && <div className="w-1 h-1 bg-white rounded-full" />}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider">{s.status}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
