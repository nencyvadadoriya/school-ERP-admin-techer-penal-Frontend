import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api, { homeworkAPI, classAPI, subjectAPI, dashboardAPI, studentAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { class_code: '', subject_code: '', title: '', description: '', due_date: '' };

const normalizeClassCode = (input: any) => {
  const raw = String(input || '').trim();
  if (!raw) return raw;
  const withoutStd = raw.replace(/^STD[-\s]*/i, '');
  const unified = withoutStd.replace(/\s+/g, '-');
  const parts = unified.split('-').map(p => String(p || '').trim()).filter(Boolean);
  if (parts.length >= 3) return `${parts[0]}-${parts[1]}-${parts[2]}`;
  return unified;
};

const TeacherHomework: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      const [hwRes, dRes, subRes, allClsRes, studentRes] = await Promise.allSettled([
        homeworkAPI.getAll({ teacher_code: user?.teacher_code }),
        dashboardAPI.teacher(),
        subjectAPI.getAll(),
        classAPI.getAll(),
        studentAPI.getAll()
      ]);
      
      const hwData = hwRes.status === 'fulfilled' ? hwRes.value?.data?.data : [];
      const teacherData = dRes.status === 'fulfilled' ? dRes.value?.data?.data : {};
      const allSystemClasses = allClsRes.status === 'fulfilled' ? allClsRes.value?.data?.data : [];
      const subData = subRes.status === 'fulfilled' ? subRes.value?.data?.data : [];
      const allStudents = studentRes.status === 'fulfilled' ? studentRes.value?.data?.data : [];
      
      const existingStudentClassCodes = Array.isArray(allStudents) 
        ? [...new Set(allStudents.map((s: any) => normalizeClassCode(s.class_code)).filter(Boolean))]
        : [];
      
      setItems(Array.isArray(hwData) ? hwData : []);
      const subjectAssignments = teacherData?.subject_assignments || teacherData?.subjectAssignments || [];
      
      let filteredClasses: any[] = [];

      const teacherAssignedClassCodes = teacherData?.assigned_class || [];
      const systemClassesByStdDiv = new Map<string, any[]>();
      if (Array.isArray(allSystemClasses)) {
        allSystemClasses.forEach((c: any) => {
          const std = String(c?.standard || '').trim();
          const div = String(c?.division || '').trim();
          if (!std || !div) return;
          const key = `${std}-${div}`.toUpperCase();
          const arr = systemClassesByStdDiv.get(key) || [];
          arr.push(c);
          systemClassesByStdDiv.set(key, arr);
        });
      }
      
      if (Array.isArray(allSystemClasses) && allSystemClasses.length > 0) {
        filteredClasses = allSystemClasses.filter((c: any) => {
          const isClassTeacher = (c.teacher_code && user?.teacher_code && String(c.teacher_code) === String(user?.teacher_code));
          if (isClassTeacher) return true;
          
          if (Array.isArray(teacherAssignedClassCodes) && teacherAssignedClassCodes.includes(c.class_code)) return true;

          return Array.isArray(subjectAssignments) && subjectAssignments.some((a: any) => {
            const classIdMatch = a.class_id && c._id && String(a.class_id) === String(c._id);
            const classNameMatch = a.class_name && c.class_code && String(a.class_name).includes(String(c.class_code));
            
            const cStd = String(c.standard || '').trim();
            const cDiv = String(c.division || '').trim();
            const aName = String(a.class_name || '').trim();
            
            const stdDivMatch = aName.includes(cStd) && aName.includes(cDiv);
            
            return classIdMatch || classNameMatch || stdDivMatch;
          });
        });
      }

      if (Array.isArray(existingStudentClassCodes)) {
        existingStudentClassCodes.forEach(code => {
          const codeStr = normalizeClassCode(code);
          if (!filteredClasses.find(c => normalizeClassCode(c.class_code) === codeStr)) {
            filteredClasses.push({
              _id: `student-code-${codeStr}`,
              class_code: codeStr,
              standard: codeStr.split('-')[0] || codeStr,
              division: codeStr.split('-')[1] || '',
              medium: codeStr.split('-')[2] || 'N/A'
            });
          }
        });
      }

      // If teacher has assigned_class like "1-A" (without medium), expand it to actual backend classes.
      if (Array.isArray(teacherAssignedClassCodes) && teacherAssignedClassCodes.length > 0) {
        teacherAssignedClassCodes.forEach((code: string) => {
          const normalized = normalizeClassCode(code);
          const parts = String(normalized || '').split('-').map(p => p.trim()).filter(Boolean);
          if (parts.length !== 2) return;

          const key = `${parts[0]}-${parts[1]}`.toUpperCase();
          const fromSystem = systemClassesByStdDiv.get(key) || [];
          fromSystem.forEach((cls: any) => {
            const clsCode = normalizeClassCode(cls?.class_code);
            if (!clsCode) return;
            if (!filteredClasses.find((c: any) => normalizeClassCode(c.class_code) === clsCode)) {
              filteredClasses.push(cls);
            }
          });
        });
      }

      if (filteredClasses.length === 0 && Array.isArray(subjectAssignments) && subjectAssignments.length > 0) {
        const derived = subjectAssignments.map((a: any) => {
          const name = String(a.class_name || '');
          const parts = name.split(/[\s-]+/);
          return {
            _id: a.class_id || `temp-${name}`,
            class_code: normalizeClassCode(name),
            standard: parts.find(p => !isNaN(parseInt(p))) || name,
            division: parts.find(p => p.length === 1 && /[A-Z]/i.test(p)) || '',
            medium: a.medium || 'English'
          };
        });
        filteredClasses = Array.from(new Map(derived.map(c => [c.class_code, c])).values());
      }

      if (filteredClasses.length === 0 && Array.isArray(teacherAssignedClassCodes) && teacherAssignedClassCodes.length > 0) {
        const expanded: any[] = [];
        teacherAssignedClassCodes.forEach((code: string) => {
          const normalized = normalizeClassCode(code);
          const parts = String(normalized || '').split('-').map(p => p.trim()).filter(Boolean);

          if (parts.length >= 3) {
            expanded.push({
              _id: `code-${normalized}`,
              class_code: normalized,
              standard: parts[0] || normalized,
              division: parts[1] || '',
              medium: parts[2] || 'N/A'
            });
            return;
          }

          if (parts.length === 2) {
            const key = `${parts[0]}-${parts[1]}`.toUpperCase();
            const fromSystem = systemClassesByStdDiv.get(key) || [];
            if (fromSystem.length > 0) {
              fromSystem.forEach((cls: any) => expanded.push(cls));
              return;
            }
          }
        });

        filteredClasses = expanded;
      }

      if (filteredClasses.length === 0 && Array.isArray(teacherData?.myClasses) && teacherData.myClasses.length > 0) {
        filteredClasses = teacherData.myClasses;
      }

      setClasses(
        Array.from(
          new Map(
            filteredClasses
              .map((c: any) => {
                const std = String(c?.standard || '').trim();
                const div = String(c?.division || '').trim();
                const med = String(c?.medium || '').trim();
                const codeFromParts = std && div && med ? `${std}-${div}-${med}` : '';
                const canonical = normalizeClassCode(c?.class_code || codeFromParts);
                return [{
                  ...c,
                  class_code: canonical,
                }, canonical] as const;
              })
              .filter((x: any) => {
                const canonical = x?.[1];
                return canonical && String(canonical).split('-').filter(Boolean).length >= 3;
              })
              .map((x: any) => [x[1], x[0]])
          ).entries()
        ).map(([, v]) => v)
      );

      setSubjectAssignments(Array.isArray(subjectAssignments) ? subjectAssignments : []);
      setSubjects(Array.isArray(subData) ? subData : []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch homework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...form, class_code: normalizeClassCode(form.class_code), teacher_code: user?.teacher_code };
      if (editing) { await homeworkAPI.update(editing._id, payload); toast.success('Updated'); }
      else { await homeworkAPI.create(payload); toast.success('Homework assigned'); }
      setModal(false); fetchData();
    } catch(err) { toast.error(err.response?.data?.message||'Error'); }
  };

  const getFilteredSubjects = () => {
    if (!form.class_code) return [];
    
    const selectedClass = classes.find(c => normalizeClassCode(c.class_code) === normalizeClassCode(form.class_code));
    
    // Create a Set to store unique subject names
    const uniqueSubjectNames = new Set<string>();
    const filteredResults: any[] = [];

    // 1. Filter from subjectAssignments (Directly assigned to this teacher)
    if (Array.isArray(subjectAssignments)) {
      subjectAssignments.forEach(a => {
        // Log individual assignment check
        const classMatch = (a.class_id && selectedClass?._id && String(a.class_id) === String(selectedClass._id)) ||
                          (a.class_name && String(a.class_name).includes(form.class_code)) ||
                          (selectedClass?.standard && a.class_name && String(a.class_name).includes(String(selectedClass.standard)));
        
        if (classMatch && a.subject_name && !uniqueSubjectNames.has(a.subject_name)) {
          uniqueSubjectNames.add(a.subject_name);
          filteredResults.push({
            _id: a.subject_id || a.subject_name,
            subject_name: a.subject_name
          });
        }
      });
    }

    // 2. If no direct assignments found, fallback to system subjects for this standard
    if (filteredResults.length === 0 && selectedClass && Array.isArray(subjects)) {
      subjects.forEach(s => {
        const stdMatch = String(s.std) === String(selectedClass.standard);
        if (stdMatch && s.subject_name && !uniqueSubjectNames.has(s.subject_name)) {
          uniqueSubjectNames.add(s.subject_name);
          filteredResults.push(s);
        }
      });
    }

    // FINAL FALLBACK: If still nothing, show all subjects (last resort to prevent empty dropdown)
    if (filteredResults.length === 0 && Array.isArray(subjects)) {
      subjects.forEach(s => {
        if (s.subject_name && !uniqueSubjectNames.has(s.subject_name)) {
          uniqueSubjectNames.add(s.subject_name);
          filteredResults.push(s);
        }
      });
    }

    return filteredResults;
  };

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 max-w-2xl mx-auto mt-10 text-center">
        <h2 className="text-lg font-black mb-2">Error Loading Homework</h2>
        <p className="text-sm font-medium opacity-80 mb-6">{error}</p>
        <button 
          onClick={() => { setError(null); fetchData(); }}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading homework assignments...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Homework Management</h1>
          <p className="text-[10px] font-medium text-gray-500">Create and track assignments for your classes</p>
        </div>
        <button 
          onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} 
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 hover:brightness-110 text-xs"
          style={{ backgroundColor: theme.primary }}
        >
          <FaPlus size={12} />
          <span>Assign New</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.length===0 ? (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FaPlus size={20} />
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">No Homework Found</h3>
            <p className="text-[10px] font-medium text-gray-500 max-w-xs mx-auto">
              You haven't assigned any homework yet.
            </p>
          </div>
        ) : (
          items.map(hw=>(
            <div key={hw._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-4 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button 
                  onClick={()=>{setEditing(hw);setForm({...hw,due_date:hw.due_date?.split('T')[0]});setModal(true);}} 
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FaEdit size={12} />
                </button>
                <button 
                  onClick={async () => { if (window.confirm('Are you sure you want to delete this assignment?')) { await homeworkAPI.delete(hw._id); toast.success('Deleted'); fetchData(); } }} 
                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div className="flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider">
                    {hw.subject_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 text-[8px] font-black uppercase tracking-wider">
                    {hw.class_code}
                  </span>
                </div>

                <h3 className="text-sm font-black text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                  {hw.title}
                </h3>

                {hw.description && (
                  <p className="text-[11px] font-medium text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-grow">
                    {hw.description}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                    <div className="w-1 h-1 rounded-full bg-orange-600 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-tight">Due {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(hw.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Homework' : 'Assign Homework'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Homework Title</label>
            <input 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" 
              required 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              placeholder="Homework Title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
                required
                value={normalizeClassCode(form.class_code)}
                onChange={e => setForm({ ...form, class_code: normalizeClassCode(e.target.value) })}
              >
                <option value="">Select Class</option>
                {classes.map((c, idx) => (
                  <option key={c._id || c.class_code || idx} value={normalizeClassCode(c.class_code)}>
                    {normalizeClassCode(c.class_code)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
                value={form.subject_code}
                onChange={e => setForm({ ...form, subject_code: e.target.value })}
                disabled={!form.class_code}
              >
                <option value="">Select Subject</option>
                {getFilteredSubjects().map((s, idx) => (
                  <option key={s._id || idx} value={s.subject_name}>{s.subject_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deadline</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer" 
              required 
              value={form.due_date} 
              onChange={e => setForm({ ...form, due_date: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instructions</label>
            <textarea 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none resize-none" 
              rows={3} 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="Homework details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setModal(false)} 
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: theme.primary }}
            >
              {editing ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherHomework;
