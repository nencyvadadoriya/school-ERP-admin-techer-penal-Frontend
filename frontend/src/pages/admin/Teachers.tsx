import React, { useState, useEffect } from 'react';
import { teacherAPI, classAPI, subjectAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaHistory } from 'react-icons/fa';
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
    return `STD-${standard}-${division}-${medium}-${stream || 'NA'}-${shift || 'NA'}`;
  };

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

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

  const classOptions = formData.medium
    ? classes.filter((c) => c?.medium === formData.medium)
    : classes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">Manage all teachers in your school</p>
        </div>
        <button onClick={openAddForm} className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Add Teacher</span>
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto shadow-sm">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Teacher Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Exp.</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Assigned Class</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Subjects</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((t , index) => (
                  <tr key={t._id || t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-xs sm:text-sm">
                              {(t.first_name?.charAt(0) || '') + (t.last_name?.charAt(0) || '')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {t.first_name} {t.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate">
                      {t.email}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.phone}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.experience}y
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(t.assigned_class)
                        ? (t.assigned_class.join(', ') || 'Not assigned')
                        : (t.assigned_class || 'Not assigned')}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(t.subjects || []).slice(0, 3).map((subject, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {subject}
                          </span>
                        ))}
                        {(t.subjects || []).length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{t.subjects.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => navigate(`/admin/teacher-history/${t._id || t.id}`)} 
                          className="text-primary-600 hover:text-primary-900"
                          title="View History"
                        >
                          <FaHistory />
                        </button>
                        <button 
                          onClick={() => openEditForm(t)} 
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(t._id || t.id)} 
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No teachers found</p>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{selectedTeacher ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange} 
                  placeholder="Enter first name" 
                  className="input-field" 
                  required 
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange} 
                  placeholder="Enter last name" 
                  className="input-field" 
                  required 
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="teacher@example.com" 
                  type="email"
                  className="input-field" 
                  required 
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Enter phone number" 
                  className="input-field" 
                />
              </div>

              {/* Password */}
              {!selectedTeacher && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Set teacher login password"
                    type="password"
                    className="input-field"
                    required
                  />
                </div>
              )}

              {/* Experience */}
              <div className="space-y-1 ">
                <label className="block text-sm font-medium text-gray-700">
                  Experience (years)
                </label>
                <input 
                  name="experience" 
                  value={formData.experience} 
                  onChange={handleChange} 
                  placeholder="Years of experience" 
                  type="number"
                  className="input-field" 
                />
              </div>

              {/* About/Bio */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  About / Bio
                </label>
                <textarea 
                  name="about" 
                  value={formData.about} 
                  onChange={handleChange} 
                  placeholder="Write a brief description about the teacher..." 
                  className="input-field h-24" 
                />
              </div>

              {/* Assigned Class - Dropdown */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Class <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.assigned_class}
                  onChange={handleClassChange}
                  name="assigned_class"
                  className="input-field cursor-pointer"
                  required
                >
                  <option value="">Select a class</option>
                  {classOptions.length > 0 ? (
                    classOptions.map((cls) => (
                      <option 
                        key={cls._id || cls.id} 
                        value={buildClassCode(cls)}
                      >
                        Std {cls.standard} - Div {cls.division} - {cls.medium}{cls.stream ? ` - ${cls.stream}` : ''}{cls.shift ? ` - ${cls.shift}` : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      {formData.medium ? 'No classes available for selected medium.' : 'No classes available. Please add classes first.'}
                    </option>
                  )}
                </select>
                <p className="text-xs text-gray-500">Select the class assigned to this teacher</p>
              </div>

              {/* Medium - Dropdown */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medium <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.medium}
                  onChange={handleChange}
                  name="medium"
                  className="input-field cursor-pointer"
                  required
                >
                  <option value="">Select medium</option>
                  {Array.from(new Set((classes || []).map((c) => c?.medium).filter(Boolean))).map((m: any) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">Select the medium for this teacher assignment</p>
              </div>

              {/* Subjects - Multi Select Dropdown (Class ke hisab se subjects) */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Subjects <span className="text-red-500">*</span>
                </label>
                {formData.assigned_class ? (
                  <>
                    {availableSubjects.length > 0 ? (
                      <>
                        <select 
                          multiple
                          value={formData.subjects}
                          onChange={handleSubjectsChange}
                          className="input-field min-h-[150px] cursor-pointer"
                          size={6}
                          required
                        >
                          {availableSubjects.map((subject) => (
                            <option 
                              key={subject} 
                              value={subject}
                              className="py-2 px-2 hover:bg-primary-50"
                            >
                              {subject}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2">
                          {formData.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {formData.subjects.map((subject) => (
                                <span 
                                  key={subject} 
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {subject}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        subjects: formData.subjects.filter(s => s !== subject)
                                      });
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple subjects</p>
                      </>
                    ) : (
                      <div className="input-field bg-gray-50 text-gray-500 text-center py-4">
                        No subjects available for this class. Please add subjects to the class first.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="input-field bg-gray-50 text-gray-500 text-center py-4">
                    Please select a class first to see available subjects
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;