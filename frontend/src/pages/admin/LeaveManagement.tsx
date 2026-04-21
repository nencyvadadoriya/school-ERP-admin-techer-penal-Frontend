import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { leaveAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { ClipboardList, CheckCircle, XCircle, Clock, Users, BookOpen, UserCheck } from 'lucide-react';

const themeConfig = {
  primary: '#002B5B',
  secondary: '#2D54A8',
  accent: '#1F2937',
  success: '#10B981',
  warning: '#1F2937',
  danger: '#EF4444',
  info: '#3b82f6',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const LeaveManagement: React.FC = () => {
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<string>('student');
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetch = async () => {
    try {
      const [sR, tR] = await Promise.all([leaveAPI.getStudentLeaves(), leaveAPI.getTeacherLeaves()]);
      setStudentLeaves(sR.data.data || []); setTeacherLeaves(tR.data.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const updateStudent = async (id: string, status: string, reason?: string) => {
    try { await leaveAPI.updateStudentLeave(id, { status, rejection_reason: reason, approved_by: 'Admin' }); toast.success(`Leave ${status}`); fetch(); setShowRejectModal(false); setRejectionReason(''); } catch { toast.error('Error'); }
  };
  const updateTeacher = async (id: string, status: string, reason?: string) => {
    try { await leaveAPI.updateTeacherLeave(id, { status, rejection_reason: reason, approved_by: 'Admin' }); toast.success(`Leave ${status}`); fetch(); setShowRejectModal(false); setRejectionReason(''); } catch { toast.error('Error'); }
  };

  if (loading) return <Spinner />;

  const leaves = tab === 'student' ? studentLeaves : teacherLeaves;
  const pendingStudents = studentLeaves.filter(l => l.status === 'Pending').length;
  const pendingTeachers = teacherLeaves.filter(l => l.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length;
  const pending = leaves.filter(l => l.status === 'Pending').length;

  const handleRejectClick = (leave: any) => { setSelectedLeave(leave); setShowRejectModal(true); };
  const confirmReject = () => {
    if (!rejectionReason.trim()) { toast.error('Please enter a reason'); return; }
    tab === 'student' ? updateStudent(selectedLeave._id, 'Rejected', rejectionReason) : updateTeacher(selectedLeave._id, 'Rejected', rejectionReason);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                <ClipboardList size={24} className="text-gray-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Leave Management</h1>
                <p className="text-sm text-gray-500 font-medium">Approve or reject leave applications</p>
              </div>
            </div>
          </div>
        )}

        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Leave Management</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">Administrative Hub</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                <ClipboardList size={18} />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={`grid grid-cols-3 gap-3 ${isMobile ? 'mb-4 px-4' : 'mb-6'}`}>
          {[
            { label: 'Pending', value: String(pending), color: '#6B7280', bg: 'bg-gray-100', Icon: Clock },
            { label: 'Approved', value: String(approved), color: '#10B981', bg: 'bg-emerald-50', Icon: CheckCircle },
            { label: 'Rejected', value: String(rejected), color: '#EF4444', bg: 'bg-red-50', Icon: XCircle },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.Icon size={14} style={{ color: s.color }} />
                </div>
                <span className="text-xs font-black" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className={`bg-white rounded-xl shadow-sm p-1.5 ${isMobile ? 'mb-3' : 'mb-5'}`} style={{ display: 'inline-flex', width: '100%' }}>
          <button onClick={() => setTab('student')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${tab === 'student' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={{ backgroundColor: tab === 'student' ? themeConfig.primary : 'transparent' }}>
            <Users size={14} />
            <span>Students {pendingStudents > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-white rounded-full text-[10px]">{pendingStudents}</span>}</span>
          </button>
          <button onClick={() => setTab('teacher')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${tab === 'teacher' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={{ backgroundColor: tab === 'teacher' ? themeConfig.primary : 'transparent' }}>
            <UserCheck size={14} />
            <span>Teachers {pendingTeachers > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-white rounded-full text-[10px]">{pendingTeachers}</span>}</span>
          </button>
        </div>

        {/* Content */}
        {isMobile ? (
          <div className="space-y-2.5 pb-6">
            {leaves.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center">
                <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No leave applications</p>
              </div>
            ) : leaves.map(l => (
              <div key={l._id} className="bg-white rounded-xl shadow-sm p-3.5 border border-transparent">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{l.student_name || l.teacher_name || l.gr_number}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{l.leave_type}</p>
                  </div>
                  <Badge status={l.status} />
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{l.reason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{new Date(l.from_date).toLocaleDateString()} – {new Date(l.to_date).toLocaleDateString()}</span>
                  {l.status === 'Pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => tab === 'student' ? updateStudent(l._id, 'Approved') : updateTeacher(l._id, 'Approved')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
                      <button onClick={() => handleRejectClick(l)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {leaves.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No leave applications</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: `${themeConfig.primary}08` }}>
                      {[tab === 'student' ? 'Student' : 'Teacher', 'Leave Type', 'From', 'To', 'Reason', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaves.map(l => (
                      <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{l.student_name || l.teacher_name || l.gr_number}</td>
                        <td className="px-5 py-3.5 text-gray-600">{l.leave_type}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(l.from_date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(l.to_date).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="text-xs text-gray-500 truncate">{l.reason}</p>
                          {l.status === 'Rejected' && l.rejection_reason && <p className="text-[10px] text-red-400 italic mt-0.5">Reason: {l.rejection_reason}</p>}
                        </td>
                        <td className="px-5 py-3.5"><Badge status={l.status} /></td>
                        <td className="px-5 py-3.5">
                          {l.status === 'Pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => tab === 'student' ? updateStudent(l._id, 'Approved') : updateTeacher(l._id, 'Approved')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">Approve</button>
                              <button onClick={() => handleRejectClick(l)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Reject</button>
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-red-50"><XCircle size={18} className="text-red-500" /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reject Leave</h3>
                <p className="text-xs text-gray-400">Provide reason for rejection</p>
              </div>
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 min-h-[100px] resize-none transition-all"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmReject} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95" style={{ backgroundColor: '#EF4444' }}>Reject Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
