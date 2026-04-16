import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { adminAPI, teacherAPI, studentAPI, examAPI } from '../services/api';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaSchool, FaUserGraduate, FaChalkboardTeacher, FaPencilAlt, FaUpload, FaTrashAlt } from 'react-icons/fa';
import Spinner from '../components/Spinner';

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const role = user?.role;

  const roleConfig = {
    admin: { label: 'Administrator', icon: FaUser, color: 'bg-purple-500', id: user?.email },
    teacher: { label: 'Teacher', icon: FaChalkboardTeacher, color: 'bg-green-500', id: user?.teacher_code },
    student: { label: 'Student', icon: FaUserGraduate, color: 'bg-blue-500', id: user?.gr_number },
  };
  const cfg = roleConfig[role as keyof typeof roleConfig] || roleConfig.admin;

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast.error('Please select an image');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profile_image', selectedFile);
      
      let response: any;
      const userId = user._id || user.id;
      
      console.log('Uploading for role:', user.role);
      console.log('User ID:', userId);
      
      // Use the updateImage method from your API
      if (user.role === 'admin') {
        response = await adminAPI.updateImage(userId, formData);
      } else if (user.role === 'teacher') {
        response = await teacherAPI.updateImage(userId, formData);
      } else {
        response = await studentAPI.updateImage(userId, formData);
      }
      
      console.log('Upload response:', response);
      
      // Check if response has the updated user data
      const updatedUser = response?.data?.data || response?.data;
      if (updatedUser) {
        const currentToken = localStorage.getItem('token') || '';
        // CRITICAL: Preserve the role if it's missing in the response
        const userToLogin = {
          ...updatedUser,
          role: updatedUser.role || user.role
        };
        login(userToLogin, currentToken);
        toast.success('Profile photo updated successfully!');
        setSelectedFile(null);
        setPreview(null);
      } else {
        // If no user data returned, just refresh the user data
        const refreshResponse = await getUserData(user.role, userId);
        if (refreshResponse?.data?.data || refreshResponse?.data) {
          const refreshedUser = refreshResponse?.data?.data || refreshResponse?.data;
          const currentToken = localStorage.getItem('token') || '';
          // CRITICAL: Preserve the role if it's missing in the response
          const userToLogin = {
            ...refreshedUser,
            role: refreshedUser.role || user.role
          };
          login(userToLogin, currentToken);
          toast.success('Profile photo updated successfully!');
        } else {
          toast.success('Profile photo uploaded successfully!');
        }
        setSelectedFile(null);
        setPreview(null);
      }
    } catch (err: any) {
      console.error('Upload error details:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message || 
                          'Upload failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Helper function to refresh user data
  const getUserData = async (role: string, userId: string) => {
    if (role === 'admin') {
      return await adminAPI.getById(userId);
    } else if (role === 'teacher') {
      return await teacherAPI.getById(userId);
    } else {
      return await studentAPI.getById(userId);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    try {
      setUploading(true);
      const userId = user._id || user.id;
      
      // Send update with remove_profile_image flag
      const updateData = { remove_profile_image: true };
      
      let response: any;
      if (user.role === 'admin') {
        response = await adminAPI.update(userId, updateData);
      } else if (user.role === 'teacher') {
        response = await teacherAPI.update(userId, updateData);
      } else {
        response = await studentAPI.update(userId, updateData);
      }
      
      const updatedUser = response?.data?.data || response?.data;
      if (updatedUser) {
        const currentToken = localStorage.getItem('token') || '';
        // CRITICAL: Preserve the role if it's missing in the response
        const userToLogin = {
          ...updatedUser,
          role: updatedUser.role || user.role
        };
        login(userToLogin, currentToken);
        toast.success('Profile photo removed successfully');
      }
    } catch (err: any) {
      console.error('Remove error:', err);
      toast.error(err.response?.data?.message || err.message || 'Remove failed');
    } finally {
      setUploading(false);
    }
  };

  const [examResults, setExamResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentResults();
    }
  }, [user]);

  const fetchStudentResults = async () => {
    try {
      setLoadingResults(true);
      const res = await examAPI.getResults({ gr_number: user?.gr_number });
      setExamResults(res.data.data || []);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const currentProfileImage = user?.profile_image;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and view academic performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ID Card - Left Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl sticky top-6">
            {/* Header with gradient color */}
            <div className={`${cfg.color} h-24 relative`}>
              {/* Profile Image Container */}
              <div className="absolute -bottom-10 left-6 z-10">
                <div className="relative">
                  <div className="w-20 h-24 bg-white rounded-lg border-4 border-white shadow-md overflow-hidden">
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentProfileImage ? (
                      <img src={currentProfileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <cfg.icon className="text-4xl text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -right-2 -bottom-2 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-xs text-gray-700 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 focus:outline-none"
                    title="Change profile photo"
                  >
                    <FaPencilAlt className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Body Section */}
            <div className="pt-12 px-6 pb-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <FaIdCard className="text-primary-600 text-sm" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">ID</p>
                    <p className="font-medium text-xs text-gray-900">{cfg.id || '—'}</p>
                  </div>
                </div>
                {user?.email && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <FaEnvelope className="text-primary-600 text-sm" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase">Email</p>
                      <p className="font-medium text-xs text-gray-900 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Update Photo'}
                </button>
                {currentProfileImage && (
                  <button
                    onClick={handleRemove}
                    disabled={uploading}
                    className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details & Results - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaSchool className="text-primary-600" /> Academic Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {user?.class_code && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Class</p>
                  <p className="text-sm font-semibold text-gray-900">{user.class_code}</p>
                </div>
              )}
              {user?.std && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Standard</p>
                  <p className="text-sm font-semibold text-gray-900">{user.std}</p>
                </div>
              )}
              {user?.medium && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Medium</p>
                  <p className="text-sm font-semibold text-gray-900">{user.medium}</p>
                </div>
              )}
              {role === 'teacher' && user?.experience != null && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Experience</p>
                  <p className="text-sm font-semibold text-gray-900">{user.experience} years</p>
                </div>
              )}
            </div>
          </div>

          {/* Exam Results for Students */}
          {role === 'student' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FaUserGraduate className="text-primary-600" /> Exam Results
                </h3>
                <span className="text-[10px] text-gray-400">Showing recent exams</span>
              </div>

              {loadingResults ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : examResults.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">No exam results found yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-semibold">Exam/Subject</th>
                        <th className="pb-2 font-semibold text-center">Marks</th>
                        <th className="pb-2 font-semibold text-center">Cut Marks</th>
                        <th className="pb-2 font-semibold text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {examResults.map((res) => {
                        const marks = res.marks_obtained;
                        const total = res.total_marks;
                        const cut = (total - marks).toFixed(1);
                        const isPass = marks >= (res.exam_id?.passing_marks || (total * 0.35));
                        
                        return (
                          <tr key={res._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3">
                              <p className="font-bold text-gray-900">{res.exam_id?.exam_name || 'Exam'}</p>
                              <p className="text-[10px] text-gray-500">{res.subject_code}</p>
                            </td>
                            <td className="py-3 text-center">
                              <span className="font-bold text-gray-900">{marks}</span>
                              <span className="text-gray-400">/{total}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-red-500 font-medium">-{cut}</span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {isPass ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default Profile;