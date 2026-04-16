import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTh, FaList, FaFilter, FaTimes, FaBook, FaGraduationCap, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import BulkAddSubject from '../../components/BulkAddSubject';

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
  const [expandedMedium, setExpandedMedium] = useState(null); // New state for medium expansion
  const [filters, setFilters] = useState({
    medium: '',
    stream: '',
    level: ''
  });

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

  const openAddForStd = (stdValue, mediumValue) => {
    setEditing(null);
    const level = getSubjectLevel(stdValue);
    setForm({ ...EMPTY, std: String(stdValue), subject_level: level, medium: mediumValue, stream: '' });
    setModal(true);
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
    setForm({ ...form, [name]: value });

    if (name === 'std') {
      const level = getSubjectLevel(value);
      setForm(prev => ({ ...prev, std: value, subject_level: level, stream: '' }));
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

  // Filter subjects
  const filtered = subjects.filter(s => {
    const matchesSearch = s.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code?.toLowerCase().includes(search.toLowerCase());
    const matchesStd = !selectedStd || s.std === selectedStd;
    const matchesMedium = !filters.medium || s.medium === filters.medium;
    const matchesStream = !filters.stream || s.stream === filters.stream;
    const matchesLevel = !filters.level || s.subject_level === filters.level;
    return matchesSearch && matchesStd && matchesMedium && matchesStream && matchesLevel;
  });

  // Group subjects by standard AND medium for stdwise view
  const groupByStandardAndMedium = () => {
    const grouped = {};
    
    filtered.forEach(subject => {
      const std = subject.std || 'Unassigned';
      const medium = subject.medium || 'Unknown';
      
      if (!grouped[std]) {
        grouped[std] = {};
      }
      if (!grouped[std][medium]) {
        grouped[std][medium] = [];
      }
      grouped[std][medium].push(subject);
    });

    // Sort standards
    const sortedGrouped = {};
    Object.keys(grouped).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return Number(a) - Number(b);
    }).forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  };

  const standards = [...new Set(subjects.map(s => s.std).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  const mediums = [...new Set(subjects.map(s => s.medium).filter(Boolean))];
  const streams = [...new Set(subjects.map(s => s.stream).filter(Boolean))];
  const levels = [...new Set(subjects.map(s => s.subject_level).filter(Boolean))];

  const resetFilters = () => {
    setSelectedStd('');
    setFilters({ medium: '', stream: '', level: '' });
    setSearch('');
  };

  const streamOptions = getStreamOptions(form.std);
  const isSubjectCodeRequired = Number(form.std) >= 10;
  const isStreamRequired = Number(form.std) >= 11;

  const getLevelColor = (level) => {
    if (level === 'Primary') return 'bg-green-100 text-green-700';
    if (level === 'Secondary') return 'bg-blue-100 text-blue-700';
    return 'bg-purple-100 text-purple-700';
  };

  const getMediumColor = (medium) => {
    return medium === 'English' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700';
  };

  const groupedData = groupByStandardAndMedium();

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Subjects</h1>
          <p className="text-xs text-gray-500">Manage school subjects</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openBulkAdd} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition">
            <FaPlus className="text-xs" />
            <span>Bulk Add</span>
          </button>
          <button onClick={openAdd} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition">
            <FaPlus className="text-xs" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 font-medium">Total</span>
            <FaBook className="text-blue-500 text-sm" />
          </div>
          <p className="text-lg font-bold text-blue-900">{subjects.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-600 font-medium">Primary</span>
            <FaGraduationCap className="text-green-500 text-sm" />
          </div>
          <p className="text-lg font-bold text-green-900">{subjects.filter(s => s.subject_level === 'Primary').length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-600 font-medium">Secondary</span>
            <FaGraduationCap className="text-purple-500 text-sm" />
          </div>
          <p className="text-lg font-bold text-purple-900">{subjects.filter(s => s.subject_level === 'Secondary').length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-600 font-medium">Higher Sec</span>
            <FaGraduationCap className="text-orange-500 text-sm" />
          </div>
          <p className="text-lg font-bold text-orange-900">{subjects.filter(s => s.subject_level === 'Higher Secondary').length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 text-sm ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-300 text-gray-600'
              }`}
          >
            <FaFilter className="text-xs" />
            <span>Filter</span>
          </button>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1.5 text-xs ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'}`}
              title="List View"
            >
              <FaList />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1.5 text-xs ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'}`}
              title="Grid View"
            >
              <FaTh />
            </button>
            <button
              onClick={() => setViewMode('stdwise')}
              className={`px-2 py-1.5 text-xs ${viewMode === 'stdwise' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'}`}
              title="Standard-wise View"
            >
              <FaLayerGroup />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t pt-2">
            <div className="grid grid-cols-4 gap-2">
              <select
                value={selectedStd}
                onChange={(e) => setSelectedStd(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="">All Std</option>
                {Array.from(new Set(classes.map(c => c.standard))).sort((a, b) => Number(a) - Number(b)).map(std => (
                  <option key={std} value={std}>Class {std}</option>
                ))}
              </select>

              <select
                value={filters.medium}
                onChange={(e) => setFilters({ ...filters, medium: e.target.value })}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="">All Medium</option>
                {mediums.map(medium => <option key={medium} value={medium}>{medium}</option>)}
              </select>

              <select
                value={filters.stream}
                onChange={(e) => setFilters({ ...filters, stream: e.target.value })}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="">All Stream</option>
                {streams.map(stream => <option key={stream} value={stream}>{stream}</option>)}
              </select>

              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="">All Level</option>
                {levels.map(level => <option key={level} value={level}>{level === 'Higher Secondary' ? 'Higher Sec' : level}</option>)}
              </select>
            </div>

            {(selectedStd || filters.medium || filters.stream || filters.level || search) && (
              <div className="flex justify-end mt-2">
                <button onClick={resetFilters} className="text-xs text-red-600 flex items-center gap-1">
                  <FaTimes className="text-xs" /> Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid View - With Medium Separation */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No subjects found</div>
          ) : (
            <>
              {/* English Section */}
              {filtered.some(s => s.medium === 'English') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">English Medium</h3>
                    <span className="text-xs text-gray-500">({filtered.filter(s => s.medium === 'English').length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {filtered.filter(s => s.medium === 'English').map((s) => (
                      <div key={s._id} className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            {s.subject_code && (
                              <p className="text-[10px] font-mono text-gray-500 truncate">{s.subject_code}</p>
                            )}
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{s.subject_name}</h3>
                          </div>
                          <div className="flex gap-0.5 ml-1 flex-shrink-0">
                            <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <FaEdit className="text-[10px]" />
                            </button>
                            <button onClick={() => handleDelete(s._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <FaTrash className="text-[10px]" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Class:</span>
                            <span className="font-medium text-gray-700">{s.std ? s.std : '—'}</span>
                          </div>
                          {s.stream && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Stream:</span>
                              <span className="text-gray-600 truncate max-w-[80px]">{s.stream}</span>
                            </div>
                          )}
                          <div className="pt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${getLevelColor(s.subject_level)}`}>
                              {s.subject_level === 'Higher Secondary' ? 'Higher Sec' : s.subject_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gujarati Section */}
              {filtered.some(s => s.medium === 'Gujarati') && (
                <div>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <div className="w-1 h-5 bg-orange-500 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Gujarati Medium</h3>
                    <span className="text-xs text-gray-500">({filtered.filter(s => s.medium === 'Gujarati').length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {filtered.filter(s => s.medium === 'Gujarati').map((s) => (
                      <div key={s._id} className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            {s.subject_code && (
                              <p className="text-[10px] font-mono text-gray-500 truncate">{s.subject_code}</p>
                            )}
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{s.subject_name}</h3>
                          </div>
                          <div className="flex gap-0.5 ml-1 flex-shrink-0">
                            <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <FaEdit className="text-[10px]" />
                            </button>
                            <button onClick={() => handleDelete(s._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <FaTrash className="text-[10px]" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Class:</span>
                            <span className="font-medium text-gray-700">{s.std ? s.std : '—'}</span>
                          </div>
                          {s.stream && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Stream:</span>
                              <span className="text-gray-600 truncate max-w-[80px]">{s.stream}</span>
                            </div>
                          )}
                          <div className="pt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${getLevelColor(s.subject_level)}`}>
                              {s.subject_level === 'Higher Secondary' ? 'Higher Sec' : s.subject_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* List View - With Medium Separation */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No subjects found</div>
          ) : (
            <>
              {/* English Section */}
              {filtered.some(s => s.medium === 'English') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">English Medium</h3>
                    <span className="text-xs text-gray-500">({filtered.filter(s => s.medium === 'English').length})</span>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-2 py-1.5 font-medium">Code</th>
                            <th className="px-2 py-1.5 font-medium">Name</th>
                            <th className="px-2 py-1.5 font-medium">Level</th>
                            <th className="px-2 py-1.5 font-medium">Std</th>
                            <th className="px-2 py-1.5 font-medium">Stream</th>
                            <th className="px-2 py-1.5 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filtered.filter(s => s.medium === 'English').map((s) => (
                            <tr key={s._id} className="hover:bg-gray-50">
                              <td className="px-2 py-1.5 font-mono text-primary-600">{s.subject_code || '—'}</td>
                              <td className="px-2 py-1.5 font-medium text-gray-900">{s.subject_name}</td>
                              <td className="px-2 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${getLevelColor(s.subject_level)}`}>
                                  {s.subject_level === 'Higher Secondary' ? 'Higher Sec' : s.subject_level}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-gray-600">{s.std || '—'}</td>
                              <td className="px-2 py-1.5 text-gray-600 max-w-[100px] truncate">{s.stream || '—'}</td>
                              <td className="px-2 py-1.5">
                                <div className="flex gap-1">
                                  <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                    <FaEdit className="text-[10px]" />
                                  </button>
                                  <button onClick={() => handleDelete(s._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <FaTrash className="text-[10px]" />
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
              )}

              {/* Gujarati Section */}
              {filtered.some(s => s.medium === 'Gujarati') && (
                <div>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <div className="w-1 h-5 bg-orange-500 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Gujarati Medium</h3>
                    <span className="text-xs text-gray-500">({filtered.filter(s => s.medium === 'Gujarati').length})</span>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-2 py-1.5 font-medium">Code</th>
                            <th className="px-2 py-1.5 font-medium">Name</th>
                            <th className="px-2 py-1.5 font-medium">Level</th>
                            <th className="px-2 py-1.5 font-medium">Std</th>
                            <th className="px-2 py-1.5 font-medium">Stream</th>
                            <th className="px-2 py-1.5 font-medium">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filtered.filter(s => s.medium === 'Gujarati').map((s) => (
                            <tr key={s._id} className="hover:bg-gray-50">
                              <td className="px-2 py-1.5 font-mono text-primary-600">{s.subject_code || '—'}</td>
                              <td className="px-2 py-1.5 font-medium text-gray-900">{s.subject_name}</td>
                              <td className="px-2 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${getLevelColor(s.subject_level)}`}>
                                  {s.subject_level === 'Higher Secondary' ? 'Higher Sec' : s.subject_level}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-gray-600">{s.std || '—'}</td>
                              <td className="px-2 py-1.5 text-gray-600 max-w-[100px] truncate">{s.stream || '—'}</td>
                              <td className="px-2 py-1.5">
                                <div className="flex gap-1">
                                  <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                    <FaEdit className="text-[10px]" />
                                  </button>
                                  <button onClick={() => handleDelete(s._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <FaTrash className="text-[10px]" />
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
              )}
            </>
          )}
        </div>
      )}

      {/* Standard-wise Card View - WITH MEDIUM SEPARATION */}
      {viewMode === 'stdwise' && (
        <div className="space-y-3">
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No subjects found</div>
          ) : (
            Object.entries(groupedData).map(([standard, mediumGroups]) => (
              <div key={standard} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {/* Standard Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-xs">
                          {standard === 'Unassigned' ? '?' : standard}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">
                          {standard === 'Unassigned' ? 'Unassigned Subjects' : `Class ${standard}`}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {Object.values(mediumGroups).flat().length} subjects
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExpandedStd(expandedStd === standard ? null : standard)} 
                      className={`p-1 rounded transition-transform ${expandedStd === standard ? 'rotate-180' : ''}`}
                      title="Toggle"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Subjects Grid - Shows when expanded */}
                {expandedStd === standard && (
                  <div className="p-3 space-y-4">
                    {/* English Medium Section */}
                    {mediumGroups['English'] && mediumGroups['English'].length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                          <h4 className="text-xs font-semibold text-gray-700">English Medium</h4>
                          <span className="text-[10px] text-gray-400">({mediumGroups['English'].length})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {mediumGroups['English'].map((subject) => (
                            <div key={subject._id} className="border border-gray-100 rounded-lg p-2 hover:shadow-md transition-shadow bg-white">
                              {subject.subject_code && (
                                <div className="mb-1">
                                  <span className="text-[9px] font-mono text-primary-600 bg-primary-50 px-1 py-0.5 rounded">
                                    {subject.subject_code}
                                  </span>
                                </div>
                              )}
                              <h4 className="text-xs font-semibold text-gray-900 mb-1.5 truncate">{subject.subject_name}</h4>
                              <div className="space-y-1 text-[9px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Level:</span>
                                  <span className={`px-1 py-0.5 rounded-full text-[8px] font-medium ${getLevelColor(subject.subject_level)}`}>
                                    {subject.subject_level === 'Higher Secondary' ? 'Higher Sec' : subject.subject_level}
                                  </span>
                                </div>
                                {subject.stream && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Stream:</span>
                                    <span className="text-gray-600 text-[8px] truncate max-w-[70px]">{subject.stream}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 mt-2 pt-1 border-t border-gray-50 justify-end">
                                <button onClick={() => openEdit(subject)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded">
                                  <FaEdit className="text-[8px]" />
                                </button>
                                <button onClick={() => handleDelete(subject._id)} className="p-0.5 text-red-600 hover:bg-red-50 rounded">
                                  <FaTrash className="text-[8px]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gujarati Medium Section */}
                    {mediumGroups['Gujarati'] && mediumGroups['Gujarati'].length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 mt-3">
                          <div className="w-1 h-4 bg-orange-500 rounded"></div>
                          <h4 className="text-xs font-semibold text-gray-700">Gujarati Medium</h4>
                          <span className="text-[10px] text-gray-400">({mediumGroups['Gujarati'].length})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {mediumGroups['Gujarati'].map((subject) => (
                            <div key={subject._id} className="border border-gray-100 rounded-lg p-2 hover:shadow-md transition-shadow bg-white">
                              {subject.subject_code && (
                                <div className="mb-1">
                                  <span className="text-[9px] font-mono text-primary-600 bg-primary-50 px-1 py-0.5 rounded">
                                    {subject.subject_code}
                                  </span>
                                </div>
                              )}
                              <h4 className="text-xs font-semibold text-gray-900 mb-1.5 truncate">{subject.subject_name}</h4>
                              <div className="space-y-1 text-[9px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Level:</span>
                                  <span className={`px-1 py-0.5 rounded-full text-[8px] font-medium ${getLevelColor(subject.subject_level)}`}>
                                    {subject.subject_level === 'Higher Secondary' ? 'Higher Sec' : subject.subject_level}
                                  </span>
                                </div>
                                {subject.stream && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Stream:</span>
                                    <span className="text-gray-600 text-[8px] truncate max-w-[70px]">{subject.stream}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 mt-2 pt-1 border-t border-gray-50 justify-end">
                                <button onClick={() => openEdit(subject)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded">
                                  <FaEdit className="text-[8px]" />
                                </button>
                                <button onClick={() => handleDelete(subject._id)} className="p-0.5 text-red-600 hover:bg-red-50 rounded">
                                  <FaTrash className="text-[8px]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && viewMode !== 'stdwise' && (
        <div className="text-center text-[10px] text-gray-400">
          {filtered.length} of {subjects.length} subjects
        </div>
      )}

      {viewMode === 'stdwise' && Object.keys(groupedData).length > 0 && (
        <div className="text-center text-[10px] text-gray-400">
          {subjects.length} subjects across {Object.keys(groupedData).length} standards
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Class *</label>
              <select className="w-full px-2 py-1.5 text-sm border rounded-lg" name="std" required value={form.std} onChange={handleFormChange}>
                <option value="">Select</option>
                {Array.from(new Set(classes.map(c => c.standard))).sort((a, b) => Number(a) - Number(b)).map(s => (
                  <option key={s} value={s}>Class {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Medium *</label>
              <select className="w-full px-2 py-1.5 text-sm border rounded-lg" name="medium" required value={form.medium} onChange={handleFormChange}>
                <option value="English">English</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Code {isSubjectCodeRequired && '*'}</label>
              <input className="w-full px-2 py-1.5 text-sm border rounded-lg" name="subject_code" value={form.subject_code} onChange={handleFormChange} required={isSubjectCodeRequired} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Name *</label>
              <input className="w-full px-2 py-1.5 text-sm border rounded-lg" name="subject_name" required value={form.subject_name} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Level</label>
              <input className="w-full px-2 py-1.5 text-sm border rounded-lg bg-gray-50" value={form.subject_level} disabled />
            </div>
            {streamOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Stream {isStreamRequired && '*'}</label>
                <select className="w-full px-2 py-1.5 text-sm border rounded-lg" name="stream" value={form.stream} onChange={handleFormChange} required={isStreamRequired}>
                  <option value="">Select</option>
                  {streamOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      </Modal>

      <BulkAddSubject
        isOpen={bulkModal}
        onClose={() => setBulkModal(false)}
        onCreated={fetch}
      />
    </div>
  );
};

export default Subjects;