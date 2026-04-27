import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTh, FaList, FaFilter, FaTimes, FaBook, FaGraduationCap, FaLayerGroup, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { subjectAPI, classAPI, default as api } from '../../services/api';
import Modal from '../../components/Modal';
import BulkAddSubject from '../../components/BulkAddSubject';
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
  dark: '#1f2937',
  light: '#f9fafb',
};

const SubjectStyleSheet = () => (
  <style>{`
    .subject-container { background: ${themeConfig.background}; min-height: 100vh; }
    .btn-base { padding: 0.625rem 1.25rem; border: none; border-radius: 0.625rem; font-weight: 600; font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s; }
    .btn-primary { background: ${themeConfig.primary}; color: ${themeConfig.white}; }
    .btn-primary:hover { background: ${themeConfig.secondary}; transform: translateY(-1px); }
    .btn-secondary { background: rgba(0,43,91,0.08); color: ${themeConfig.primary}; border: 1.5px solid ${themeConfig.primary}; }
    .btn-secondary:hover { background: rgba(0,43,91,0.15); }
    .btn-danger { background: rgba(239,68,68,0.08); color: ${themeConfig.danger}; border: 1.5px solid ${themeConfig.danger}; }
    .btn-danger:hover { background: ${themeConfig.danger}; color: white; }
    .input-field { width: 100%; padding: 0.5rem 0.875rem; border: 1.5px solid #e5e7eb; border-radius: 0.625rem; font-size: 0.875rem; transition: all 0.2s; background: white; box-sizing: border-box; }
    .input-field:focus { outline: none; border-color: ${themeConfig.primary}; box-shadow: 0 0 0 3px rgba(0,43,91,0.08); }
    .select-wrapper { position: relative; }
    .select-wrapper select { appearance: none; padding-right: 2rem; }
    .select-wrapper::after { content: ''; position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 14px; height: 14px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23002B5B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
    .stat-card { background: white; border-radius: 1rem; padding: 1rem; border: 1px solid #e5e7eb; transition: all 0.3s ease; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .card-base { background: white; border-radius: 1rem; border: 1px solid #e5e7eb; overflow: hidden; transition: all 0.2s; }
    .card-base:hover { border-color: ${themeConfig.primary}40; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    @media (max-width: 768px) {
      .card-base { padding: 0.75rem !important; border-radius: 0.75rem; }
      .card-base h3 { font-size: 0.75rem !important; }
      .card-base .text-[10px] { font-size: 0.55rem !important; }
      .card-base .text-[9px] { font-size: 0.5rem !important; }
      .card-base .btn-base { padding: 0.4rem !important; }
      .mobile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.5rem !important; }
      .mobile-text-xs { font-size: 0.65rem !important; }
      .mobile-text-sm { font-size: 0.75rem !important; }
    }

    .view-mode-btn { padding: 0.5rem; border-radius: 0.5rem; transition: all 0.2s; }
    .view-mode-btn.active { background: ${themeConfig.primary}; color: white; }
    .view-mode-btn:not(.active) { color: ${themeConfig.textSecondary}; }
    .view-mode-btn:not(.active):hover { background: rgba(0,43,91,0.05); }
  `}</style>
);

const EMPTY = { subject_code: '', subject_name: '', subject_level: 'Secondary', std: '', stream: '', medium: 'English', is_delete: false };

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'stdwise'
  const [selectedStd, setSelectedStd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStd, setExpandedStd] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filters, setFilters] = useState({
    medium: '',
    stream: '',
    level: ''
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetch = async () => {
    try {
      const [subjectRes, classRes] = await Promise.all([
        api.get('/subject'),
        api.get('/class')
      ]);
      setSubjects(subjectRes.data.data || []);
      setClasses(classRes.data.data || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, medium: 'English' });
    setModal(true);
  };

  const openBulkAdd = () => {
    setBulkModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...s });
    setModal(true);
  };

  const getStreamOptions = (std) => {
    const standardNum = Number(std);
    if (standardNum >= 11) {
      return [
        { value: 'Science-Maths', label: 'Sci-Maths' },
        { value: 'Science-Bio', label: 'Sci-Bio' },
        { value: 'Commerce', label: 'Commerce' },
        { value: 'Higher Secondary', label: 'Higher Sec' }
      ];
    } else if (standardNum >= 9) {
      return [
        { value: 'Foundation', label: 'Foundation' },
        { value: 'Secondary', label: 'Secondary' }
      ];
    } else if (standardNum >= 6) {
      return [
        { value: 'Upper Primary', label: 'Upper Primary' }
      ];
    }
    return [];
  };

  const getSubjectLevel = (std) => {
    const standardNum = Number(std);
    if (standardNum >= 11) return 'Higher Secondary';
    if (standardNum >= 9) return 'Secondary';
    if (standardNum >= 1) return 'Primary';
    return 'Secondary';
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'std') {
      const level = getSubjectLevel(value);
      setForm(prev => ({ ...prev, std: value, subject_level: level, stream: '' }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const standardNum = Number(form.std);

    if (standardNum >= 10 && !form.subject_code) {
      toast.error('Subject code required for class 10-12');
      return;
    }
    if (standardNum >= 11 && !form.stream) {
      toast.error('Stream required for class 11-12');
      return;
    }
    if (!form.medium || !form.subject_name || !form.std) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editing) {
        await api.patch(`/subject/${editing._id}`, form);
        toast.success('Subject updated');
      } else {
        await api.post('/subject', form);
        toast.success('Subject created');
      }
      await fetch();
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/subject/${id}`);
      toast.success('Subject deleted');
      await fetch();
    } catch (e) {
      toast.error('Error deleting subject');
    }
  };

  const toggleStd = (standard: string) => {
    setExpandedStd(prev => prev === standard ? null : standard);
  };

  const filtered = subjects.filter(s => {
    const matchesSearch = s.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code?.toLowerCase().includes(search.toLowerCase());
    const matchesStd = !selectedStd || s.std === selectedStd;
    const matchesMedium = !filters.medium || s.medium === filters.medium;
    const matchesStream = !filters.stream || s.stream === filters.stream;
    const matchesLevel = !filters.level || s.subject_level === filters.level;
    return matchesSearch && matchesStd && matchesMedium && matchesStream && matchesLevel;
  });

  const groupByStandardAndMedium = () => {
    const grouped = {};
    filtered.forEach(subject => {
      const std = subject.std || 'Unassigned';
      const medium = subject.medium || 'Unknown';
      if (!grouped[std]) grouped[std] = {};
      if (!grouped[std][medium]) grouped[std][medium] = [];
      grouped[std][medium].push(subject);
    });
    const sortedGrouped = {};
    Object.keys(grouped).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return Number(a) - Number(b);
    }).forEach(key => sortedGrouped[key] = grouped[key]);
    return sortedGrouped;
  };

  const mediums = [...new Set(subjects.map(s => s.medium).filter(Boolean))];
  const streams = [...new Set(subjects.map(s => s.stream).filter(Boolean))];
  const levels = [...new Set(subjects.map(s => s.subject_level).filter(Boolean))];

  const resetFilters = () => {
    setSelectedStd('');
    setFilters({ medium: '', stream: '', level: '' });
    setSearch('');
  };

  const getLevelBadge = (level: string) => {
    let classes = "";
    if (level === 'Primary') classes = "bg-[#002B5B10] text-[#002B5B]";
    else if (level === 'Secondary') classes = "bg-[#2D54A8]10 text-[#2D54A8]";
    else classes = "bg-[#FFC107]20 text-[#FFC107] border border-[#FFC107]40";
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {level === 'Higher Secondary' ? 'Higher Sec' : level}
    </span>;
  };

  const groupedData = groupByStandardAndMedium();

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <SubjectStyleSheet />
      
      <div className={isMobile ? 'p-0' : 'p-6'}>
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold" style={{ color: themeConfig.primary }}>Subjects Management</h1>
                <p className="text-xs text-gray-500">Configure and manage academic subjects</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openBulkAdd} className="btn-base btn-secondary !px-4 !py-2 !text-xs">
                <FaPlus size={10} /> Bulk Add
              </button>
              <button onClick={openAdd} className="btn-base btn-primary !px-4 !py-2 !text-xs font-bold shadow-md active:scale-95">
                <FaPlus size={10} /> Add Subject
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}` }}>
              <div>
                <h2 className="text-base font-extrabold text-white">Subjects</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">{subjects.length} Total Subjects</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isMobile ? 'mb-4 px-4' : 'mb-6'}`}>
          <StatCard
            title="Total Subjects"
            value={subjects.length}
            icon={FaBook}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Academic"
          />
          <StatCard
            title="Primary"
            value={subjects.filter((s: any) => s.subject_level === 'Primary').length}
            icon={FaGraduationCap}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Level"
          />
          <StatCard
            title="Secondary"
            value={subjects.filter((s: any) => s.subject_level === 'Secondary').length}
            icon={FaGraduationCap}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Level"
          />
          <StatCard
            title="Higher Sec"
            value={subjects.filter((s: any) => s.subject_level === 'Higher Secondary').length}
            icon={FaGraduationCap}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.1)"
            subtitle="Level"
          />
        </div>

        {/* Controls Section */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 ${isMobile ? 'mx-4' : ''}`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[70%] sm:max-w-none">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 !py-1.5 !text-xs"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-base ${showFilters ? 'btn-secondary' : 'btn-secondary'} !px-3 !py-1.5 !text-[10px]`}
              >
                <FaFilter size={10} />
                <span>Filters</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
               {isMobile && (
                <div className="flex gap-2">
                  <button onClick={openBulkAdd} className="btn-base btn-secondary !px-3 !py-1.5 !text-[10px]">
                    <FaLayerGroup size={10} /> Bulk
                  </button>
                  <button onClick={openAdd} className="btn-base text-white !px-3 !py-1.5 !text-[10px] shadow-sm" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}` }}>
                    <FaPlus size={10} /> Add
                  </button>
                </div>
              )}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-mode-btn !p-1.5 ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Grid View"
                ><FaTh size={12} /></button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-mode-btn !p-1.5 ${viewMode === 'list' ? 'active' : ''}`}
                  title="List View"
                ><FaList size={12} /></button>
                <button
                  onClick={() => setViewMode('stdwise')}
                  className={`view-mode-btn !p-1.5 ${viewMode === 'stdwise' ? 'active' : ''}`}
                  title="Standard-wise"
                ><FaLayerGroup size={12} /></button>
              </div>

             
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="select-wrapper">
                <select value={selectedStd} onChange={(e) => setSelectedStd(e.target.value)} className="input-field">
                  <option value="">All Standards</option>
                  {Array.from(new Set(classes.map(c => c.standard))).sort((a, b) => Number(a) - Number(b)).map(std => (
                    <option key={std} value={std}>Class {std}</option>
                  ))}
                </select>
              </div>
              <div className="select-wrapper">
                <select value={filters.medium} onChange={(e) => setFilters({ ...filters, medium: e.target.value })} className="input-field">
                  <option value="">All Mediums</option>
                  {mediums.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="select-wrapper">
                <select value={filters.stream} onChange={(e) => setFilters({ ...filters, stream: e.target.value })} className="input-field">
                  <option value="">All Streams</option>
                  {streams.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={resetFilters} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center justify-center gap-2 transition-colors">
                <FaTimes /> Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={`min-h-[400px] ${isMobile ? 'px-4 pb-10' : ''}`}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FaBook className="text-6xl mb-4 opacity-20" />
              <p className="text-lg font-medium">No subjects found matching your criteria</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="space-y-10">
                  {['English', 'Gujarati'].map(medium => {
                    const items = filtered.filter((s: any) => s.medium === medium);
                    if (items.length === 0) return null;
                    return (
                      <div key={medium}>
                        <div className="flex items-center gap-3 mb-6">
                        
                          <h2 className="text-lg font-bold text-gray-800">{medium} Medium</h2>
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">{items.length} Subjects</span>
                        </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 ${isMobile ? 'mobile-grid' : ''}`}>
                          {items.map((s: any) => (
                            <div key={s._id} className="card-base p-3 group">
                              <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0">
                                  {s.subject_code && (
                                    <span className="text-[9px] font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded mb-1 inline-block">
                                      {s.subject_code}
                                    </span>
                                  )}
                                  <h3 className="text-sm font-bold text-gray-900 truncate pr-2" title={s.subject_name}>
                                    {s.subject_name}
                                  </h3>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <FaEdit className="text-[10px]" />
                                  </button>
                                  <button onClick={() => handleDelete(s._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <FaTrash className="text-[10px]" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-500 font-medium">Standard</span>
                                  <span className="text-gray-900 font-bold">Class {s.std || '—'}</span>
                                </div>
                                {s.stream && (
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500 font-medium">Stream</span>
                                    <span className="text-gray-700 font-semibold truncate max-w-[80px]">{s.stream}</span>
                                  </div>
                                )}
                                <div className="pt-1.5 border-t border-gray-50 mt-1.5 flex justify-end">
                                  {getLevelBadge(s.subject_level)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === 'list' && (
                <div className={`${isMobile ? 'space-y-3' : 'bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto'}`}>
                  {!isMobile ? (
                    <table className="w-full text-left min-w-[500px] sm:min-w-full">
                      <thead className="bg-[#002B5B] text-white">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Code</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Subject Name</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Standard</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Medium</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Level</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((s: any) => (
                          <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <span className="font-mono text-[10px] sm:text-xs font-bold text-primary-600">{s.subject_code || '—'}</span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <p className="font-bold text-gray-900 text-[11px] sm:text-sm">{s.subject_name}</p>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-medium text-gray-600">Class {s.std || '—'}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase ${s.medium === 'English' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                {s.medium}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">{getLevelBadge(s.subject_level)}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <button onClick={() => openEdit(s)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                  <FaEdit size={isMobile ? 12 : 14} />
                                </button>
                                <button onClick={() => handleDelete(s._id)} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                  <FaTrash size={isMobile ? 12 : 14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    filtered.map((s: any) => (
                      <div key={s._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {s.subject_code && (
                              <span className="text-[9px] font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                {s.subject_code}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${s.medium === 'English' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                              {s.medium}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{s.subject_name}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <span>Class {s.std || '—'}</span>
                            <span>•</span>
                            <span className="text-primary-600">{s.subject_level}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(s)} className="p-2 text-blue-600 bg-blue-50/50 rounded-lg active:bg-blue-100 transition-colors">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 bg-red-50/50 rounded-lg active:bg-red-100 transition-colors">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {viewMode === 'stdwise' && (
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-6'}`}>
                  {Object.entries(groupedData).map(([standard, mediumGroups]: [string, any]) => (
                    <div key={standard} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                      <div className={`bg-gradient-to-r from-[#002B5B] to-[#2D54A8] ${isMobile ? 'p-3' : 'p-5'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`${isMobile ? 'w-8 h-8 rounded-lg' : 'w-12 h-12 rounded-xl'} bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30`}>
                              <span className={`text-white font-black ${isMobile ? 'text-sm' : 'text-xl'}`}>{standard === 'Unassigned' ? '?' : standard}</span>
                            </div>
                            <div>
                              <h3 className={`text-white font-bold leading-tight ${isMobile ? 'text-sm' : 'text-lg'}`}>
                                {standard === 'Unassigned' ? 'Unassigned' : `Class ${standard}`}
                              </h3>
                              <p className={`text-blue-100 font-medium ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
                                {Object.values(mediumGroups).flat().length} Total Subjects
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleStd(standard)}
                            className={`${isMobile ? 'w-7 h-7' : 'w-10 h-10'} rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white`}
                          >
                            <FaChevronDown size={isMobile ? 12 : 16} className={`transition-transform duration-300 ${expandedStd === standard ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {expandedStd === standard && (
                        <div className={`${isMobile ? 'p-3' : 'p-5'} flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[500px] custom-scrollbar`}>
                          {Object.entries(mediumGroups).map(([medium, subjects]: [string, any]) => (
                            <div key={medium} className="py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${medium === 'English' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                  {medium} Medium
                                </h4>
                                <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-400`}>{subjects.length} Subjects</span>
                              </div>
                              <div className="space-y-1.5">
                                {subjects.map((s: any) => (
                                  <div key={s._id} className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-50 rounded-xl flex items-center justify-between group hover:bg-white hover:shadow-md hover:ring-1 hover:ring-[#002B5B10] transition-all`}>
                                    <div className="min-w-0 pr-2">
                                      <p className={`font-bold text-gray-900 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{s.subject_name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {s.subject_code && <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded`}>{s.subject_code}</span>}
                                        {s.stream && <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-gray-500 font-medium`}>· {s.stream}</span>}
                                      </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-white rounded-lg transition-colors">
                                        <FaEdit className={isMobile ? 'text-[10px]' : 'text-xs'} />
                                      </button>
                                      <button onClick={() => handleDelete(s._id)} className="p-1.5 text-red-600 hover:bg-white rounded-lg transition-colors">
                                        <FaTrash className={isMobile ? 'text-[10px]' : 'text-xs'} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Subject Modal */}
        <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Subject' : 'Add New Subject'}>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subject Name *</label>
                <input
                  name="subject_name"
                  value={form.subject_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Mathematics"
                  className="input-field"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subject Code {Number(form.std) >= 10 ? '*' : ''}</label>
                <input
                  name="subject_code"
                  value={form.subject_code}
                  onChange={handleFormChange}
                  placeholder="e.g. MATH-101"
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Standard *</label>
                <div className="select-wrapper">
                  <select name="std" value={form.std} onChange={handleFormChange} className="input-field" required>
                    <option value="">Select Class</option>
                    {Array.from(new Set(classes.map(c => c.standard))).sort((a, b) => Number(a) - Number(b)).map(std => (
                      <option key={std} value={std}>Class {std}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Medium *</label>
                <div className="select-wrapper">
                  <select name="medium" value={form.medium} onChange={handleFormChange} className="input-field" required>
                    <option value="English">English</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Level</label>
                <div className="select-wrapper">
                  <select name="subject_level" value={form.subject_level} onChange={handleFormChange} className="input-field">
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Higher Secondary">Higher Secondary</option>
                  </select>
                </div>
              </div>
              {Number(form.std) >= 11 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Stream *</label>
                  <div className="select-wrapper">
                    <select name="stream" value={form.stream} onChange={handleFormChange} className="input-field" required>
                      <option value="">Select Stream</option>
                      {getStreamOptions(form.std).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-base btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-base text-white !px-8" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}` }}>
                {editing ? 'Update Subject' : 'Create Subject'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Bulk Add Modal */}
        <BulkAddSubject isOpen={bulkModal} onClose={() => setBulkModal(false)} onCreated={fetch} />  
      </div>
    </div>
  );
};

export default Subjects;