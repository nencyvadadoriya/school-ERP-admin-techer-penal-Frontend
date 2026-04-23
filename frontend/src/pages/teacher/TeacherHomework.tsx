import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, BookOpen, Layout, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton, CardSkeleton } from '../../components/Skeleton';
import { homeworkAPI, classAPI, subjectAPI, dashboardAPI, studentAPI } from '../../services/api';
import Modal from '../../components/Modal';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || item.class_code === selectedClass;
    const matchesSubject = !selectedSubject || item.subject_code === selectedSubject;
    return matchesSearch && matchesClass && matchesSubject;
  });

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

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <CardSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Desktop Header Card */}
      <div className="hidden md:block px-8 pt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="max-w-[60%]">
            <h1 className="text-2xl font-black text-[#002B5B] tracking-tight">Homework Management</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Create and manage student assignments efficiently</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} 
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#002B5B] text-white shadow-lg rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#003B7B] transition-all active:scale-95"
            >
              <Plus size={14} />
              <span>Assign New Homework</span>
            </button>
          </div>
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#002B5B]/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-12 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl font-black tracking-tight">Homework</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Assignments & Tasks</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="px-4 md:px-8 -mt-6 md:mt-6 relative z-20 space-y-4">
        {/* Mobile Action Button */}
        <div className="flex justify-center -mt-2 mb-4 md:hidden">
          <button 
            onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} 
            className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 bg-white text-[#002B5B] shadow-xl rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
          >
            <Plus size={16} />
            <span>Assign New Homework</span>
          </button>
        </div>

        {/* Desktop Search & Filters */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search homework..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none"
              />
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
            <div className="relative">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {classes.map((c, idx) => (
                  <option key={idx} value={c.class_code}>{c.class_code}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
            <div className="relative">
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                {[...new Set(items.map(i => i.subject_code))].map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Homework Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xs font-black text-gray-900 mb-1">No Homework Found</h3>
              <p className="text-[10px] font-medium text-gray-400">Assignments will appear here.</p>
            </div>
          ) : (
            filteredItems.map((hw) => (
              <div key={hw._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative group flex flex-col transition-all hover:shadow-md hover:border-[#002B5B]/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#002B5B]/5 text-[#002B5B] font-black uppercase tracking-wider inline-block w-fit">
                      {hw.subject_code}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      Std {hw.standard}-{hw.division}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditing(hw); setForm({ ...hw, class_code: hw.class_code }); setModal(true);}} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"><Edit size={12} /></button>
                    <button onClick={async () => { if(window.confirm('Delete?')) { try { await homeworkAPI.delete(hw._id); toast.success('Deleted'); fetchData(); } catch(e) { toast.error('Error'); } } }} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-gray-900 mb-1.5 leading-tight">{hw.title}</h3>
                <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-grow">{hw.description || hw.content}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                    <Calendar size={10} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase">{new Date(hw.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
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
