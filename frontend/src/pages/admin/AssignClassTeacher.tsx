import React, { useState, useEffect } from 'react';
import { teacherAPI, classAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';

const AssignClassTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        teacherAPI.getAll(),
        classAPI.getAll()
      ]);
      setTeachers(tRes.data.data || []);
      setClasses(cRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (teacherCode: string, classId: string, currentTeacherCode: string) => {
    try {
      const isCurrentlyAssigned = currentTeacherCode === teacherCode;
      await classAPI.updateClassTeacher(classId, {
        teacher_code: teacherCode,
        is_class_teacher: !isCurrentlyAssigned
      });
      toast.success(isCurrentlyAssigned ? 'Teacher unassigned' : 'Class teacher assigned');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Class Teacher</h1>
        <p className="text-sm text-gray-500">Select a primary class teacher for each class</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">Teacher Name</th>
                <th className="px-6 py-4">Email</th>
                {classes.map(cls => (
                  <th key={cls._id} className="px-6 py-4 text-center">
                    {cls.standard}-{cls.division}
                    <div className="text-[8px] font-normal lowercase italic">({cls.medium})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map(teacher => (
                <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {teacher.first_name} {teacher.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                  {classes.map(cls => (
                    <td key={cls._id} className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        checked={cls.teacher_code === teacher.teacher_code}
                        onChange={() => handleToggle(teacher.teacher_code, cls._id, cls.teacher_code)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignClassTeacher;
