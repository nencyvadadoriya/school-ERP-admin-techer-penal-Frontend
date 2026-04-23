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
    teacher: { label: 'Teacher', icon: FaChalkboardTeacher, color: 'bg-green-600', id: user?.teacher_code },
    student: { label: 'Student', icon: FaUserGraduate, color: 'bg-blue-600', id: user?.gr_number },
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
    <div className="h-screen overflow-y-auto custom-scrollbar bg-[#F0F2F5]">
      <div className={`max-w-4xl mx-auto ${isMobile ? 'p-0 pb-24' : 'p-6'} space-y-6`}>
        {/* Header */}
        <div className={`${isMobile ? 'bg-[#002B5B] p-4 border-b border-white/10' : ''}`}>
          <h1 className={`text-2xl font-bold ${isMobile ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
          <p className={`${isMobile ? 'text-white/70' : 'text-gray-500'} text-sm mt-1`}>Manage your personal information</p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isMobile ? 'px-3' : ''}`}>
          {/* ID Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl sticky top-6">
              {/* Header with gradient color */}
              <div className={`${cfg.color} ${isMobile ? 'h-20' : 'h-24'} relative`}>
                {/* Profile Image Container */}
                <div className={`absolute ${isMobile ? '-bottom-8 left-4' : '-bottom-10 left-6'} z-10`}>
                  <div className="relative">
                    <div className={`${isMobile ? 'w-16 h-20' : 'w-20 h-24'} bg-white rounded-lg border-4 border-white shadow-md overflow-hidden`}>
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : currentProfileImage ? (
                        <img src={currentProfileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <cfg.icon className={`${isMobile ? 'text-2xl' : 'text-4xl'} text-gray-400`} />
                        </div>
                      )}
                    </div>
                    
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -right-2 -bottom-2 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-xs text-gray-700 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 focus:outline-none"
                      title="Change profile photo"
                    >
                      <FaPencilAlt className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Body Section */}
              <div className={`${isMobile ? 'pt-10 px-4 pb-4' : 'pt-12 px-6 pb-6'}`}>
                <div className="mb-4">
                  <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{user?.first_name} {user?.last_name}</h2>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <FaIdCard className="text-primary-600 text-xs" />
                    <div className="min-w-0">
                      <p className="text-[8px] text-gray-400 uppercase font-black">ID / CODE</p>
                      <p className="font-bold text-[11px] text-gray-900 truncate">{cfg.id || '—'}</p>
                    </div>
                  </div>
                  {user?.email && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <FaEnvelope className="text-primary-600 text-xs" />
                      <div className="min-w-0">
                        <p className="text-[8px] text-gray-400 uppercase font-black">Email Address</p>
                        <p className="font-bold text-[11px] text-gray-900 truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="w-full py-2 bg-[#002B5B] text-white rounded-lg text-[11px] font-bold hover:bg-[#2D54A8] disabled:bg-gray-300 transition-colors shadow-sm"
                  >
                    {uploading ? '...' : 'Update Photo'}
                  </button>
                  {currentProfileImage && (
                    <button
                      onClick={handleRemove}
                      disabled={uploading}
                      className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors"
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
            <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl shadow-sm border border-gray-100`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2`}>
                <FaSchool className="text-primary-600" size={isMobile ? 14 : 16} /> Academic Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {user?.class_code && (
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Class Section</p>
                    <p className="text-xs font-bold text-gray-900">{user.class_code}</p>
                  </div>
                )}
                {user?.std && (
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Standard</p>
                    <p className="text-xs font-bold text-gray-900">{user.std}</p>
                  </div>
                )}
                {user?.medium && (
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Medium</p>
                    <p className="text-xs font-bold text-gray-900">{user.medium}</p>
                  </div>
                )}
                {role === 'teacher' && user?.experience != null && (
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Experience</p>
                    <p className="text-xs font-bold text-gray-900">{user.experience} Years</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Results for Students */}
            {role === 'student' && (
              <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl shadow-sm border border-gray-100`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest flex items-center gap-2`}>
                    <FaUserGraduate className="text-primary-600" size={isMobile ? 14 : 16} /> Exam Results
                  </h3>
                  {!isMobile && <span className="text-[10px] text-gray-400">Showing recent exams</span>}
                </div>

                {loadingResults ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : examResults.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">No results found</p>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100">
                          <th className={`pb-2 ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black uppercase tracking-wider`}>Subject</th>
                          <th className={`pb-2 text-center ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black uppercase tracking-wider`}>Marks</th>
                          {!isMobile && <th className="pb-2 text-center text-[10px] font-black uppercase tracking-wider">Cut</th>}
                          <th className={`pb-2 text-right ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black uppercase tracking-wider`}>Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {examResults.map((res) => {
                          const marks = res.marks_obtained;
                          const total = res.total_marks;
                          const isPass = marks >= (res.exam_id?.passing_marks || (total * 0.35));
                          
                          return (
                            <tr key={res._id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2.5">
                                <p className="font-bold text-[11px] text-gray-900 leading-tight">{res.exam_id?.exam_name || 'Exam'}</p>
                                <p className="text-[9px] text-gray-400 uppercase">{res.subject_code}</p>
                              </td>
                              <td className="py-2.5 text-center">
                                <span className="font-bold text-[11px] text-gray-900">{marks}</span>
                                <span className="text-gray-400 text-[9px]">/{total}</span>
                              </td>
                              {!isMobile && (
                                <td className="py-2.5 text-center">
                                  <span className="text-red-500 font-medium">-{ (total - marks).toFixed(0) }</span>
                                </td>
                              )}
                              <td className="py-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
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