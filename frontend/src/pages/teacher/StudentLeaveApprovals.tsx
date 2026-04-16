import React, { useEffect, useState } from 'react';
import { dashboardAPI, leaveAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Leaves (My Classes)</h1>
        <p className="text-sm text-gray-500">
          Approve / reject leave applications for students in your assigned classes
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="mb-3 flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Filter by Class</label>
            <select
              className="input-field w-64"
              value={tabClass}
              onChange={e => setTabClass(e.target.value)}
            >
              <option value="">All assigned classes</option>
              {myClasses.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button onClick={loadAll} className="btn-secondary mb-0.5">Refresh</button>
          {myClasses.length === 0 && (
            <p className="text-sm text-red-500">No classes assigned to you. Contact admin.</p>
          )}
        </div>

        <div className="text-xs text-gray-400 mb-2">
          {displayedLeaves.length} leave application{displayedLeaves.length !== 1 ? 's' : ''} found
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    {myClasses.length === 0
                      ? 'No classes assigned. Please ask admin to assign you a class.'
                      : 'No leave applications found for your classes.'}
                  </td>
                </tr>
              ) : (
                displayedLeaves.map(l => (
                  <tr key={l._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{l.student_name || l.gr_number}</td>
                    <td className="px-5 py-3">{l.class_code}</td>
                    <td className="px-5 py-3">{new Date(l.from_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3">{new Date(l.to_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                    <td className="px-5 py-3"><Badge status={l.status} /></td>
                    <td className="px-5 py-3">
                      {l.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(l._id, 'Approved')}
                            disabled={!!actionLoading}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading === l._id + 'Approved' ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectClick(l)}
                            disabled={!!actionLoading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            {actionLoading === l._id + 'Rejected' ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-xs">
                            {l.approved_by ? `By: ${l.approved_by}` : '—'}
                          </span>
                          {l.status === 'Rejected' && l.rejection_reason && (
                            <span className="text-[10px] text-red-500 italic max-w-[150px] break-words">
                              Reason: {l.rejection_reason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Leave Application</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this leave request. This will be visible to the student.</p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeaveApprovals;