import React, { useEffect, useState } from 'react';
import { dashboardAPI, leaveAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaFileAlt } from 'react-icons/fa';

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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      <p className="text-sm font-bold text-gray-500 animate-pulse">Loading student leave requests...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Student Leave Approvals</h1>
          <p className="text-[10px] font-medium text-gray-500">Review and manage leave applications from your students</p>
        </div>
        <button onClick={loadAll} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold border border-gray-200 transition-all active:scale-95 hover:bg-gray-100 text-[11px]">
          Refresh List
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter by Class</label>
            <select
              className="w-full sm:w-56 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
              value={tabClass}
              onChange={e => setTabClass(e.target.value)}
            >
              <option value="">All assigned classes</option>
              {myClasses.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span>{displayedLeaves.length} Requests</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">Student Information</th>
                <th className="px-5 py-3 text-center">Class</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {displayedLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No requests pending</p>
                  </td>
                </tr>
              ) : (
                displayedLeaves.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                          {l.student_name ? l.student_name.charAt(0) : 'S'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{l.student_name || 'N/A'}</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">GR: {l.gr_number || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{l.class_code}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 uppercase">{new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">to {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 max-w-[180px]">
                      <p className="font-medium text-gray-600 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-2" title={l.reason}>{l.reason}</p>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <Badge status={l.status} />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex justify-end">
                        {l.status === 'Pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAction(l._id, 'Approved')}
                              disabled={!!actionLoading}
                              className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-green-100 transition-colors disabled:opacity-50 border border-green-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(l)}
                              disabled={!!actionLoading}
                              className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                              {l.approved_by ? `By: ${l.approved_by}` : '—'}
                            </span>
                            {l.status === 'Rejected' && l.rejection_reason && (
                              <span className="text-[9px] text-red-500 font-bold italic max-w-[120px] truncate">
                                {l.rejection_reason}
                              </span>
                            )}
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