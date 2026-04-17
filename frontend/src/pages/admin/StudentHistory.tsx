import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import StudentPrediction from '../../components/StudentPrediction';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaIdCard, FaPhone, FaMapMarkerAlt, FaSchool, FaInfoCircle } from 'react-icons/fa';

const StudentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        if (!id) return;
        const response = await studentAPI.getById(id);
        const foundStudent = response?.data?.data;
        if (!foundStudent) {
          toast.error('Student not found');
          navigate('/admin/students');
          return;
        }
        setStudent(foundStudent);
      } catch (error) {
        console.error('Error fetching student details:', error);
        toast.error('Error fetching student details');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!student) return null;

  const derivedMedium = student?.class_details?.medium || student?.medium;
  const derivedShift = student?.shift || student?.class_details?.shift;

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
          onClick={() => navigate('/admin/students')}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back to Students</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Student Registration History</h1>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="bg-primary-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student.first_name} {student.middle_name} {student.last_name}</h2>
              <p className="text-primary-100 flex items-center mt-1">
                <FaIdCard className="mr-2" /> GR No: {student.gr_number}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Registration Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-primary-500" /> Registration Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center">
                  <FaCalendarAlt className="mr-2" /> Added Date
                </span>
                <span className="font-medium text-gray-900">{formatDate(student.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center">
                  <FaClock className="mr-2" /> Added Time
                </span>
                <span className="font-medium text-gray-900">{formatTime(student.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaSchool className="mr-2 text-primary-500" /> Academic Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Standard</span>
                <span className="font-medium text-gray-900">Class {student.std}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Class</span>
                <span className="font-medium text-gray-900">{student.class_name || student.class_code || student.classCode || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Medium</span>
                <span className="font-medium text-gray-900">{derivedMedium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Roll No</span>
                <span className="font-medium text-gray-900">{student.roll_no || student.rollNo || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-primary-600 font-bold">
                <span className="text-gray-500">Fees Amount</span>
                <span>₹{student.fees || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Stream</span>
                <span className="font-medium text-gray-900">{student.stream || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaPhone className="mr-2 text-primary-500" /> Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Primary Phone</span>
                <span className="font-medium text-gray-900">{student.phone1 || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Secondary Phone</span>
                <span className="font-medium text-gray-900">{student.phone2 || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaUser className="mr-2 text-primary-500" /> Personal Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-900">{student.gender || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Shift</span>
                <span className="font-medium text-gray-900">{derivedShift || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-primary-500" /> Address Info
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{student.address || 'No address provided'}</p>
              {student.pin && <p className="text-gray-500 mt-2">PIN: {student.pin}</p>}
            </div>
          </div>

          {/* Performance Prediction */}
          <div className="md:col-span-2">
            <StudentPrediction studentId={id!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
