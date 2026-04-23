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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const themeConfig = {
    primary: '#002B5B',
    secondary: '#2D54A8',
  };

  const roleConfig = {
    admin: { label: 'Administrator', icon: FaUser, color: 'bg-[#002B5B]', id: user?.email },
    teacher: { label: 'Teacher', icon: FaChalkboardTeacher, color: 'bg-[#002B5B]', id: user?.teacher_code },
    student: { label: 'Student', icon: FaUserGraduate, color: 'bg-[#002B5B]', id: user?.gr_number },
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#F0F2F5]">
      {/* Mobile Header - Full Width White */}
      {isMobile && (
        <div className="bg-white px-4 py-4 border-b border-gray-100 shadow-sm mb-4">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage your personal information</p>
        </div>
      )}

      <div className={`max-w-4xl mx-auto ${isMobile ? 'px-3 pb-24' : 'p-5'} space-y-4`}>
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-xs mt-0.5">Manage your personal information</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ID Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md sticky top-5">
              {/* Header with gradient color */}
              <div className={`${cfg.color} h-20 relative`}>
                {/* Profile Image Container - Centered for both mobile and desktop */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : currentProfileImage ? (
                        <img src={currentProfileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <cfg.icon className="text-3xl text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -right-1 -bottom-1 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 focus:outline-none"
                      title="Change profile photo"
                    >
                      <FaPencilAlt className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Body Section */}
              <div className="pt-10 px-5 pb-5">
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-bold text-gray-900 capitalize tracking-tight">{user?.first_name} {user?.last_name}</h2>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">{cfg.label}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm">
                      <FaIdCard className="text-primary-600 text-xs" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">ID / CODE</p>
                      <p className="font-semibold text-xs text-gray-900 truncate">{cfg.id || '—'}</p>
                    </div>
                  </div>
                  {user?.email && (
                    <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm">
                        <FaEnvelope className="text-primary-600 text-xs" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Email Address</p>
                        <p className="font-semibold text-xs text-gray-900 truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="w-full py-2 bg-[#002B5B] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#2D54A8] disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-sm active:scale-95"
                  >
                    {uploading ? 'Updating...' : 'Update Photo'}
                  </button>
                  {currentProfileImage && (
                    <button
                      onClick={handleRemove}
                      disabled={uploading}
                      className="w-full py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details & Results - Right Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Info Grid */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FaSchool className="text-primary-600" size={16} /> Academic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user?.class_code && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Class Section</p>
                    <p className="text-xs font-bold text-gray-900">{user.class_code}</p>
                  </div>
                )}
                {user?.std && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Standard</p>
                    <p className="text-xs font-bold text-gray-900">{user.std}</p>
                  </div>
                )}
                {user?.medium && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Medium</p>
                    <p className="text-xs font-bold text-gray-900">{user.medium}</p>
                  </div>
                )}
                {role === 'teacher' && user?.experience != null && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Experience</p>
                    <p className="text-xs font-bold text-gray-900">{user.experience} Years</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Results for Students */}
            {role === 'student' && (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <FaUserGraduate className="text-primary-600" size={16} /> Exam Results
                  </h3>
                  <span className="hidden md:inline text-[10px] text-gray-400 font-medium">Recent exams</span>
                </div>

                {loadingResults ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : examResults.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <FaUserGraduate className="mx-auto text-gray-300 mb-2" size={20} />
                    <p className="text-gray-400 text-[10px] font-medium">No results available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="pb-2 text-[9px] font-bold uppercase tracking-wider">Subject</th>
                          <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-wider">Marks</th>
                          {!isMobile && <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-wider">Status</th>}
                          <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {examResults.map((res) => {
                          const marks = res.marks_obtained;
                          const total = res.total_marks;
                          const isPass = marks >= (res.exam_id?.passing_marks || (total * 0.35));
                          
                          return (
                            <tr key={res._id} className="hover:bg-gray-50 transition-colors group">
                              <td className="py-3">
                                <p className="font-bold text-xs text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">{res.exam_id?.exam_name || 'Exam'}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{res.subject_code}</p>
                              </td>
                              <td className="py-3 text-center">
                                <div className="inline-flex items-baseline gap-0.5">
                                  <span className="font-bold text-xs text-gray-900">{marks}</span>
                                  <span className="text-gray-400 text-[9px]">/{total}</span>
                                </div>
                              </td>
                              {!isMobile && (
                                <td className="py-3 text-center">
                                  <span className={`text-[9px] font-bold ${isPass ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPass ? 'Cleared' : 'Not Cleared'}
                                  </span>
                                </td>
                              )}
                              <td className="py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${
                                  isPass ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
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