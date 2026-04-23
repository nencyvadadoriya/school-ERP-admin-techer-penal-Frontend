import React, { useState, useEffect, useMemo } from 'react';
import { teacherAPI, classAPI, subjectAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaHistory, FaChevronRight, FaArrowLeft as IconBack, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Teachers: React.FC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    experience: '',
    subjects: [],
    medium: '',
    assigned_class: '',
    about: '',
  });

  const buildClassCode = (cls: any) => {
    const standard = cls?.standard ?? '';
    const division = cls?.division ?? '';
    const medium = cls?.medium ?? '';
    const stream = cls?.stream ?? '';
    const shift = cls?.shift ?? '';
    return `${standard} - ${division} (${medium})`;
  };

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<{ type: 'classes' | 'teachers', data: any }>({ type: 'classes', data: null });

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    accent: '#FFC107',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    success: '#10B981',
    danger: '#EF4444'
  };



  useEffect(() => {
    fetchTeachers();
    fetchClasses();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Jab assigned_class change ho, toh us class ke subjects fetch karo
  useEffect(() => {
    if (formData.assigned_class) {
      fetchSubjectsForClass(formData.assigned_class);
      // Reset subjects when class changes
      setFormData(prev => ({ ...prev, subjects: [] }));
    } else {
      setAvailableSubjects([]);
      setFormData(prev => ({ ...prev, subjects: [] }));
    }
  }, [formData.assigned_class]);

  const fetchTeachers = async () => {
    try {
      const res = await teacherAPI.getAll();
      setTeachers(res.data.data || []);
    } catch (err) {
      toast.error('Error fetching teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await classAPI.getAll();
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      toast.error('Error fetching classes');
    }
  };

  // Class ke subjects fetch karne ka function
  const fetchSubjectsForClass = async (className) => {
    try {
      const selectedClass = classes.find((c) => buildClassCode(c) === className);

      if (!selectedClass) {
        setAvailableSubjects([]);
        return;
      }

      const params: any = {
        std: String(selectedClass.standard),
        medium: selectedClass.medium,
      };
      if (selectedClass.stream) params.stream = selectedClass.stream;

      const res = await subjectAPI.getAll(params);
      const list = res?.data?.data || [];
      const names = list.map((s: any) => s.subject_name).filter(Boolean);

      if (names.length > 0) {
        setAvailableSubjects(names);
      } else {
        setAvailableSubjects([]);
        toast.info('No subjects found for this class. Please add subjects to the class first.');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAvailableSubjects([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await teacherAPI.delete(id);
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch (err) {
      toast.error('Error deleting teacher');
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === 'medium') {
      setFormData((s) => ({
        ...s,
        medium: value,
        assigned_class: '',
        subjects: [],
      }));
      setAvailableSubjects([]);
      return;
    }

    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleClassChange = (e: any) => {
    const value = e.target.value;
    const selectedClass = classes.find((c) => buildClassCode(c) === value);
    setFormData((s) => ({
      ...s,
      assigned_class: value,
      subjects: [],
      medium: selectedClass?.medium || s.medium,
    }));
  };

  const handleSubjectsChange = (e: any) => {
    const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions, (option: any) => option.value);
    setFormData((s) => ({ ...s, subjects: selectedOptions }));
  };

  const openAddForm = () => {
    setSelectedTeacher(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      experience: '',
      subjects: [],
      medium: '',
      assigned_class: '',
      about: '',
    });
    setAvailableSubjects([]);
    setShowForm(true);
  };

  const openEditForm = (t) => {
    setSelectedTeacher(t);
    const assignedClassValue = Array.isArray(t.assigned_class)
      ? (t.assigned_class[0] || '')
      : (t.assigned_class || '');
    const selectedClass = assignedClassValue
      ? classes.find((c) => buildClassCode(c) === assignedClassValue)
      : null;
    setFormData({
      first_name: t.first_name || '',
      last_name: t.last_name || '',
      email: t.email || '',
      phone: t.phone || '',
      password: '',
      experience: t.experience || '',
      subjects: t.subjects || [],
      medium: t.medium || selectedClass?.medium || '',
      assigned_class: assignedClassValue,
      about: t.about || '',
    });

    // Edit mode me bhi subjects fetch karo agar class assigned hai
    if (assignedClassValue) {
      fetchSubjectsForClass(assignedClassValue);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subjects: formData.subjects,
        assigned_class: formData.assigned_class,
        experience: formData.experience ? Number(formData.experience) : 0,
      };

      if (selectedTeacher) {
        await teacherAPI.update(selectedTeacher._id || selectedTeacher.id, payload);
        toast.success('Teacher updated');
      } else {
        const res = await teacherAPI.register(payload);
        if (res?.data?.generated_password) {
          toast.success(`Teacher added. Password: ${res.data.generated_password}`);
        } else {
          toast.success('Teacher added');
        }
      }
      setShowForm(false);
      setSelectedTeacher(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        experience: '',
        subjects: [],
        medium: '',
        assigned_class: '',
        about: '',
      });
      setAvailableSubjects([]);
      fetchTeachers();
    } catch (err) {
      const data = err.response?.data;
      if (data?.message === 'Validation error' && data.errors) {
        const msgs = Object.keys(data.errors).map((k) => `${k}: ${data.errors[k]}`);
        toast.error(msgs.join(' | '));
      } else if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error('Error saving teacher');
      }
    }
  };

  const filtered = teachers.filter(t =>
    t.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTeachers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach(t => {
      const classKey = t.assigned_class || 'Not Assigned';
      if (!groups[classKey]) groups[classKey] = [];
      groups[classKey].push(t);
    });
    return groups;
  }, [filtered]);

  const classOptions = formData.medium
    ? classes.filter((c) => c?.medium === formData.medium)
    : classes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      </div>
    );
  }

  if (isMobile) {
    const renderMobileContent = () => {
      if (mobileView.type === 'classes') {
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-[#002B5B] p-4 flex items-center justify-between sticky top-0 z-40">
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Teachers Management</h2>
                <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest">Manage Staff & Classes</p>
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-lg shadow-sm">
                  <div className="relative group">
                    <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px]" />
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={openAddForm}
                  className="w-8 h-8 rounded-lg bg-[#002B5B] flex items-center justify-center text-white active:scale-95 transition-all shadow-md shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>

              <div className="space-y-2 pb-20">
                {Object.keys(groupedTeachers).sort().map(classKey => {
                  const staff = groupedTeachers[classKey];
                  return (
                    <div key={classKey} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                      onClick={() => setMobileView({ type: 'teachers', data: { classKey, staff } })}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                          <FaUsers size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">{classKey}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{staff.length} Teachers</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-400">
                        <FaChevronRight size={10} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      if (mobileView.type === 'teachers') {
        const { classKey, staff } = mobileView.data;
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-[#002B5B] p-3 flex items-center gap-3 sticky top-0 z-40">
              <button onClick={() => setMobileView({ type: 'classes', data: null })} className="text-white p-1">
                <IconBack size={16} />
              </button>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{classKey}</h2>
                <p className="text-[9px] text-white/70 font-medium uppercase tracking-widest">{staff.length} Staff Members</p>
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto pb-24">
              {staff.map((t: any) => (
                <div key={t._id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                        {(t.first_name?.charAt(0) || '') + (t.last_name?.charAt(0) || '')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{t.first_name} {t.last_name}</h4>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t.email}</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${t.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-1.5 rounded-lg text-center border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Experience</p>
                      <p className="text-[10px] font-bold text-gray-900">{t.experience} Yrs</p>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded-lg text-center border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Phone</p>
                      <p className="text-[10px] font-bold text-gray-900">{t.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => navigate(`/admin/teacher-history/${t._id}`)} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <FaHistory size={10} /> History
                    </button>
                    <button onClick={() => openEditForm(t)} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <FaEdit size={10} /> Edit
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="w-9 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center justify-center active:scale-95 transition-all">
                      <FaTrash size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    };

    return (
      <div className="min-h-screen bg-[#F0F2F5] pb-6">
        <div className="p-0">
          {renderMobileContent()}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-3">
            <div className="bg-white rounded-t-3xl sm:rounded-xl w-full max-w-md p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100 animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>
                  {selectedTeacher ? 'Edit Teacher' : 'Add Teacher'}
                </h2>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)} 
                  className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors text-lg"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                    <input name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                    <input name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Experience (Yrs)</label>
                    <input name="experience" type="number" value={formData.experience} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                  </div>
                </div>
                {!selectedTeacher && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assigned Class</label>
                  <select value={formData.assigned_class} onChange={handleClassChange} name="assigned_class" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 transition-all outline-none appearance-none" required>
                    <option value="">Select class</option>
                    {classOptions.map((cls) => (
                      <option key={cls._id} value={buildClassCode(cls)}>{cls.standard}{cls.division} - {cls.medium}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4 pb-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 border border-gray-100 active:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg active:scale-95 transition-all" 
                    style={{ backgroundColor: theme.primary }}
                  >
                    Save Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: theme.primary }}>Teachers Management</h1>
          <p className="text-[10px] sm:text-xs font-medium text-gray-500">Manage all staff and teaching assignments</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-bold shadow-md transition-all active:scale-95 hover:brightness-110"
          style={{ backgroundColor: theme.primary }}
        >
          <FaPlus size={12} />
          <span>Add Teacher</span>
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="relative group max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
            style={{ '--tw-ring-color': `${theme.primary}40` } as any}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">#</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Experience</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Class</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t, index) => (
                <tr key={t._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3 text-xs font-medium text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px]"
                        style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
                        {(t.first_name?.charAt(0) || '') + (t.last_name?.charAt(0) || '')}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{t.first_name} {t.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.email}<br /><span className="text-[9px] text-gray-400">{t.phone}</span></td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-700">{t.experience} Yrs</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-600">{t.assigned_class || 'None'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${t.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => navigate(`/admin/teacher-history/${t._id}`)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"><FaHistory size={12} /></button>
                      <button onClick={() => openEditForm(t)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"><FaEdit size={12} /></button>
                      <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: theme.primary }}>{selectedTeacher ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setShowForm(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
              </div>
              {!selectedTeacher && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                <input name="experience" type="number" value={formData.experience} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Class</label>
                <select value={formData.assigned_class} onChange={handleClassChange} name="assigned_class" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': `${theme.primary}20` } as any} required>
                  <option value="">Select class</option>
                  {classOptions.map((cls) => (
                    <option key={cls._id} value={buildClassCode(cls)}>{cls.standard}{cls.division} - {cls.medium}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95" style={{ backgroundColor: theme.primary }}>Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;