import React, { useState, useEffect } from 'react';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { teacherAPI, classAPI, subjectAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaSave, FaTrash, FaPlus, FaChalkboardTeacher, FaBook, FaLayerGroup, FaHistory, FaSearch, FaEdit, FaFilter, FaTimes, FaChevronDown } from 'react-icons/fa';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';

const themeConfig = {
  primary: '#002B5B',
  secondary: '#2D54A8',
  accent: '#FFC107',
  success: '#10B981',
  warning: '#f59e0b',
  danger: '#EF4444',
  info: '#3b82f6',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const SubjectAssignmentStyleSheet = () => (
  <style>{`
    .assignment-container { background: ${themeConfig.background}; min-height: 100vh; }
    .btn-base { padding: 0.625rem 1.25rem; border: none; border-radius: 0.625rem; font-weight: 600; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.secondary} 100%); color: white; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: rgba(0,43,91,0.08); color: ${themeConfig.primary}; border: 1.5px solid ${themeConfig.primary}; }
    .btn-secondary:hover { background: rgba(0,43,91,0.15); }
    .btn-danger { background: rgba(239,68,68,0.08); color: ${themeConfig.danger}; border: 1.5px solid ${themeConfig.danger}; }
    .btn-danger:hover { background: ${themeConfig.danger}; color: white; }
    .input-field { width: 100%; padding: 0.5rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 0.625rem; font-size: 0.875rem; transition: all 0.2s; background: white; box-sizing: border-box; }
    .input-field:focus { outline: none; border-color: ${themeConfig.primary}; box-shadow: 0 0 0 3px rgba(0,43,91,0.08); }
    .select-wrapper { position: relative; }
    .select-wrapper select { appearance: none; padding-right: 2rem; }
    .select-wrapper::after { content: ''; position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 14px; height: 14px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23002B5B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
    .card-base { background: white; border-radius: 1rem; border: 1px solid #e5e7eb; overflow: hidden; transition: all 0.2s; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,43,91,0.25); border-radius: 10px; }
  `}</style>
);

const SubjectAssignment: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Selection states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  
  // Search state for history
  const [historySearch, setHistorySearch] = useState('');
  
  // Current teacher's assignments
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, sRes] = await Promise.all([
        teacherAPI.getAll(),
        classAPI.getAll(),
        subjectAPI.getAll()
      ]);
      setTeachers(tRes.data.data || []);
      setClasses(cRes.data.data || []);
      setSubjects(sRes.data.data || []);
    } catch (err) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeacherId) {
      const teacher = teachers.find(t => t._id === selectedTeacherId);
      if (teacher) {
        setAssignments(teacher.subject_assignments || []);
      }
    } else {
      setAssignments([]);
    }
  }, [selectedTeacherId, teachers]);

  const handleAddAssignment = (subject: any) => {
    if (!selectedTeacherId || selectedClassIds.length === 0 || !selectedMedium) {
      toast.warn('Please select Teacher, Medium and at least one Class first');
      return;
    }

    const newAssignments = [...assignments];
    let addedCount = 0;

    selectedClassIds.forEach(classId => {
      const selectedClass = classes.find(c => c._id === classId);
      if (!selectedClass) return;

      // Check if already assigned
      const exists = assignments.find(a => 
        a.subject_id === subject._id && 
        a.class_id === classId
      );

      if (!exists) {
        newAssignments.push({
          subject_id: subject._id,
          subject_name: subject.subject_name,
          class_id: classId,
          class_name: `Std ${selectedClass.standard} - Div ${selectedClass.division}`,
          medium: selectedMedium
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setAssignments(newAssignments);
      toast.success(`Assigned ${subject.subject_name} to ${addedCount} class(es)`);
    } else {
      toast.info('This subject is already assigned to all selected classes');
    }
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = [...assignments];
    newAssignments.splice(index, 1);
    setAssignments(newAssignments);
  };

  const handleSave = async () => {
    if (!selectedTeacherId) {
      toast.error('Please select a teacher');
      return;
    }

    try {
      setSubmitting(true);
      await teacherAPI.assignSubjects(selectedTeacherId, {
        subject_assignments: assignments
      });
      toast.success('Assignments saved successfully');
      // Clear form after successful save
      setSelectedTeacherId('');
      setSelectedMedium('');
      setSelectedClassIds([]);
      setAssignments([]);
      // Update local teachers list to reflect changes
      fetchInitialData();
    } catch (err) {
      toast.error('Error saving assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (teacherId: string, subjectId: string, medium: string) => {
    if (!window.confirm('Are you sure you want to delete all assignments for this subject for this teacher?')) {
      return;
    }

    try {
      setLoading(true);
      const teacher = teachers.find(t => t._id === teacherId);
      if (!teacher) return;

      const updatedAssignments = (teacher.subject_assignments || []).filter((a: any) => 
        !(a.subject_id === subjectId && a.medium === medium)
      );

      await teacherAPI.assignSubjects(teacherId, {
        subject_assignments: updatedAssignments
      });

      toast.success('Assignments deleted successfully');
      fetchInitialData();
    } catch (err) {
      toast.error('Error deleting assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setSelectedTeacherId('');
    setSelectedMedium('');
    setSelectedClassIds([]);
    setAssignments([]);
    toast.info('Form cleared');
  };

  // Grouped assignments for history
  const allAssignments = teachers.reduce((acc: any[], teacher) => {
    if (teacher.subject_assignments && Array.isArray(teacher.subject_assignments)) {
      // Temporary map to group by subject_id and medium
      const teacherGroups: { [key: string]: any } = {};

      teacher.subject_assignments.forEach((assignment: any) => {
        const key = `${assignment.subject_id}_${assignment.medium}`;
        if (!teacherGroups[key]) {
          teacherGroups[key] = {
            subject_id: assignment.subject_id,
            subject_name: assignment.subject_name,
            medium: assignment.medium,
            teacher_name: `${teacher.first_name} ${teacher.last_name}`,
            teacher_code: teacher.teacher_code,
            teacher_id: teacher._id,
            classes: [assignment.class_name]
          };
        } else {
          if (!teacherGroups[key].classes.includes(assignment.class_name)) {
            teacherGroups[key].classes.push(assignment.class_name);
          }
        }
      });

      // Push grouped assignments to main accumulator
      Object.values(teacherGroups).forEach(group => {
        acc.push(group);
      });
    }
    return acc;
  }, []);

  const filteredHistory = allAssignments.filter(a => 
    a.teacher_name.toLowerCase().includes(historySearch.toLowerCase()) ||
    a.subject_name.toLowerCase().includes(historySearch.toLowerCase()) ||
    a.classes.some((c: string) => c.toLowerCase().includes(historySearch.toLowerCase())) ||
    a.teacher_code.toLowerCase().includes(historySearch.toLowerCase())
  );

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  const filteredClasses = classes.filter(c => !selectedMedium || c.medium === selectedMedium);
  const firstSelectedClass = classes.find(c => c._id === selectedClassIds[0]);
  const filteredSubjects = subjects.filter(s => {
    if (!selectedMedium || s.medium !== selectedMedium) return false;
    if (!firstSelectedClass) return false;
    // Show subjects for the standard of the first selected class
    return String(s.std) === String(firstSelectedClass.standard);
  });

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar" style={{ backgroundColor: themeConfig.background }}>
      <SubjectAssignmentStyleSheet />
      
      <div className={`${isMobile ? 'p-0 pb-24' : 'p-6'}`}>
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-xl font-bold" style={{ color: themeConfig.primary }}>Subject Assignment</h1>
              <p className="text-xs text-gray-500">Assign subjects to teachers based on medium and class</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClearForm} className="btn-base btn-secondary !px-4 !py-2 !text-xs">
                Clear Form
              </button>
              <button 
                onClick={handleSave} 
                disabled={submitting || !selectedTeacherId}
                className="btn-base btn-primary !px-4 !py-2 !text-xs font-bold shadow-md active:scale-95"
              >
                <FaSave size={10} /> {submitting ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: themeConfig.primary }}>
              <div>
                <h2 className="text-base font-extrabold text-white">Assignments</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">Teacher Subject Mapping</p>
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isMobile ? 'mb-4 px-3' : 'mb-6'}`}>
          <div className={isMobile ? 'scale-90 origin-top-left -mr-4' : ''}>
            <StatCard
              title="Total Teachers"
              value={teachers.length}
              icon={Users}
              iconColor={themeConfig.primary}
              iconBg="rgba(0, 43, 91, 0.1)"
              subtitle="Faculty"
            />
          </div>
          <div className={isMobile ? 'scale-90 origin-top-left -mr-4' : ''}>
            <StatCard
              title="Total Subjects"
              value={subjects.length}
              icon={BookOpen}
              iconColor={themeConfig.primary}
              iconBg="rgba(0, 43, 91, 0.1)"
              subtitle="Academic"
            />
          </div>
          <div className={isMobile ? 'scale-90 origin-top-left -mr-4' : ''}>
            <StatCard
              title="Assigned"
              value={allAssignments.length}
              icon={GraduationCap}
              iconColor={themeConfig.primary}
              iconBg="rgba(0, 43, 91, 0.1)"
              subtitle="Mappings"
            />
          </div>
          <div className={isMobile ? 'scale-90 origin-top-left -mr-4' : ''}>
            <StatCard
              title="Classes"
              value={classes.length}
              icon={FaLayerGroup}
              iconColor={themeConfig.primary}
              iconBg="rgba(0, 43, 91, 0.1)"
              subtitle="Sections"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${isMobile ? 'px-3 pb-6' : ''}`}>
          {/* Left Column: Config */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`card-base ${isMobile ? 'p-4' : 'p-5'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest flex items-center gap-2`}>
                  Assignment Config
                </h3>
                {isMobile && (
                  <button 
                    onClick={handleSave} 
                    disabled={submitting || !selectedTeacherId} 
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-[10px] font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                    style={{ background: themeConfig.primary }}
                  >
                    <FaSave size={10} /> {submitting ? '...' : 'Save'}
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">1. Select Teacher</label>
                  <div className="select-wrapper">
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className={`input-field ${isMobile ? '!py-1.5 !text-[11px]' : ''}`}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.first_name} {t.last_name} ({t.teacher_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">2. Select Medium</label>
                  <div className="select-wrapper">
                    <select
                      value={selectedMedium}
                      onChange={(e) => {
                        setSelectedMedium(e.target.value);
                        setSelectedClassIds([]);
                      }}
                      className={`input-field ${isMobile ? '!py-1.5 !text-[11px]' : ''}`}
                    >
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Gujarati">Gujarati</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">3. Select Classes</label>
                    {selectedClassIds.length > 0 && (
                      <button onClick={() => setSelectedClassIds([])} className="text-[9px] text-red-500 font-bold hover:underline">Clear</button>
                    )}
                  </div>
                  <div className={`${isMobile ? 'max-h-48' : 'max-h-60'} overflow-y-auto border border-gray-100 rounded-xl p-1.5 space-y-1 bg-gray-50/50 custom-scrollbar`}>
                    {filteredClasses.length === 0 ? (
                      <div className="text-center py-6">
                        <FaLayerGroup className="mx-auto text-gray-200 text-2xl mb-1" />
                        <p className="text-[9px] text-gray-400 font-medium">Select medium first</p>
                      </div>
                    ) : (
                      filteredClasses.map(c => (
                        <label key={c._id} className={`flex items-center gap-2 ${isMobile ? 'p-2' : 'p-2.5'} rounded-xl cursor-pointer transition-all ${selectedClassIds.includes(c._id) ? 'bg-primary-50 border-primary-100 ring-1 ring-primary-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={selectedClassIds.includes(c._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClassIds([...selectedClassIds, c._id]);
                              } else {
                                setSelectedClassIds(selectedClassIds.filter(id => id !== c._id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0">
                            <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-900`}>Class {c.standard} - {c.division}</p>
                            <p className="text-[9px] text-gray-500 font-medium">{c.shift}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {isMobile && selectedTeacherId && (
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button onClick={handleClearForm} className="btn-base btn-secondary !py-2 !text-[11px]">Cancel</button>
                  <button onClick={handleSave} disabled={submitting} className="btn-base btn-primary !py-2 !text-[11px]">
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Subjects & Assignments */}
          <div className="lg:col-span-8 space-y-4">
            {/* Subject Picker */}
            <div className={`card-base ${isMobile ? 'p-4' : 'p-5'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest flex items-center gap-2`}>
                  Available Subjects
                </h3>
                {selectedClassIds.length > 0 && (
                  <span className={`px-2 py-0.5 bg-green-50 text-green-600 rounded-full ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold border border-green-100 uppercase tracking-wider`}>
                    {selectedClassIds.length} Selected
                  </span>
                )}
              </div>

              {selectedClassIds.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <FaBook className="mx-auto text-gray-200 text-3xl mb-2" />
                  <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-bold text-gray-400`}>Select classes to see subjects</p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <FaBook className="mx-auto text-gray-200 text-3xl mb-2" />
                  <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-bold text-gray-400`}>No subjects found</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'sm:grid-cols-2 xl:grid-cols-3 gap-4'}`}>
                  {filteredSubjects.map(subject => (
                    <button
                      key={subject._id}
                      onClick={() => handleAddAssignment(subject)}
                      className={`${isMobile ? 'p-3' : 'p-4'} text-left bg-white border border-gray-100 rounded-2xl hover:border-primary-400 hover:shadow-md transition-all group flex justify-between items-center ring-1 ring-transparent hover:ring-primary-100`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-bold text-gray-900 truncate`}>{subject.subject_name}</p>
                        <p className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-gray-500 font-mono font-bold mt-1 bg-gray-50 inline-block px-1.5 py-0.5 rounded`}>{subject.subject_code || 'N/A'}</p>
                      </div>
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary-500 group-hover:text-white transition-colors flex-shrink-0`}>
                        <FaPlus size={isMobile ? 10 : 12} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Draft Table */}
            <div className="card-base overflow-hidden">
              <div className={`bg-gray-50 ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b flex justify-between items-center`}>
                <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest flex items-center gap-2`}>
                  Drafts
                </h3>
                {selectedTeacherId && (
                  <span className={`px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold`}>
                    {assignments.length} Total
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-gray-100">
                      <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider`}>Subject</th>
                      <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider`}>Class</th>
                      {!isMobile && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Medium</th>}
                      <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider text-right`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={isMobile ? 3 : 4} className="px-6 py-8 text-center">
                          <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} text-gray-400 font-medium italic`}>
                            {selectedTeacherId ? 'No drafts' : 'Select a teacher'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      assignments.map((assignment, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                            <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-bold text-gray-900`}>{assignment.subject_name}</p>
                          </td>
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                            <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-gray-600 font-medium`}>{assignment.class_name}</p>
                          </td>
                          {!isMobile && (
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${assignment.medium === 'English' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                {assignment.medium}
                              </span>
                            </td>
                          )}
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} text-right`}>
                            <button
                              onClick={() => handleRemoveAssignment(index)}
                              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto mr-0`}
                            >
                              <FaTrash size={isMobile ? 10 : 12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className={`mt-6 ${isMobile ? 'px-3 pb-10' : ''}`}>
          <div className="card-base overflow-hidden">
            <div className={`bg-white ${isMobile ? 'px-4 py-4' : 'px-6 py-5'} border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest flex items-center gap-2`}>
                <div className={`w-1.5 ${isMobile ? 'h-4' : 'h-6'} bg-orange-500 rounded-full`}></div>
                All Assignments
              </h3>
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={isMobile ? 10 : 12} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className={`input-field pl-11 !py-1.5 ${isMobile ? 'text-[11px]' : 'text-xs'}`}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider`}>Teacher</th>
                    {!isMobile && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</th>}
                    <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider`}>Details</th>
                    <th className={`${isMobile ? 'px-4 py-2 text-[8px]' : 'px-6 py-4 text-[10px]'} font-bold text-gray-400 uppercase tracking-wider text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={isMobile ? 3 : 5} className="px-6 py-10 text-center">
                        <FaHistory className="mx-auto text-gray-200 text-3xl mb-2" />
                        <p className={`${isMobile ? 'text-[11px]' : 'text-sm'} text-gray-400 font-medium`}>No history</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((assignment, index) => (
                      <tr key={`${assignment.teacher_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                          <div className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-black text-gray-900`}>{assignment.teacher_name}</div>
                          <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-gray-400 font-bold font-mono mt-0.5`}>{assignment.teacher_code}</div>
                        </td>
                        {!isMobile && (
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg inline-block">{assignment.subject_name}</p>
                          </td>
                        )}
                        <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                          {isMobile && <p className="text-[10px] font-bold text-gray-700 mb-1">{assignment.subject_name}</p>}
                          <div className={`grid ${isMobile ? 'grid-cols-2' : 'flex flex-wrap'} gap-1`}>
                            {assignment.classes.map((cls: string, i: number) => (
                              <span key={i} className={`bg-white px-1.5 py-0.5 rounded-lg ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black border border-gray-200 text-gray-500 shadow-sm text-center`}>
                                {cls}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} text-right`}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedTeacherId(assignment.teacher_id);
                                setSelectedMedium(assignment.medium);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center`}
                              title="Edit"
                            >
                              <FaEdit size={isMobile ? 12 : 14} />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(assignment.teacher_id, assignment.subject_id, assignment.medium)}
                              className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center`}
                              title="Delete"
                            >
                              <FaTrash size={isMobile ? 12 : 14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectAssignment;
