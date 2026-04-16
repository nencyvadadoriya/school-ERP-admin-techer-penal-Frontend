import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaTh, FaThList, FaEye, 
  FaChevronDown, FaChevronRight, FaBook, FaGraduationCap, 
  FaClock, FaTag, FaLayerGroup 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';

const EMPTY = { standard: '', division: 'A', medium: 'English', stream: '', shift: 'Morning' };

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('grid');
  const [expandedStandard, setExpandedStandard] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/class');
      const classesData = response.data?.data || [];

      const sortedClasses = [...classesData].sort((a, b) => {
        const stdA = Number(a.standard);
        const stdB = Number(b.standard);
        return stdA - stdB;
      });

      setClasses(sortedClasses);
    } catch (e) {
      if (e.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (e.response?.status === 404) {
        toast.error('Classes API not found. Make sure backend classRoutes is registered in server.js');
      } else {
        toast.error('Failed to fetch classes: ' + (e.response?.data?.message || e.message));
      }
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teacher');
      const teachersData = response.data?.data || [];
      setTeachers(teachersData);
    } catch (err) {
      setTeachers([]);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...c });
    setModal(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const std = Number(form.standard);

    if (std >= 11) {
      const validStreams = ["Science-Maths", "Science-Bio", "Commerce", "Higher Secondary"];
      if (!validStreams.includes(form.stream)) {
        toast.error("Std 11-12 ma valid stream select karo");
        return;
      }
    }

    try {
      setLoading(true);
      const dataToSend = { ...form };

      if (editing) {
        await api.patch(`/class/${editing._id}`, dataToSend);
        toast.success('Class updated successfully');
      } else {
        await api.post('/class', dataToSend);
        toast.success('Class created successfully');
      }
      setModal(false);
      await fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving class');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      setLoading(true);
      await api.delete(`/class/${id}`);
      toast.success('Class deleted successfully');
      await fetchClasses();
    } catch (e) {
      toast.error('Error deleting class');
    } finally {
      setLoading(false);
    }
  };

  const toggleStandard = (standard) => {
    setExpandedStandard(prev => prev === standard ? null : standard);
  };

  const filtered = classes.filter(c =>
    c.standard?.toString().toLowerCase().includes(search.toLowerCase()) ||
    c.division?.toLowerCase().includes(search.toLowerCase()) ||
    c.medium?.toLowerCase().includes(search.toLowerCase())
  );

  const groupClassesByStandard = () => {
    const grouped: Record<string, any[]> = {};
    filtered.forEach(classItem => {
      const standard = classItem.standard;
      if (!grouped[standard]) {
        grouped[standard] = [];
      }
      grouped[standard].push(classItem);
    });
    return grouped;
  };

  const groupedClasses = groupClassesByStandard();

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium"><FaTag className="inline mr-1" size={12} /> Standard</th>
            <th className="pb-3 font-medium"><FaLayerGroup className="inline mr-1" size={12} /> Division</th>
            <th className="pb-3 font-medium"><FaBook className="inline mr-1" size={12} /> Medium</th>
            <th className="pb-3 font-medium"><FaGraduationCap className="inline mr-1" size={12} /> Stream</th>
            <th className="pb-3 font-medium"><FaClock className="inline mr-1" size={12} /> Shift</th>
            <th className="pb-3 font-medium">Actions</th>
           </tr>
        </thead>
        <tbody>
            {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8">
                <div className="text-gray-400">
                  {search ? 'No matching classes found' : 'No classes found'}
                  {!search && (
                    <div className="mt-2">
                      <button
                        onClick={openAdd}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Click here to add your first class
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            filtered.map((c) => (
              <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 font-medium">Class {c.standard}</td>
                <td className="py-3">{c.division}</td>
                <td className="py-3">{c.medium}</td>
                <td className="py-3">{c.stream || '—'}</td>
                <td className="py-3">{c.shift}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
               </tr>
            ))
          )}
        </tbody>
       </table>
    </div>
  );

  const renderGridView = () => {
    const standards = Object.keys(groupedClasses).sort((a, b) => Number(a) - Number(b));

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        {standards.map(standard => (
          <div key={standard} className="border border-gray-200 rounded-lg overflow-hidden" style={{ width: 'calc(33.333% - 11px)', minWidth: '250px', flex: '0 0 auto', alignSelf: 'flex-start' }}>
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 cursor-pointer hover:from-primary-600 hover:to-primary-700 transition-colors"
              onClick={() => toggleStandard(standard)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Standard {standard}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                    {groupedClasses[standard].length} {groupedClasses[standard].length === 1 ? 'Class' : 'Classes'}
                  </span>
                  {expandedStandard === standard ? (
                    <FaChevronDown className="text-white" />
                  ) : (
                    <FaChevronRight className="text-white" />
                  )}
                </div>
              </div>
            </div>

            {expandedStandard === standard && (
              <div className="p-3 space-y-2 bg-gray-50 max-h-96 overflow-y-auto">
                {groupedClasses[standard].map(classItem => (
                  <div key={classItem._id} className="bg-white p-3 rounded-lg hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-800 text-lg">Division {classItem.division}</span>
                          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                            <FaClock className="inline mr-1" size={10} /> {classItem.shift}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <FaBook className="text-primary-500" size={12} />
                            <span>Medium:</span>
                            <span className="font-medium">{classItem.medium}</span>
                          </div>
                          {classItem.stream && (
                            <div className="flex items-center gap-2">
                              <FaGraduationCap className="text-primary-500" size={12} />
                              <span>Stream:</span>
                              <span className="font-medium">{classItem.stream}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation();
                            openEdit(classItem);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleDelete(classItem._id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {standards.length === 0 && (
          <div className="w-full text-center py-8">
            <div className="text-gray-400">
              {search ? 'No matching classes found' : 'No classes found'}
              {!search && (
                <div className="mt-2">
                  <button
                    onClick={openAdd}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Click here to add your first class
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <div className="text-gray-400">
            {search ? 'No matching classes found' : 'No classes found'}
            {!search && (
              <div className="mt-2">
                <button
                  onClick={openAdd}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Click here to add your first class
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        filtered.map(classItem => (
          <div key={classItem._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Class {classItem.standard}</h3>
                  <p className="text-sm opacity-90">Division {classItem.division}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(classItem)}
                    className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                    disabled={loading}
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(classItem._id)}
                    className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                    disabled={loading}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 text-sm"><FaBook className="inline mr-2" size={12} /> Medium:</span>
                  <span className="font-medium text-gray-800">{classItem.medium}</span>
                </div>
                {classItem.stream && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-600 text-sm"><FaGraduationCap className="inline mr-2" size={12} /> Stream:</span>
                    <span className="font-medium text-gray-800">{classItem.stream}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm"><FaClock className="inline mr-2" size={12} /> Shift:</span>
                  <span className="font-medium text-gray-800">{classItem.shift}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-sm text-gray-500">Manage all classes</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaThList size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaTh size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'card'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaEye size={14} /> Card
            </button>
          </div>

          <button
            onClick={openAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <FaPlus /> Add Class
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Search by standard, division, or medium..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {viewMode === 'table' && renderTableView()}
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'card' && renderCardView()}

        {classes.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {filtered.length} of {classes.length} classes
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                value={form.standard}
                onChange={e => setForm({ ...form, standard: e.target.value })}
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s =>
                  <option key={s} value={s}>Class {s}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={form.division}
                onChange={e => setForm({ ...form, division: e.target.value })}
              >
                {['A', 'B', 'C', 'D'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={form.medium}
                onChange={e => setForm({ ...form, medium: e.target.value })}
              >
                <option>English</option>
                <option>Gujarati</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={form.stream}
                onChange={e => setForm({ ...form, stream: e.target.value })}
              >
                <option value="">None</option>
                <option>Science-Maths</option>
                <option>Science-Bio</option>
                <option>Commerce</option>
                <option>Foundation</option>
                <option>Primary</option>
                <option>Upper Primary</option>
                <option>Secondary</option>
                <option>Higher Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={form.shift}
                onChange={e => setForm({ ...form, shift: e.target.value })}
              >
                <option>Morning</option>
                <option>Afternoon</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Classes;