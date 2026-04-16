import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { leaveAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

const LeaveManagement: React.FC = () => {
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<string>('student');

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetch = async () => {
    try {
      const [sR, tR] = await Promise.all([leaveAPI.getStudentLeaves(), leaveAPI.getTeacherLeaves()]);
      setStudentLeaves(sR.data.data || []);
      setTeacherLeaves(tR.data.data || []);
    } catch (e) { } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const updateStudent = async (id: string, status: string, reason?: string) => {
    try {
      await leaveAPI.updateStudentLeave(id, { status, rejection_reason: reason, approved_by: 'Admin' });
      toast.success(`Leave ${status}`);
      fetch();
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (e) { toast.error('Error'); }
  };

  const updateTeacher = async (id: string, status: string, reason?: string) => {
    try {
      await leaveAPI.updateTeacherLeave(id, { status, rejection_reason: reason, approved_by: 'Admin' });
      toast.success(`Leave ${status}`);
      fetch();
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (e) { toast.error('Error'); }
  };

  if (loading) return <Spinner />;

  const leaves = tab === 'student' ? studentLeaves : teacherLeaves;

  const handleRejectClick = (leave: any) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    if (tab === 'student') {
      updateStudent(selectedLeave._id, 'Rejected', rejectionReason);
    } else {
      updateTeacher(selectedLeave._id, 'Rejected', rejectionReason);
    }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Leave Management</h1><p className="text-sm text-gray-500">Approve / reject leave applications</p></div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('student')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'student' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Students ({studentLeaves.filter(l => l.status === 'Pending').length} pending)</button>
        <button onClick={() => setTab('teacher')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'teacher' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Teachers ({teacherLeaves.filter(l => l.status === 'Pending').length} pending)</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr className="text-left text-gray-500">
            <th className="px-5 py-3 font-medium">{tab === 'student' ? 'Student' : 'Teacher'}</th>
            <th className="px-5 py-3 font-medium">Leave Type</th>
            <th className="px-5 py-3 font-medium">From</th>
            <th className="px-5 py-3 font-medium">To</th>
            <th className="px-5 py-3 font-medium">Reason</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>{leaves.length === 0
            ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">No leave applications</td></tr>
            : leaves.map(l => (
              <tr key={l._id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{l.student_name || l.teacher_name || (tab === 'student' ? l.gr_number : l.teacher_code)}</td>
                <td className="px-5 py-3">{l.leave_type}</td>
                <td className="px-5 py-3">{new Date(l.from_date).toLocaleDateString()}</td>
                <td className="px-5 py-3">{new Date(l.to_date).toLocaleDateString()}</td>
                <td className="px-5 py-3 max-w-xs truncate">{l.reason}</td>
                <td className="px-5 py-3"><Badge status={l.status} /></td>
                <td className="px-5 py-3">
                  {l.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => (tab === 'student' ? updateStudent(l._id, 'Approved') : updateTeacher(l._id, 'Approved'))} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">Approve</button>
                      <button onClick={() => handleRejectClick(l)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">Reject</button>
                    </div>
                  )}
                  {l.status === 'Rejected' && l.rejection_reason && (
                    <div className="text-[10px] text-red-500 mt-1 max-w-[150px] italic">
                      Reason: {l.rejection_reason}
                    </div>
                  )}
                  {l.status !== 'Pending' && !l.rejection_reason && <span className="text-gray-400 text-xs">—</span>}
                </td>
              </tr>))
          }</tbody>
        </table>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Leave Application</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this leave request. This will be visible to the applicant.</p>
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

export default LeaveManagement;
