import React, { useEffect, useState } from 'react';
import { dashboardAPI, leaveAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Skeleton, { ListSkeleton, TableSkeleton, CardSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FileText, RefreshCcw, ChevronDown, CheckCircle2, 
  XCircle, Clock, Calendar, User, Info
} from 'lucide-react';

// Normalize class code: "STD-1-A-English-Primary-Morning" -> "1aenglish"
const normalizeCode = (s: string) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const StudentLeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [displayedLeaves, setDisplayedLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [myClasses, setMyClasses] = useState<string[]>([]); // resolved DB class_codes
  const [tabClass, setTabClass] = useState<string>('');

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  // Get assigned class codes strictly from teacher dashboard API
  const fetchAssignedClassCodes = async (): Promise<string[]> => {
    try {
      const r = await dashboardAPI.teacher();
      const cls = r.data.data?.myClasses || [];
      const codes = (Array.isArray(cls) ? cls : []).map((c: any) => c?.class_code).filter(Boolean);
      return [...new Set(codes)];
    } catch (e) {
      console.error('Failed to load teacher classes:', e);
      return [];
    }
  };

  const fetchLeaves = async (resolvedCodes: string[]) => {
    try {
      const r = await leaveAPI.getStudentLeaves();
      const all: any[] = r.data.data || [];
      setAllLeaves(all);

      if (resolvedCodes.length === 0) {
        setDisplayedLeaves([]);
        return;
      }

      // Match using both exact and normalized comparison
      const resolvedNorm = resolvedCodes.map(normalizeCode);
      const filtered = all.filter((l: any) =>
        resolvedCodes.includes(l.class_code) ||
        resolvedNorm.includes(normalizeCode(l.class_code))
      );
      setDisplayedLeaves(filtered);
    } catch (e) {
      console.error('Error fetching leaves:', e);
      setDisplayedLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    const codes = await fetchAssignedClassCodes();
    setMyClasses(codes);
    await fetchLeaves(codes);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Re-filter when tab changes
  useEffect(() => {
    if (tabClass) {
      setDisplayedLeaves(allLeaves.filter((l: any) =>
        l.class_code === tabClass || normalizeCode(l.class_code) === normalizeCode(tabClass)
      ));
    } else {
      const resolvedNorm = myClasses.map(normalizeCode);
      const filtered = allLeaves.filter((l: any) =>
        myClasses.includes(l.class_code) ||
        resolvedNorm.includes(normalizeCode(l.class_code))
      );
      setDisplayedLeaves(filtered);
    }
  }, [tabClass, allLeaves, myClasses]);

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
    setActionLoading(id + status);
    try {
      await leaveAPI.updateStudentLeave(id, {
        status,
        rejection_reason: reason,
        approved_by: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher',
      });
      toast.success(`Leave ${status} successfully`);
      // Instant UI update without full re-fetch
      setAllLeaves(prev => prev.map(l => l._id === id ? { ...l, status, rejection_reason: reason } : l));
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error updating leave';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (leave: any) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    handleAction(selectedLeave._id, 'Rejected', rejectionReason);
  };

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <div className="md:hidden">
        <CardSkeleton />
      </div>
      <div className="hidden md:block">
        <TableSkeleton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-16 rounded-b-[32px] relative overflow-visible mb-0">
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-black tracking-tight">Leave Requests</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Review Student Leaves</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

        {/* Dropdown Integrated in Header for Mobile - Positioned to overlay the curve */}
        <div className="absolute -bottom-6 left-0 right-0 px-4 flex justify-center z-50">
          <div className="w-full relative">
            <select
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-100 shadow-xl text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer"
              value={tabClass}
              onChange={e => setTabClass(e.target.value)}
            >
              <option value="">All assigned classes</option>
              {myClasses.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-12 md:mt-8 space-y-4 relative z-20">
        {/* Actions Card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-black text-gray-900">Student Leave Approvals</h1>
            <p className="text-sm font-medium text-gray-500">Review and manage leave applications from your students</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <select
                className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
                value={tabClass}
                onChange={e => setTabClass(e.target.value)}
              >
                <option value="">All assigned classes</option>
                {myClasses.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Leaves Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Student Information</th>
                  <th className="px-6 py-4 text-center">Class</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No requests found</p>
                    </td>
                  </tr>
                ) : (
                  displayedLeaves.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                            {l.student_name ? l.student_name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-[#002B5B] transition-colors leading-tight">{l.student_name || 'N/A'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">GR: {l.gr_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-[#002B5B] bg-[#002B5B]/5 px-2.5 py-1 rounded-lg uppercase tracking-wider">{l.class_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5"><Calendar size={10} className="text-gray-400" /> {new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter ml-4">to {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-3">{l.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge status={l.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {l.status === 'Pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleAction(l._id, 'Approved')} disabled={!!actionLoading} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"><CheckCircle2 size={16} /></button>
                              <button onClick={() => handleRejectClick(l)} disabled={!!actionLoading} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"><XCircle size={16} /></button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Approved by:</span>
                              <span className="text-[10px] font-bold text-gray-700">{l.approved_by || '—'}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-50">
            {displayedLeaves.length === 0 ? (
              <div className="py-20 text-center">
                <FileText size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No requests found</p>
              </div>
            ) : (
              displayedLeaves.map(l => (
                <div key={l._id} className="p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                        {l.student_name ? l.student_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-900 leading-tight">{l.student_name || 'N/A'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">GR: {l.gr_number || 'N/A'}</span>
                          <span className="text-[8px] font-black text-[#002B5B] bg-[#002B5B]/5 px-1.5 py-0.5 rounded-lg">{l.class_code}</span>
                        </div>
                      </div>
                    </div>
                    <div className="scale-[0.6] origin-top-right">
                      <Badge status={l.status} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Calendar size={8} /> Duration</p>
                      <p className="text-[9px] font-black text-gray-900 leading-tight">
                        {new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Reason</p>
                      <p className="text-[9px] font-medium text-gray-600 line-clamp-1 italic">{l.reason}</p>
                    </div>
                  </div>

                  {l.status === 'Pending' ? (
                    <div className="flex gap-2 pt-0.5">
                      <button 
                        onClick={() => handleAction(l._id, 'Approved')}
                        disabled={!!actionLoading}
                        className="flex-1 py-1.5 bg-[#002B5B] text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectClick(l)}
                        disabled={!!actionLoading}
                        className="flex-1 py-1.5 bg-rose-500 text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-lg shadow-rose-500/10 active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={8} className="text-gray-400" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">By: {l.approved_by || '—'}</span>
                      </div>
                      {l.status === 'Rejected' && l.rejection_reason && (
                        <span className="text-[8px] text-rose-500 font-bold italic truncate max-w-[120px]">Reason: {l.rejection_reason}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-1">Reject Request</h3>
            <p className="text-xs font-medium text-gray-500 mb-4 leading-relaxed">Provide a reason for rejection.</p>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-red-500/10 outline-none min-h-[100px] transition-all resize-none"
              placeholder="Reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 text-xs font-black text-gray-500 hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="flex-1 py-2.5 text-xs font-black bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeaveApprovals;