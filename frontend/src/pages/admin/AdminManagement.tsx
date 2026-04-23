import React, { useState, useEffect } from 'react';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserPlus, FaUserShield, FaShieldAlt, FaPhone, FaEnvelope, FaCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { Shield, UserCheck } from 'lucide-react';

const AdminManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageAdmins = user?.role === 'admin';
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [isSubAdminForm, setIsSubAdminForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('list');

  useEffect(() => {
    fetchAdmins();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const fetchAdmins = async () => {
    try {
      const res = await adminAPI.getAll();
      setAdmins(res.data.data || []);
    } catch (err) {
      toast.error('Error fetching admins');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageAdmins) {
      toast.error('Access denied');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await adminAPI.delete(id);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (err) {
      toast.error('Error deleting admin');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openAddForm = () => {
    setSelectedAdmin(null);
    setIsSubAdminForm(false);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      pin: '',
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const openAddSubAdminForm = () => {
    setSelectedAdmin(null);
    setIsSubAdminForm(true);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      pin: '',
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const openEditForm = (admin: any) => {
    if (!canManageAdmins) {
      toast.error('Access denied');
      return;
    }
    setSelectedAdmin(admin);
    setFormData({
      first_name: admin.first_name || '',
      last_name: admin.last_name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      password: '', // Password not editable here
      pin: admin.pin || '',
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedAdmin && !canManageAdmins) {
        toast.error('Access denied');
        return;
      }
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'password' && selectedAdmin) return; // Don't send empty password on update
        if (key === 'pin' && isSubAdminForm) return; // Don't send PIN for sub-admin
        data.append(key, formData[key as keyof typeof formData]);
      });

      if (isSubAdminForm) {
        data.append('role', 'sub_admin');
      }

      if (selectedFile) {
        data.append('profile_image', selectedFile);
      }

      if (selectedAdmin) {
        await adminAPI.update(selectedAdmin._id, data);
        toast.success('Admin updated successfully');
      } else {
        await adminAPI.register(data);
        toast.success('Admin registered successfully');
      }
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error saving admin';
      toast.error(message);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    accent: '#FFC107',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    indigo: '#6366F1'
  };

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  if (isMobile) {
    const renderMobileContent = () => {
      switch (activeMobileTab) {
        case 'add':
          return (
            <div className="p-3 space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaUserShield size={32} style={{ color: theme.primary }} />
                </div>
                <h2 className="text-xl font-black mb-2" style={{ color: theme.primary }}>Add New Admin</h2>
                <p className="text-sm text-gray-500 mb-6">Create a new administrative or sub-administrative account</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={openAddForm}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                        <FaUserPlus size={20} style={{ color: theme.primary }} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Main Admin</p>
                        <p className="text-xs text-gray-500">Full system access</p>
                      </div>
                    </div>
                    <FaPlus className="text-gray-300" />
                  </button>

                  <button 
                    onClick={openAddSubAdminForm}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                        <FaShieldAlt size={20} style={{ color: theme.indigo }} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Sub-Admin</p>
                        <p className="text-xs text-gray-500">Limited access roles</p>
                      </div>
                    </div>
                    <FaPlus className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          );
        case 'list':
        default:
          return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <div className="bg-[#002B5B] p-4 flex items-center justify-between sticky top-0 z-40">
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Management</h2>
                  <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest">Manage Staff & Roles</p>
                </div>
              </div>

              <div className="p-4 space-y-3 pb-24">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    title="Total Admins"
                    value={admins.length}
                    icon={UserCheck}
                    iconColor={theme.primary}
                    iconBg="rgba(0, 43, 91, 0.08)"
                    subtitle="All staff"
                  />
                  <StatCard
                    title="Active Now"
                    value={admins.filter(a => a.is_active).length}
                    icon={Shield}
                    iconColor={theme.secondary}
                    iconBg="rgba(45, 84, 168, 0.1)"
                    subtitle="Currently active"
                  />
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={openAddForm}
                    className="h-7 px-1.5 rounded-lg flex items-center justify-center gap-1 text-white active:scale-95 transition-all shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                  >
                    <FaUserPlus size={11} />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Add Admin</span>
                  </button>
                  <button
                    onClick={openAddSubAdminForm}
                    className="h-7 px-1.5 rounded-lg flex items-center justify-center gap-1 text-white active:scale-95 transition-all shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})` }}
                  >
                    <FaShieldAlt size={11} />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Sub Admin</span>
                  </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-2 border border-gray-100">
                  <div className="relative group">
                    <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px]" />
                    <input
                      type="text"
                      placeholder="Search admins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] focus:outline-none focus:ring-1 transition-all"
                    />
                  </div>
                </div>

                {/* Admin Cards */}
                <div className="space-y-2.5">
                  {filteredAdmins.map((admin) => (
                    <div key={admin._id} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {admin.profile_image ? (
                              <img className="h-8 w-8 rounded-lg object-cover shadow-sm" src={admin.profile_image} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                                {admin.first_name[0]}{admin.last_name[0]}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: admin.is_active ? theme.success : theme.danger }}>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-gray-900 leading-tight">{admin.first_name} {admin.last_name}</h4>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{admin.role || 'Admin'}</p>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${admin.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1.5 text-[8px] text-gray-600 bg-gray-50 p-1 rounded-lg border border-gray-50">
                          <FaEnvelope className="text-gray-400" size={8} />
                          <span className="truncate">{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-1.5 text-[8px] text-gray-600 bg-gray-50 p-1 rounded-lg border border-gray-50">
                            <FaPhone className="text-gray-400" size={8} />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-gray-50">
                        <button onClick={() => openEditForm(admin)} className="flex-1 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                          <FaEdit size={9}/> Edit
                        </button>
                        <button onClick={() => handleDelete(admin._id)} className="w-8 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center justify-center active:scale-95 transition-all">
                          <FaTrash size={9}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                      <FaSearch size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium">No admins found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="min-h-screen bg-[#F0F2F5] pb-6">
        <div className="p-0">
          {renderMobileContent()}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div className="bg-white rounded-t-3xl w-full p-4 shadow-2xl overflow-y-auto max-h-[85vh] border-t border-gray-100 animate-in slide-in-from-bottom duration-300">
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold" style={{ color: theme.primary }}>
                    {selectedAdmin ? 'Edit Admin' : isSubAdminForm ? 'Add Sub-Admin' : 'Add Admin'}
                  </h2>
                </div>
                <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors text-lg">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 ml-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 ml-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 ml-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 ml-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {!selectedAdmin && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500 ml-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all"
                        style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                      />
                    </div>
                  )}
                  {!isSubAdminForm && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500 ml-1">PIN (4 digits)</label>
                      <input
                        type="text"
                        name="pin"
                        maxLength={4}
                        value={formData.pin}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 transition-all text-center font-bold tracking-widest"
                        style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 ml-1">Profile Photo</label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all active:scale-95 hover:brightness-110"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {selectedAdmin ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 min-h-screen custom-scrollbar overflow-y-auto" style={{ backgroundColor: theme.background }}>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.primary}20;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.primary}40;
          }
        `}
      </style>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: theme.primary }}>Admin Management</h1>
            <p className="text-[10px] sm:text-xs font-medium" style={{ color: theme.textSecondary }}>Manage access and roles</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={openAddForm} 
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[10px] sm:text-xs font-bold shadow-sm transition-all active:scale-95 hover:brightness-110"
            style={{ backgroundColor: theme.primary }}
          >
            <FaUserPlus size={12} />
            <span>Add Admin</span>
          </button>
          <button 
            onClick={openAddSubAdminForm} 
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[10px] sm:text-xs font-bold shadow-sm transition-all active:scale-95 hover:brightness-110"
            style={{ backgroundColor: theme.secondary }}
          >
            <FaShieldAlt size={12} />
            <span>Add Sub-Admin</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-1 lg:col-span-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="relative group max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px]" />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] focus:outline-none focus:ring-1 transition-all"
              style={{ '--tw-ring-color': `${theme.primary}20` } as any}
            />
          </div>
        </div>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <FaUserShield size={12} style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400 leading-none">Total Admins</p>
              <h3 className="text-sm font-black mt-0.5" style={{ color: theme.primary }}>{admins.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.secondary}15` }}>
              <FaShieldAlt size={12} style={{ color: theme.secondary }} />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400 leading-none">Active Now</p>
              <h3 className="text-sm font-black mt-0.5" style={{ color: theme.secondary }}>{admins.filter(a => a.is_active).length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Admin Profile</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Role & Status</th>
                {canManageAdmins && (
                  <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {admin.profile_image ? (
                          <img className="h-8 w-8 rounded-lg object-cover ring-1 ring-gray-100" src={admin.profile_image} alt="" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ring-1 ring-gray-100" 
                            style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
                            {admin.first_name[0]}{admin.last_name[0]}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white"
                          style={{ backgroundColor: admin.is_active ? theme.success : theme.danger }}>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {admin.first_name} {admin.last_name}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                          ID: {admin._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                        <FaEnvelope className="text-gray-400" size={10} />
                        {admin.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                        <FaPhone className="text-gray-400" size={10} />
                        {admin.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest w-fit ${
                      admin.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-blue-50/50 text-blue-400'
                    }`}>
                      {admin.role || 'Admin'}
                    </span>
                  </td>
                  {canManageAdmins && (
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => openEditForm(admin)} 
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm"
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(admin._id)} 
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAdmins.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex p-6 rounded-full bg-gray-50 mb-4">
              <FaSearch size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No admins found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-lg p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.primary }}>
                  {selectedAdmin ? 'Edit Admin' : isSubAdminForm ? 'Add Sub-Admin' : 'Add Admin'}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors text-xl">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!selectedAdmin && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                )}
                {!isSubAdminForm && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">PIN (4 digits)</label>
                    <input
                      type="text"
                      name="pin"
                      maxLength={4}
                      value={formData.pin}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-center font-bold tracking-widest"
                      style={{ '--tw-ring-color': `${theme.primary}20` } as any}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1">Profile Photo</label>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: theme.primary }}
                >
                  {selectedAdmin ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
