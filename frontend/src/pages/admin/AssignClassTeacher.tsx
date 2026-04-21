import React, { useState, useEffect } from 'react';
import { teacherAPI, classAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';
import { UserCheck, CheckCircle, Circle, School, Users, GraduationCap, Layout } from 'lucide-react';
import StatCard from '../../components/StatCard';

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

const AssignClassTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchData = async () => {
    try {
      const [tR, cR] = await Promise.all([teacherAPI.getAll(), classAPI.getAll()]);
      setTeachers(tR.data.data || []); setClasses(cR.data.data || []);
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (teacherCode: string, classId: string, currentTeacherCode: string) => {
    try {
      const isAssigned = currentTeacherCode === teacherCode;
      await classAPI.updateClassTeacher(classId, { teacher_code: teacherCode, is_class_teacher: !isAssigned });
      toast.success(isAssigned ? 'Teacher unassigned' : 'Class teacher assigned');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  if (loading) return <Spinner />;

  const sortedClasses = [...classes].sort((a, b) => Number(a.standard) - Number(b.standard));
  const assignedCount = classes.filter(c => c.teacher_code).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-2xl font-black text-gray-900">Assign Class Teacher</h1>
                <p className="text-sm text-gray-500 font-medium">Select a primary class teacher for each section</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-white text-primary-700 rounded-xl text-xs font-bold border border-primary-200 flex items-center gap-2 shadow-sm">
                <CheckCircle size={14} className="text-primary-600" />
                {assignedCount} Assigned
              </div>
              <div className="px-4 py-2 bg-white text-gray-500 rounded-xl text-xs font-bold border border-gray-200 flex items-center gap-2 shadow-sm">
                <Circle size={14} className="text-gray-300" />
                {classes.length - assignedCount} Pending
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Class Teachers</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">Primary Section Mapping</p>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                  <UserCheck size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${isMobile ? 'mb-4 px-4' : 'mb-6'}`}>
          <StatCard
            title="Total Classes"
            value={classes.length}
            icon={Layout}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Sections"
          />
          <StatCard
            title="Assigned"
            value={assignedCount}
            icon={CheckCircle}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Class Teachers"
          />
          <StatCard
            title="Unassigned"
            value={classes.length - assignedCount}
            icon={Circle}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Pending"
          />
        </div>

        {isMobile ? (
          /* Mobile: card-per-class with teacher dropdown */
          <div className="space-y-2.5 px-4 pb-10">
            {sortedClasses.map(cls => {
              const assignedTeacher = teachers.find(t => t.teacher_code === cls.teacher_code);
              return (
                <div key={cls._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
                        {cls.standard}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Std {cls.standard}-{cls.division}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{cls.medium} Medium</p>
                      </div>
                    </div>
                    {assignedTeacher
                      ? <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600 uppercase tracking-wider border border-primary-100">Assigned</span>
                      : <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-50 text-gray-400 uppercase tracking-wider border border-gray-100">Pending</span>
                    }
                  </div>
                  
                  {assignedTeacher && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl mb-4 bg-gray-50 border border-gray-100">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ background: themeConfig.primary }}>
                        {assignedTeacher.first_name?.[0]}{assignedTeacher.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">{assignedTeacher.first_name} {assignedTeacher.last_name}</p>
                        <p className="text-[9px] text-gray-400 font-bold font-mono uppercase">{assignedTeacher.teacher_code}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {teachers.map(t => {
                      const isAssigned = cls.teacher_code === t.teacher_code;
                      return (
                        <button key={t._id} onClick={() => handleToggle(t.teacher_code, cls._id, cls.teacher_code)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isAssigned ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-100' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                          <div className="text-left">
                            <span className={`text-xs font-bold ${isAssigned ? 'text-primary-700' : 'text-gray-700'}`}>{t.first_name} {t.last_name}</span>
                            <p className="text-[9px] text-gray-400 font-mono">{t.teacher_code}</p>
                          </div>
                          {isAssigned ? <CheckCircle size={16} className="text-primary-600" /> : <Circle size={16} className="text-gray-200" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: full matrix table */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-20">Teacher Details</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                    {sortedClasses.map(cls => (
                      <th key={cls._id} className="px-4 py-5 text-center whitespace-nowrap border-l border-gray-50/50" style={{ color: themeConfig.primary }}>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black">{cls.standard}-{cls.division}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{cls.medium}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teachers.map(teacher => (
                    <tr key={teacher._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
                            {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-800">{teacher.first_name} {teacher.last_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-tighter">{teacher.teacher_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-600">{teacher.email}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{teacher.phone || 'No phone'}</p>
                      </td>
                      {sortedClasses.map(cls => {
                        const isAssigned = cls.teacher_code === teacher.teacher_code;
                        return (
                          <td key={cls._id} className="px-4 py-4 text-center border-l border-gray-50/50">
                            <button onClick={() => handleToggle(teacher.teacher_code, cls._id, cls.teacher_code)}
                              className={`mx-auto flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:scale-110 shadow-sm ${isAssigned ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400'}`}>
                              {isAssigned
                                ? <CheckCircle size={18} className="text-white" />
                                : <Circle size={18} className="text-gray-300" />
                              }
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignClassTeacher;
