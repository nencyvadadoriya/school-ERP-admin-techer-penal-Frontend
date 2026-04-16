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

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <h2 className="font-bold">Error Loading Homework</h2>
        <p>{error}</p>
        <button 
          onClick={() => { setError(null); fetchData(); }}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner />
        <p className="text-gray-500 animate-pulse">Loading homework details...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and track assignments for your classes</p>
        </div>
        <button 
          onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <FaPlus /> Assign New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.length===0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-gray-300 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No homework yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1">Get started by creating your first homework assignment for your assigned classes.</p>
          </div>
        ) : (
          items.map(hw=>(
            <div key={hw._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                      {hw.subject_code}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                      Class: {hw.class_code}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{hw.title}</h3>
                  {hw.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-3">
                      {hw.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                      Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={()=>{setEditing(hw);setForm({...hw,due_date:hw.due_date?.split('T')[0]});setModal(true);}} 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit Assignment"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button 
                    onClick={async () => { if (window.confirm('Are you sure you want to delete this assignment?')) { await homeworkAPI.delete(hw._id); toast.success('Deleted'); fetchData(); } }} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Assignment"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Homework' : 'Assign Homework'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input-field" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard (Class Code) *</label>
              <select
                className="input-field"
                required
                value={normalizeClassCode(form.class_code)}
                onChange={e => {
                  console.log('Selected class code:', e.target.value);
                  setForm({ ...form, class_code: normalizeClassCode(e.target.value) });
                }}
              >
                <option value="">Select Standard</option>
                {classes.length === 0 && <option disabled>No classes assigned</option>}
                {classes.map((c, idx) => (
                  <option key={c._id || c.class_code || idx} value={normalizeClassCode(c.class_code)}>
                    {normalizeClassCode(c.class_code) || (c.standard && c.division ? `${c.standard}-${c.division}` : 'Unnamed Class')}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1"></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select
                className="input-field"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="date" className="input-field" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Assign'}</button>
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherHomework;
