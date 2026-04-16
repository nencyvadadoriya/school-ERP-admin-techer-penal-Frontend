import React, { useState, useEffect } from 'react';
import { teacherAPI, classAPI, subjectAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaSave, FaTrash, FaPlus, FaChalkboardTeacher, FaBook, FaLayerGroup, FaHistory, FaSearch, FaEdit } from 'react-icons/fa';
import Spinner from '../../components/Spinner';

const SubjectAssignment: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selection states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  
  // Search state for history
  const [historySearch, setHistorySearch] = useState('');
  
  // Current teacher's assignments
  const [assignments, setAssignments] = useState<any[]>([]);

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

  if (loading) return <Spinner />;

  const filteredClasses = classes.filter(c => !selectedMedium || c.medium === selectedMedium);
  const firstSelectedClass = classes.find(c => c._id === selectedClassIds[0]);
  const filteredSubjects = subjects.filter(s => {
    if (!selectedMedium || s.medium !== selectedMedium) return false;
    if (!firstSelectedClass) return false;
    // Show subjects for the standard of the first selected class
    // (Assuming all selected classes should be of same standard for bulk assignment)
    return String(s.std) === String(firstSelectedClass.standard);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Assignment</h1>
          <p className="text-gray-600">Assign subjects to teachers based on medium and class</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
          <div className="text-center px-4 border-r">
            <p className="text-xs text-gray-500 uppercase">Total Teachers</p>
            <p className="text-xl font-bold text-primary-600">{teachers.length}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-gray-500 uppercase">Total Subjects</p>
            <p className="text-xl font-bold text-blue-600">{subjects.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FaChalkboardTeacher className="text-primary-500" />
              Step 1: Select Teacher
            </h2>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="input-field"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {t.first_name} {t.last_name} ({t.teacher_code})
                </option>
              ))}
            </select>
          </div>

          <div className="card p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FaLayerGroup className="text-blue-500" />
              Step 2: Filter Medium & Class
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Medium</label>
                <select
                  value={selectedMedium}
                  onChange={(e) => {
                    setSelectedMedium(e.target.value);
                    setSelectedClassIds([]);
                  }}
                  className="input-field"
                >
                  <option value="">Select Medium</option>
                  <option value="English">English</option>
                  <option value="Gujarati">Gujarati</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block text-blue-600 font-bold">Select Classes (Multiple)</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2 bg-gray-50">
                  {filteredClasses.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No classes found for this medium</p>
                  ) : (
                    filteredClasses.map(c => (
                      <label key={c._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
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
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          Std {c.standard} - Div {c.division} ({c.shift})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedClassIds.length > 0 && (
                  <button 
                    onClick={() => setSelectedClassIds([])}
                    className="text-[10px] text-red-500 hover:text-red-700 mt-1 font-medium"
                  >
                    Clear All Selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedTeacherId && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <FaSave />
                {submitting ? 'Saving...' : 'Save All Assignments'}
              </button>
              <button
                onClick={handleClearForm}
                className="btn-secondary w-full py-2 text-sm"
              >
                Clear Form / Cancel
              </button>
            </div>
          )}
        </div>

        {/* Subjects & Current Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Available Subjects */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBook className="text-green-500" />
                Step 3: Choose Subjects to Assign
              </div>
              {selectedClassIds.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  Assigning to {selectedClassIds.length} Class(es)
                </span>
              )}
            </h2>
            
            {selectedClassIds.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">Please select Medium and at least one Class to see available subjects</p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">No subjects found for this class and medium</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredSubjects.map(subject => (
                  <button
                    key={subject._id}
                    onClick={() => handleAddAssignment(subject)}
                    className="p-3 text-left border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{subject.subject_name}</p>
                      <p className="text-[10px] text-gray-500">{subject.subject_code || 'No Code'}</p>
                    </div>
                    <FaPlus className="text-xs text-gray-300 group-hover:text-primary-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Assignments Table */}
          <div className="card overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Current Assignments for Selected Teacher</h3>
              {selectedTeacherId && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                  {assignments.length} Total
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                        {selectedTeacherId ? 'No subjects assigned yet. Add subjects from above.' : 'Please select a teacher to view and manage assignments.'}
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{assignment.subject_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{assignment.class_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            assignment.medium === 'English' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {assignment.medium}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveAssignment(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FaTrash size={14} />
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

      {/* Assignment History Section */}
      <div className="card overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FaHistory className="text-gray-500" />
            <h3 className="font-bold text-gray-900">Assignment History (All Teachers)</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="input-field pl-9 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medium</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {historySearch ? 'No matching assignments found.' : 'No assignments found in history.'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((assignment, index) => (
                  <tr key={`${assignment.teacher_id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{assignment.teacher_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{assignment.teacher_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.subject_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {assignment.classes.map((cls: string, i: number) => (
                          <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        assignment.medium === 'English' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {assignment.medium}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedTeacherId(assignment.teacher_id);
                            // Set medium to match for editing
                            setSelectedMedium(assignment.medium);
                          }}
                          className="text-primary-600 hover:text-primary-900 font-bold"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(assignment.teacher_id, assignment.subject_id, assignment.medium)}
                          className="text-red-600 hover:text-red-900 font-bold"
                          title="Delete all classes for this subject"
                        >
                          <FaTrash size={14} />
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
  );
};

export default SubjectAssignment;
