import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaRupeeSign, FaEye, FaCog, FaUnlock, FaHistory, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { auditAPI, classAPI, feesAPI, feesPageSecurityAPI, studentAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';

const EMPTY = { student_id: '', gr_number: '', std: '', division: '', class_code: '', shift: '', medium: '', stream: '', fee_type: 'Tuition', total_amount: '', amount_paid: '0', due_date: '', payment_mode: 'Cash', academic_year: '2024-25', installment_number: 1, status: 'Pending', remarks: '' };

const Fees: React.FC = () => {
  const [gateLoading, setGateLoading] = useState<boolean>(true);
  const [gateToken, setGateToken] = useState<string>(sessionStorage.getItem('fees_gate_token') || '');
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);
  const [gatePassword, setGatePassword] = useState<string>('');
  const [setPassword, setSetPassword] = useState<string>('');
  const [changeCurrentPassword, setChangeCurrentPassword] = useState<string>('');
  const [changeNewPassword, setChangeNewPassword] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsModal, setSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'change' | 'reset'>('change');

  const [activeGateTabLocal, setActiveGateTabLocal] = useState<'verify' | 'set'>('verify');

  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalAmount: 0, pendingAmount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState<string>('');

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<any[]>([]);
  const [studentHistoryModal, setStudentHistoryModal] = useState<boolean>(false);
  const [studentHistoryLoading, setStudentHistoryLoading] = useState<boolean>(false);

  const fetchAll = async () => {
    try {
      const [feesR, studentsR, summaryR, classesR] = await Promise.all([
        feesAPI.getAll(),
        studentAPI.getAll(),
        feesAPI.getSummary(),
        classAPI.getAll(),
      ]);
      setFees(feesR.data.data || []);
      setStudents(studentsR.data.data || []);
      setSummary(summaryR.data.data || {});
      setClasses(classesR.data.data || []);
    } catch (e) { } finally { setLoading(false); }
  };

  const stdOptions = Array.from(new Set((classes || []).map((c: any) => c.standard).filter(Boolean))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const divisionOptions = Array.from(new Set((classes || []).filter((c: any) => !form.std || c.standard === form.std).map((c: any) => c.division).filter(Boolean))).sort();
  const classCodeOptions = (classes || []).filter((c: any) => (!form.std || c.standard === form.std) && (!form.division || c.division === form.division)).map((c: any) => c.class_code).filter(Boolean);

  const loadGateStatus = async () => {
    try {
      const r = await feesPageSecurityAPI.status();
      setIsPasswordSet(!!r.data?.data?.isPasswordSet);
      setActiveGateTabLocal(r.data?.data?.isPasswordSet ? 'verify' : 'set');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load fees page security status');
    } finally {
      setGateLoading(false);
    }
  };

  useEffect(() => {
    loadGateStatus();
  }, []);

  useEffect(() => {
    if (gateToken) {
      setLoading(true);
      fetchAll();
      // Record page access
      auditAPI.recordFeesPageView();
    }
  }, [gateToken]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const r = await auditAPI.getFees({ limit: 100 });
      // Filter for fee-related actions
      const entries = (r.data?.data || []).filter((h: any) =>
        h.action.startsWith('FEES_') ||
        h.action === 'Create Fee' ||
        h.action === 'Update Fee'
      );
      setHistory(entries);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getFullName = (student: any) => {
    const firstName = student?.first_name || '';
    const middleName = student?.middle_name ? ` ${student.middle_name}` : '';
    const lastName = student?.last_name ? ` ${student.last_name}` : '';
    return `${firstName}${middleName}${lastName}`.trim();
  };

  const filteredStudents = students.filter((s: any) => {
    const matchStd = !form.std || s.std === form.std;
    const matchDivision = !form.division || s.division === form.division;
    const matchClassCode = !form.class_code || s.class_code === form.class_code;
    return matchStd && matchDivision && matchClassCode;
  }).sort((a, b) => getFullName(a).localeCompare(getFullName(b)));

  const fetchStudentHistory = async (studentId: string) => {
    try {
      setStudentHistoryLoading(true);
      setStudentHistoryModal(true);
      const r = await auditAPI.getFees({ student_id: studentId, limit: 100 });
      // Filter for fee-related actions
      const entries = (r.data?.data || []).filter((h: any) =>
        h.action === 'FEES_RECORD_CREATE' ||
        h.action === 'FEES_RECORD_UPDATE' ||
        h.action === 'Create Fee' ||
        h.action === 'Update Fee'
      );
      setSelectedStudentHistory(entries);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load student history');
    } finally {
      setStudentHistoryLoading(false);
    }
  };

  const handleVerifyGate = async (e: any) => {
    e.preventDefault();
    try {
      const r = await feesPageSecurityAPI.verify({ password: gatePassword });
      const token = r.data?.data?.gateToken;
      sessionStorage.setItem('fees_gate_token', token);
      setGateToken(token);
      setGatePassword(''); // Clear password after successful verification
      toast.success('Access granted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    }
  };

  const handleSetPassword = async (e: any) => {
    e.preventDefault();
    try {
      await feesPageSecurityAPI.setPassword({ password: setPassword });
      toast.success('Fees page password set');
      setActiveGateTabLocal('verify');
      setSettingsModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set password');
    }
  };

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    try {
      await feesPageSecurityAPI.changePassword({ currentPassword: changeCurrentPassword, newPassword: changeNewPassword });
      toast.success('Fees page password changed');
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      sessionStorage.removeItem('fees_gate_token');
      setGateToken('');
      setActiveGateTabLocal('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleRequestReset = async (e: any) => {
    e.preventDefault();
    try {
      await feesPageSecurityAPI.requestReset({ email: resetEmail });
      toast.success('Reset code sent to email');
      setResetSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    }
  };

  const handleConfirmReset = async (e: any) => {
    e.preventDefault();
    try {
      await feesPageSecurityAPI.confirmReset({ email: resetEmail, code: resetCode, newPassword: resetNewPassword });
      toast.success('Fees page password reset');
      setResetCode('');
      setResetNewPassword('');
      setResetSent(false);
      sessionStorage.removeItem('fees_gate_token');
      setGateToken('');
      setActiveGateTabLocal('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleStudentChange = (e: any) => {
    const student = students.find(s => s._id === e.target.value);
    setForm({
      ...form,
      student_id: e.target.value,
      gr_number: student?.gr_number || '',
      std: student?.std || '',
      division: student?.division || '',
      class_code: student?.class_code || '',
      shift: student?.shift || '',
      medium: student?.medium || '',
      stream: student?.stream || '',
    });
  };

  const handleStdChange = (e: any) => {
    const std = e.target.value;
    const divs = Array.from(new Set((classes || []).filter((c: any) => c.standard === std).map((c: any) => c.division).filter(Boolean))).sort();
    const division = divs.includes(form.division) ? form.division : (divs[0] || '');
    const codes = (classes || []).filter((c: any) => c.standard === std && (!division || c.division === division)).map((c: any) => c.class_code).filter(Boolean);
    const class_code = codes.includes(form.class_code) ? form.class_code : (codes[0] || '');
    setForm({ ...form, std, division, class_code });
  };

  const handleDivisionChange = (e: any) => {
    const division = e.target.value;
    const codes = (classes || []).filter((c: any) => (!form.std || c.standard === form.std) && c.division === division).map((c: any) => c.class_code).filter(Boolean);
    const class_code = codes.includes(form.class_code) ? form.class_code : (codes[0] || '');
    setForm({ ...form, division, class_code });
  };

  const handleClassCodeChange = (e: any) => {
    const class_code = e.target.value;
    const cls = (classes || []).find((c: any) => c.class_code === class_code);
    setForm({
      ...form,
      class_code,
      std: cls?.standard || form.std,
      division: cls?.division || form.division,
      shift: cls?.shift || form.shift,
      medium: cls?.medium || form.medium,
      stream: cls?.stream || form.stream,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const student = students.find(s => s._id === form.student_id);
      const student_name = student ? getFullName(student) : 'Unknown';
      const payload = { ...form, student_name };

      if (editing) {
        await feesAPI.update(editing._id, payload);
        toast.success('Updated');
      }
      else {
        await feesAPI.create(payload);
        toast.success('Fee record created');
      }
      setModal(false); fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('This will permanently delete the fee record and all its history. Continue?')) return;
    try { await feesAPI.delete(id); toast.success('Fee record and history deleted permanently'); fetchAll(); }
    catch (e) { toast.error('Error'); }
  };

  const filtered = fees.filter(f =>
    f.gr_number?.includes(search) ||
    f.student_id?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.student_id?.middle_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.student_id?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (gateLoading) return <Spinner />;

  if (!gateToken) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-lg border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-full mb-4">
            <FaUnlock className="text-2xl text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-sm text-gray-500 mt-1">This page is protected. Enter password to continue.</p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeGateTabLocal === 'verify' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveGateTabLocal('verify')}
          >
            Enter Password
          </button>
          {!isPasswordSet && (
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeGateTabLocal === 'set' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveGateTabLocal('set')}
            >
              Add Password
            </button>
          )}
        </div>

        {activeGateTabLocal === 'verify' && (
          <form onSubmit={handleVerifyGate} className="space-y-4">
            {!isPasswordSet && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-700 flex items-center gap-2">
                <span>⚠️ Password is not set yet. Please go to "Add Password" tab.</span>
              </div>
            )}
            <div>
              <input
                type="password"
                className="input-field w-full text-center text-lg tracking-widest"
                placeholder="••••••••"
                value={gatePassword}
                onChange={e => setGatePassword(e.target.value)}
                disabled={!isPasswordSet}
                required={isPasswordSet}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base font-semibold" disabled={!isPasswordSet}>
              Unlock Page
            </button>
          </form>
        )}

        {activeGateTabLocal === 'set' && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            {isPasswordSet ? (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                ✅ Password is already set.
              </div>
            ) : (
              <>
                <input
                  type="password"
                  className="input-field w-full text-center text-lg tracking-widest"
                  placeholder="Set new password"
                  value={setPassword}
                  onChange={e => setSetPassword(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary w-full py-3 text-base font-semibold">
                  Set Password
                </button>
              </>
            )}
          </form>
        )}
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Fees Management</h1><p className="text-sm text-gray-500">Track fee payments & EMI</p></div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              title="Settings"
            >
              <FaCog className={`text-xl transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
              <FaChevronDown className={`text-xs transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => {
                    setSettingsTab('change');
                    setSettingsModal(true);
                    setShowSettings(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2"
                >
                  <FaUnlock className="text-xs" /> Change Password
                </button>
                <button
                  onClick={() => {
                    setSettingsTab('reset');
                    setSettingsModal(true);
                    setShowSettings(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2"
                >
                  <FaHistory className="text-xs" /> Reset Password
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('fees_gate_token');
                    setGateToken('');
                    setGatePassword(''); // Clear the password when locking
                    setShowSettings(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaUnlock className="text-xs" /> Lock Page
                </button>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              const next = !showHistory;
              setShowHistory(next);
              if (next) await fetchHistory();
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FaHistory /> History
          </button>
          <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="btn-primary flex items-center gap-2"><FaPlus />Add Record</button>
        </div>
      </div>

      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Fees Page History</h2>
            <button onClick={fetchHistory} className="btn-secondary">Refresh</button>
          </div>
          {historyLoading ? (
            <div className="py-6"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium">Admin Email</th>
                    <th className="pb-3 font-medium">Result / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-gray-400">No creation records found</td></tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="py-3">{h.createdAt ? new Date(h.createdAt).toLocaleTimeString() : '-'}</td>

                        <td className="py-3 font-medium">{h.action.replace(/_/g, ' ')}</td>
                        <td className="py-3">{h.actorEmail || '-'}</td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <div className={`font-medium text-xs ${h.action.includes('CREATE') || h.action.includes('Create') ? 'text-green-600' : h.action.includes('VIEW') ? 'text-purple-600' : 'text-blue-600'}`}>
                              {h.action.includes('CREATE') || h.action.includes('Create') ? 'ADDED' : h.action.includes('VIEW') ? 'VIEWED' : 'UPDATED'}
                            </div>
                            {(h.meta?.total_amount || h.meta?.amount_paid || h.meta?.pending_amount) && (
                              <div className="text-[11px] text-gray-600 bg-gray-50 p-1 rounded">
                                {h.meta?.total_amount !== undefined ? <span>Total: ₹{h.meta.total_amount.toLocaleString()} </span> : ''}
                                {h.meta?.amount_paid !== undefined ? <span>Paid: ₹{h.meta.amount_paid.toLocaleString()} </span> : ''}
                                {h.meta?.pending_amount !== undefined ? <span className="text-red-600">Pending: ₹{h.meta.pending_amount.toLocaleString()}</span> : ''}
                              </div>
                            )}
                            {h.meta?.payment_mode && <div className="text-[10px] text-gray-400">Mode: {h.meta.payment_mode}</div>}
                            {(h.meta?.std || h.meta?.division || h.meta?.shift || h.meta?.stream) && (
                              <div className="text-[11px] text-gray-500">
                                {h.meta?.std ? `Std ${h.meta.std}` : ''}
                                {h.meta?.division ? ` / Div ${h.meta.division}` : ''}
                                {h.meta?.shift ? ` / ${h.meta.shift}` : ''}
                                {h.meta?.stream ? ` / ${h.meta.stream}` : ''}
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
          )}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Billed" value={`₹${(summary.totalAmount || 0).toLocaleString()}`} icon={FaRupeeSign} color="blue" />
        <StatCard title="Collected" value={`₹${(summary.totalCollected || 0).toLocaleString()}`} icon={FaRupeeSign} color="green" />
        <StatCard title="Pending Amount" value={`₹${(summary.pendingAmount || 0).toLocaleString()}`} icon={FaRupeeSign} color="orange" />
        <StatCard title="Pending Records" value={summary.pendingCount || 0} icon={FaRupeeSign} color="red" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by GR number or student name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="pb-3 font-medium">GR No.</th>
              <th className="pb-3 font-medium">Student Name</th>
              <th className="pb-3 font-medium">Fee Type</th>
              <th className="pb-3 font-medium">Total</th>
              <th className="pb-3 font-medium">Paid</th>
              <th className="pb-3 font-medium">Due Date</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{filtered.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records</td></tr>
              : filtered.map(f => (
                <tr key={f._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-primary-600">{f.gr_number}</td>
                  <td className="py-3">{getFullName(f.student_id)}</td>
                  <td className="py-3">{f.fee_type}</td>
                  <td className="py-3">₹{f.total_amount?.toLocaleString()}</td>
                  <td className="py-3">₹{f.amount_paid?.toLocaleString()}</td>
                  <td className="py-3">{new Date(f.due_date).toLocaleDateString()}</td>
                  <td className="py-3"><Badge status={f.status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => fetchStudentHistory(f.student_id?._id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="View Student History"><FaEye /></button>
                      <button onClick={() => { setEditing(f); setForm({ ...f, due_date: f.due_date?.split('T')[0] }); setModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                      <button onClick={() => handleDelete(f._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={studentHistoryModal} onClose={() => setStudentHistoryModal(false)} title="Student Fee History" size="xl">
        {studentHistoryLoading ? (
          <div className="py-10"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentHistory.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-400">No creation records found for this student</td></tr>
                  ) : (
                    selectedStudentHistory.map((h) => (
                      <tr key={h._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="py-3">{h.createdAt ? new Date(h.createdAt).toLocaleTimeString() : '-'}</td>
                        <td className="py-3 font-medium">{h.action}</td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <div className={`font-medium text-xs ${h.action.includes('CREATE') || h.action.includes('Create') ? 'text-green-600' : 'text-blue-600'}`}>
                              {h.action.includes('CREATE') || h.action.includes('Create') ? 'ADDED' : 'UPDATED'}
                            </div>
                            {h.meta?.total_amount !== undefined && (
                              <div className="text-[11px] text-gray-600 bg-gray-50 p-1 rounded">
                                <span>Total: ₹{h.meta.total_amount.toLocaleString()} </span>
                                <span>Paid: ₹{h.meta.amount_paid?.toLocaleString()} </span>
                                <span className="text-red-600 font-medium">Due: ₹{h.meta.pending_amount?.toLocaleString()}</span>
                              </div>
                            )}
                            {h.meta?.fee_type && <div className="text-[10px] text-gray-400">Type: {h.meta.fee_type}</div>}
                            {h.meta?.payment_mode && <div className="text-[10px] text-gray-400">Mode: {h.meta.payment_mode}</div>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStudentHistoryModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title={settingsTab === 'change' ? 'Change Page Password' : 'Reset Page Password'} size="md">
        <div className="p-1">
          {settingsTab === 'change' ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" className="input-field w-full" placeholder="Enter current password" value={changeCurrentPassword} onChange={e => setChangeCurrentPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" className="input-field w-full" placeholder="Enter new password" value={changeNewPassword} onChange={e => setChangeNewPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full py-2">Update Password</button>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <input type="email" className="input-field w-full" placeholder="Enter registered admin email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary w-full py-2">Send Reset Code</button>
              </form>

              {resetSent && (
                <form onSubmit={handleConfirmReset} className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input className="input-field w-full text-center tracking-[0.5em] font-bold" placeholder="000000" maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" className="input-field w-full" placeholder="Enter new password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary w-full py-2">Confirm Reset</button>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Fee Record' : 'Add Fee Record'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Std</label>
              <select className="input-field" value={form.std} onChange={handleStdChange}>
                <option value="">Select</option>
                {stdOptions.map((s: any) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <select className="input-field" value={form.division} onChange={handleDivisionChange}>
                <option value="">Select</option>
                {divisionOptions.map((d: any) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select className="input-field" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                <option value="">Select</option>
                {['Morning', 'Afternoon'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select className="input-field" value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}>
                <option value="">Select</option>
                {['Science-Maths', 'Science-Bio', 'Commerce', 'Foundation', 'Primary', 'Upper Primary', 'Secondary', 'Higher Secondary'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
              <select className="input-field" value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })}>
                <option value="">Select</option>
                {['English', 'Gujarati', 'Hindi'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
              <select className="input-field" value={form.class_code} onChange={handleClassCodeChange}>
                <option value="">Select</option>
                {classCodeOptions.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {!editing && <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select className="input-field" required value={form.student_id} onChange={handleStudentChange}>
                <option value="">Select student</option>
                {filteredStudents.map(s => (
                  <option key={s._id} value={s._id}>
                    {getFullName(s)} ({s.gr_number})
                  </option>
                ))}
              </select></div>}

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
              <select className="input-field" value={form.fee_type} onChange={e => setForm({ ...form, fee_type: e.target.value })}>
                {['Tuition', 'Transport', 'Library', 'Lab', 'Sports', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input className="input-field" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
              <input type="number" className="input-field" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <input type="number" className="input-field" value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" className="input-field" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select className="input-field" value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                {['Cash', 'Online', 'Cheque', 'DD'].map(m => <option key={m}>{m}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Pending', 'Partial', 'Paid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input className="input-field" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Fees;