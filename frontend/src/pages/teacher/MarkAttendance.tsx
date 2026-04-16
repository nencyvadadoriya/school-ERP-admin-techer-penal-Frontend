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
      
      // The backend now reliably returns the list of students for the class, 
      // merged with any existing attendance status for that date.
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-sm text-gray-500">Take daily attendance for your class</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || rows.length === 0}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select 
              className="input-field" 
              value={classCode} 
              onChange={e => setClassCode(e.target.value)}
              disabled={loadingClasses}
            >
              <option value="">Select class</option>
              {myClasses.map((c: any) => (
                <option key={c.class_code} value={c.class_code}>
                  {c.standard ? `${c.class_code} (Std ${c.standard}-${c.division})` : c.class_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>
        </div>

        {loading ? <div className="py-10"><Spinner /></div> : (
          <>
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-4">
                <span className="text-sm text-green-600 font-semibold">Present: {totals.present}</span>
                <span className="text-sm text-red-600 font-semibold">Absent: {totals.absent}</span>
                <span className="text-sm text-gray-500">Total: {rows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="select-all"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Select All Present
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Details</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!Array.isArray(rows) || rows.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        No students found for this class.
                      </td>
                    </tr>
                  ) : rows.map((s, idx) => (
                    s && (
                    <tr key={s.student_id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{s.student_name}</div>
                        <div className="text-xs text-gray-500">GR: {s.gr_number} {s.roll_no ? `| Roll: ${s.roll_no}` : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center items-center">
                          <input 
                            type="checkbox"
                            checked={s.status === 'Present'}
                            onChange={() => handleStatusToggle(idx)}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                        </div>
                      </td>
                    </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
