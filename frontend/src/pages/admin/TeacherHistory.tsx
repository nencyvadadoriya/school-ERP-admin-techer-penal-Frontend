import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { teacherAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaEnvelope, FaPhone, FaBriefcase, FaBook, FaSchool, FaInfoCircle } from 'react-icons/fa';

const TeacherHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        if (!id) return;
        const response = await teacherAPI.getAll(); 
        const foundTeacher = response.data.data.find((t: any) => (t._id || t.id) === id);
        
        if (foundTeacher) {
          setTeacher(foundTeacher);
        } else {
          toast.error('Teacher not found');
          navigate('/admin/teachers');
        }
      } catch (error) {
        console.error('Error fetching teacher details:', error);
        toast.error('Error fetching teacher details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [id, navigate]);

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  if (!teacher) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/teachers')}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back to Teachers</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Registration History</h1>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{teacher.first_name} {teacher.last_name}</h2>
              <p className="text-blue-100 flex items-center mt-1">
                <FaEnvelope className="mr-2" /> {teacher.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Registration Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" /> Registration Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center">
                  <FaCalendarAlt className="mr-2" /> Added Date
                </span>
                <span className="font-medium text-gray-900">{formatDate(teacher.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center">
                  <FaClock className="mr-2" /> Added Time
                </span>
                <span className="font-medium text-gray-900">{formatTime(teacher.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaBriefcase className="mr-2 text-blue-500" /> Professional Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Experience</span>
                <span className="font-medium text-gray-900">{teacher.experience || 0} Years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Medium</span>
                <span className="font-medium text-gray-900">{teacher.medium || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Class & Subjects */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaSchool className="mr-2 text-blue-500" /> Assignment Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Assigned Class</p>
                <p className="font-medium text-gray-900">{Array.isArray(teacher.assigned_class) ? teacher.assigned_class.join(', ') : (teacher.assigned_class || 'Not assigned')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm flex items-center mb-1">
                  <FaBook className="mr-2" /> Subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {(teacher.subjects || []).map((subject: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                      {subject}
                    </span>
                  ))}
                  {(teacher.subjects || []).length === 0 && <span className="text-gray-400">None</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaPhone className="mr-2 text-blue-500" /> Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{teacher.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Bio */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaUser className="mr-2 text-blue-500" /> About / Bio
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg italic text-gray-700">
              {teacher.about || 'No bio provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;
