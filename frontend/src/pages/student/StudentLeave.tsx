import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { toast } from 'react-toastify';

const StudentLeave: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'Personal',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      if (user?.gr_number) {
        const r = await leaveAPI.getStudentLeaves({ gr_number: user.gr_number });
        setLeaves(r.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        student_id: user.id,
        gr_number: user.gr_number,
        student_name: `${user.first_name} ${user.last_name}`,
        class_code: user.class_code,
      };
      await leaveAPI.applyStudent(payload);
      toast.success('Leave applied successfully');
      setModal(false);
      fetchLeaves();
    } catch (e) {
      toast.error('Failed to apply leave');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
          <p className="text-sm text-gray-500">Apply for and track your leave requests</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">Apply Leave</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No leave applications found</td></tr>
              ) : leaves.map(l => (
                <tr key={l._id} className="border-t border-gray-50">
                  <td className="px-5 py-3">{l.leave_type}</td>
                  <td className="px-5 py-3">{new Date(l.from_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{new Date(l.to_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{l.reason}</td>
                  <td className="px-5 py-3"><Badge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select className="input-field" value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}>
                  <option>Sick</option>
                  <option>Personal</option>
                  <option>Family</option>
                  <option>Emergency</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input type="date" required className="input-field" value={form.from_date} onChange={e => setForm({...form, from_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input type="date" required className="input-field" value={form.to_date} onChange={e => setForm({...form, to_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea required className="input-field" rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Submit Application</button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeave;
