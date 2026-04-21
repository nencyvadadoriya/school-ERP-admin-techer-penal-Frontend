import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaRupeeSign, FaEye, FaCog, FaUnlock, FaHistory, FaChevronDown, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auditAPI, classAPI, feesAPI, feesPageSecurityAPI, studentAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { Wallet, Lock, TrendingUp, AlertCircle } from 'lucide-react';

const theme = { primary: '#002B5B', secondary: '#2D54A8', accent: '#FFC107', background: '#F0F2F5' };
const EMPTY = { student_id: '', gr_number: '', std: '', division: '', class_code: '', shift: '', medium: '', stream: '', fee_type: 'Tuition', total_amount: '', amount_paid: '0', due_date: '', payment_mode: 'Cash', academic_year: '2024-25', installment_number: 1, status: 'Pending', remarks: '' };

const statusConfig: Record<string, { color: string; bg: string }> = {
  Paid: { color: '#10B981', bg: '#ECFDF5' },
  Partial: { color: '#F59E0B', bg: '#FFFBEB' },
  Pending: { color: '#EF4444', bg: '#FEF2F2' },
  Overdue: { color: '#7C3AED', bg: '#F5F3FF' },
};

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchAll = async () => {
    try {
      const [feesR, studentsR, summaryR, classesR] = await Promise.all([feesAPI.getAll(), studentAPI.getAll(), feesAPI.getSummary(), classAPI.getAll()]);
      setFees(feesR.data.data || []); setStudents(studentsR.data.data || []); setSummary(summaryR.data.data || {}); setClasses(classesR.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const stdOptions = Array.from(new Set((classes || []).map((c: any) => c.standard).filter(Boolean))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const divisionOptions = Array.from(new Set((classes || []).filter((c: any) => !form.std || c.standard === form.std).map((c: any) => c.division).filter(Boolean))).sort();
  const classCodeOptions = (classes || []).filter((c: any) => (!form.std || c.standard === form.std) && (!form.division || c.division === form.division)).map((c: any) => c.class_code).filter(Boolean);

  const loadGateStatus = async () => {
    try {
      const r = await feesPageSecurityAPI.status();
      setIsPasswordSet(!!r.data?.data?.isPasswordSet);
      setActiveGateTabLocal(r.data?.data?.isPasswordSet ? 'verify' : 'set');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to load status'); } finally { setGateLoading(false); }
  };

  useEffect(() => { loadGateStatus(); }, []);
  useEffect(() => { if (gateToken) { setLoading(true); fetchAll(); auditAPI.recordFeesPageView(); } }, [gateToken]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const r = await auditAPI.getFees({ limit: 100 });
      setHistory((r.data?.data || []).filter((h: any) => h.action.startsWith('FEES_') || h.action === 'Create Fee' || h.action === 'Update Fee'));
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); } finally { setHistoryLoading(false); }
  };

  const getFullName = (student: any) => {
    const fn = student?.first_name || '', mn = student?.middle_name ? ` ${student.middle_name}` : '', ln = student?.last_name ? ` ${student.last_name}` : '';
    return `${fn}${mn}${ln}`.trim();
  };

  const downloadReceipt = (fee: any) => {
    try {
      const doc = new jsPDF();
      const studentName = getFullName(fee.student_id);
      doc.setFillColor(0, 43, 91); doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
      doc.text('SCHOOL ERP SYSTEM', 20, 22);
      doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.text('Official Payment Receipt', 20, 30);
      doc.setFontSize(9); doc.text(`Receipt No: ${fee.receipt_number || 'N/A'}`, 150, 20); doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 26);
      doc.setTextColor(40, 44, 52); doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.text('STUDENT INFORMATION', 20, 55);
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Name:`, 20, 68); doc.setFont(undefined, 'bold'); doc.text(`${studentName}`, 50, 68);
      doc.setFont(undefined, 'normal'); doc.text(`GR Number:`, 20, 75); doc.setFont(undefined, 'bold'); doc.text(`${fee.gr_number}`, 50, 75);
      doc.setFont(undefined, 'normal'); doc.text(`Standard/Div:`, 120, 68); doc.setFont(undefined, 'bold'); doc.text(`${fee.std || '-'} / ${fee.division || '-'}`, 155, 68);
      doc.setFont(undefined, 'normal'); doc.text(`Academic Year:`, 120, 75); doc.setFont(undefined, 'bold'); doc.text(`${fee.academic_year || '-'}`, 155, 75);
      const tableData = [['Description', 'Information'], ['Fee Category', fee.fee_type || 'Tuition'], ['Payment Method', fee.payment_mode || 'Cash'], ['Status', fee.status.toUpperCase()]];
      autoTable(doc, { startY: 85, head: [tableData[0]], body: tableData.slice(1), theme: 'striped', headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 6 } });
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(249, 250, 251); doc.roundedRect(120, finalY + 10, 70, 40, 3, 3, 'F');
      doc.setFontSize(10); doc.setTextColor(107, 114, 128); doc.text('Total Amount:', 125, finalY + 20); doc.text('Amount Paid:', 125, finalY + 28);
      doc.setFontSize(12); doc.setTextColor(40, 44, 52); doc.setFont(undefined, 'bold');
      doc.text(`INR ${fee.total_amount?.toLocaleString()}`, 155, finalY + 20);
      doc.setTextColor(22, 163, 74); doc.text(`INR ${fee.amount_paid?.toLocaleString()}`, 155, finalY + 28);
      doc.setTextColor(220, 38, 38); doc.text('Balance Due:', 125, finalY + 40); doc.text(`INR ${(fee.total_amount - fee.amount_paid).toLocaleString()}`, 155, finalY + 40);
      doc.setFontSize(9); doc.setTextColor(156, 163, 175); doc.setFont(undefined, 'normal'); doc.text('Computer generated receipt - no signature required', 105, 280, { align: 'center' });
      doc.save(`Receipt_${fee.gr_number}_${fee.fee_type}.pdf`);
    } catch { toast.error('Failed to generate receipt'); }
  };

  const filteredStudents = students.filter((s: any) => {
    const ms = !form.std || s.std === form.std;
    const md = !form.division || s.division === form.division;
    const mc = !form.class_code || s.class_code === form.class_code;
    return ms && md && mc;
  }).sort((a, b) => getFullName(a).localeCompare(getFullName(b)));

  const fetchStudentHistory = async (studentId: string) => {
    try {
      setStudentHistoryLoading(true); setStudentHistoryModal(true);
      const r = await auditAPI.getFees({ student_id: studentId, limit: 100 });
      setSelectedStudentHistory((r.data?.data || []).filter((h: any) => h.action === 'FEES_RECORD_CREATE' || h.action === 'FEES_RECORD_UPDATE' || h.action === 'Create Fee' || h.action === 'Update Fee'));
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); } finally { setStudentHistoryLoading(false); }
  };

  const handleVerifyGate = async (e: any) => {
    e.preventDefault();
    try { const r = await feesPageSecurityAPI.verify({ password: gatePassword }); const token = r.data?.data?.gateToken; sessionStorage.setItem('fees_gate_token', token); setGateToken(token); setGatePassword(''); toast.success('Access granted'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Incorrect password'); }
  };
  const handleSetPassword = async (e: any) => {
    e.preventDefault();
    try { await feesPageSecurityAPI.setPassword({ password: setPassword }); toast.success('Password set'); setActiveGateTabLocal('verify'); setSettingsModal(false); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    try { await feesPageSecurityAPI.changePassword({ currentPassword: changeCurrentPassword, newPassword: changeNewPassword }); toast.success('Password changed'); setChangeCurrentPassword(''); setChangeNewPassword(''); sessionStorage.removeItem('fees_gate_token'); setGateToken(''); setActiveGateTabLocal('verify'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleRequestReset = async (e: any) => {
    e.preventDefault();
    try { await feesPageSecurityAPI.requestReset({ email: resetEmail }); toast.success('Reset code sent'); setResetSent(true); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleConfirmReset = async (e: any) => {
    e.preventDefault();
    try { await feesPageSecurityAPI.confirmReset({ email: resetEmail, code: resetCode, newPassword: resetNewPassword }); toast.success('Password reset'); setResetCode(''); setResetNewPassword(''); setResetSent(false); sessionStorage.removeItem('fees_gate_token'); setGateToken(''); setActiveGateTabLocal('verify'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleStudentChange = (e: any) => {
    const student = students.find(s => s._id === e.target.value);
    setForm({ ...form, student_id: e.target.value, gr_number: student?.gr_number || '', std: student?.std || '', division: student?.division || '', class_code: student?.class_code || '', shift: student?.shift || '', medium: student?.medium || '', stream: student?.stream || '' });
  };
  const handleStdChange = (e: any) => setForm({ ...form, std: e.target.value, division: '', class_code: '', student_id: '', gr_number: '' });
  const handleDivisionChange = (e: any) => setForm({ ...form, division: e.target.value, class_code: '', student_id: '', gr_number: '' });
  const handleClassCodeChange = (e: any) => setForm({ ...form, class_code: e.target.value, student_id: '', gr_number: '' });
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await feesAPI.update(editing._id, form); toast.success('Updated'); }
      else { await feesAPI.create(form); toast.success('Fee record created'); }
      setModal(false); fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this fee record?')) return;
    try { await feesAPI.delete(id); toast.success('Deleted'); fetchAll(); } catch { toast.error('Error'); }
  };

  const filtered = fees.filter(f => f.gr_number?.toLowerCase().includes(search.toLowerCase()) || getFullName(f.student_id)?.toLowerCase().includes(search.toLowerCase()));

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  if (gateLoading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderBottomColor: theme.primary }}></div></div>;

  if (!gateToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background }}>
        <div className="w-full max-w-sm mx-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 text-white text-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-black">Fees Management</h1>
              <p className="text-sm opacity-70 mt-1">Protected page — enter password to access</p>
            </div>
            <div className="p-6">
              <div className="flex bg-gray-50 p-1 rounded-xl mb-5">
                <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeGateTabLocal === 'verify' ? 'bg-white shadow-sm' : 'text-gray-500'}`} style={{ color: activeGateTabLocal === 'verify' ? theme.primary : undefined }} onClick={() => setActiveGateTabLocal('verify')}>Enter Password</button>
                {!isPasswordSet && <button className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeGateTabLocal === 'set' ? 'bg-white shadow-sm' : 'text-gray-500'}`} style={{ color: activeGateTabLocal === 'set' ? theme.primary : undefined }} onClick={() => setActiveGateTabLocal('set')}>Set Password</button>}
              </div>
              {activeGateTabLocal === 'verify' && (
                <form onSubmit={handleVerifyGate} className="space-y-4">
                  {!isPasswordSet && <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">⚠️ Password not set yet. Go to "Set Password" tab.</div>}
                  <input type="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl tracking-widest outline-none focus:border-blue-400 transition-all" placeholder="••••••••" value={gatePassword} onChange={e => setGatePassword(e.target.value)} disabled={!isPasswordSet} required={isPasswordSet} autoComplete="new-password" />
                  <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all" style={{ background: theme.primary }} disabled={!isPasswordSet}>Unlock Page</button>
                </form>
              )}
              {activeGateTabLocal === 'set' && (
                <form onSubmit={handleSetPassword} className="space-y-4">
                  {isPasswordSet ? <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">✅ Password is already set.</div> : (
                    <>
                      <input type="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest outline-none focus:border-blue-400 transition-all" placeholder="Set new password" value={setPassword} onChange={e => setSetPassword(e.target.value)} required />
                      <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: theme.primary }}>Set Password</button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {!isMobile && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${theme.primary}15` }}>
                <Wallet size={22} style={{ color: theme.primary }} />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: theme.primary }}>Fees Management</h1>
                <p className="text-sm text-gray-500">Track fee payments and EMI records</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm font-medium">
                  <FaCog className={`transition-transform ${showSettings ? 'rotate-90' : ''}`} /><FaChevronDown className={`text-xs transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <button onClick={() => { setSettingsTab('change'); setSettingsModal(true); setShowSettings(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FaUnlock size={12} />Change Password</button>
                    <button onClick={() => { setSettingsTab('reset'); setSettingsModal(true); setShowSettings(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FaHistory size={12} />Reset Password</button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={() => { sessionStorage.removeItem('fees_gate_token'); setGateToken(''); setGatePassword(''); setShowSettings(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><FaUnlock size={12} />Lock Page</button>
                  </div>
                )}
              </div>
              <button onClick={async () => { const next = !showHistory; setShowHistory(next); if (next) await fetchHistory(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm font-medium">
                <FaHistory /> History
              </button>
              <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg active:scale-95 hover:brightness-110" style={{ background: theme.primary }}>
                <FaPlus size={13} /> Add Record
              </button>
            </div>
          </div>
        )}

        {isMobile && (
          <>
            <div className="p-5 text-white mb-3" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Admin Panel</p>
              <h2 className="text-xl font-extrabold mt-0.5">Fees Management</h2>
            </div>
            <div className="mb-3">
              <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold shadow-lg active:scale-95" style={{ background: theme.primary }}>
                <FaPlus size={13} /> Add Fee Record
              </button>
            </div>
          </>
        )}

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
          {[
            { label: 'Total Billed', value: `₹${(summary.totalAmount || 0).toLocaleString()}`, color: theme.primary, bg: `${theme.primary}12`, Icon: FaRupeeSign },
            { label: 'Collected', value: `₹${(summary.totalCollected || 0).toLocaleString()}`, color: '#10B981', bg: '#ECFDF5', Icon: TrendingUp },
            { label: 'Pending Amount', value: `₹${(summary.pendingAmount || 0).toLocaleString()}`, color: '#F59E0B', bg: '#FFFBEB', Icon: FaRupeeSign },
            { label: 'Pending Records', value: String(summary.pendingCount || 0), color: '#EF4444', bg: '#FEF2F2', Icon: AlertCircle },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  {typeof s.Icon === 'function' && React.isValidElement(<s.Icon />) ? <s.Icon size={14} style={{ color: s.color }} /> : <s.Icon style={{ color: s.color, fontSize: '14px' }} />}
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{s.label}</p>
              </div>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* History */}
        {showHistory && (
          <div className={`bg-white rounded-xl shadow-sm ${isMobile ? 'mb-3' : 'mb-5'} overflow-hidden`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h2 className="text-sm font-bold" style={{ color: theme.primary }}>Fees Page History</h2>
              <button onClick={fetchHistory} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">Refresh</button>
            </div>
            {historyLoading ? <div className="py-8"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr style={{ backgroundColor: `${theme.primary}08` }}>
                    {['Date', 'Time', 'Action', 'Admin', 'Details'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">No records found</td></tr>
                    : history.map(h => (
                      <tr key={h._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2.5 text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-700">{h.action.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2.5 text-gray-500">{h.actorEmail || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold ${h.action.includes('CREATE') || h.action.includes('Create') ? 'text-emerald-600' : h.action.includes('VIEW') ? 'text-purple-600' : 'text-blue-600'}`}>
                            {h.action.includes('CREATE') || h.action.includes('Create') ? 'ADDED' : h.action.includes('VIEW') ? 'VIEWED' : 'UPDATED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className={`bg-white rounded-xl shadow-sm p-3 ${isMobile ? 'mb-3' : 'mb-4'}`}>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" placeholder="Search by GR number or student name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        {isMobile ? (
          <div className="space-y-2.5 pb-6">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center"><p className="text-sm text-gray-400">No fee records found</p></div>
            ) : filtered.map(f => {
              const sc = statusConfig[f.status] || statusConfig.Pending;
              return (
                <div key={f._id} className="bg-white rounded-xl shadow-sm p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold" style={{ color: theme.primary }}>{f.gr_number}</p>
                      <p className="text-xs text-gray-600">{getFullName(f.student_id)}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase" style={{ color: sc.color, backgroundColor: sc.bg }}>{f.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">{f.fee_type} · {new Date(f.due_date).toLocaleDateString()}</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: theme.primary }}>₹{f.total_amount?.toLocaleString()} <span className="text-[10px] text-emerald-600 font-normal">paid ₹{f.amount_paid?.toLocaleString()}</span></p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => downloadReceipt(f)} className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100"><FaDownload size={11} /></button>
                      <button onClick={() => fetchStudentHistory(f.student_id?._id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><FaEye size={11} /></button>
                      <button onClick={() => { setEditing(f); setForm({ ...f, due_date: f.due_date?.split('T')[0] }); setModal(true); }} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"><FaEdit size={11} /></button>
                      <button onClick={() => handleDelete(f._id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><FaTrash size={11} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: `${theme.primary}08` }}>
                    {['GR No.', 'Student', 'Fee Type', 'Total', 'Paid', 'Due Date', 'Status', 'Receipt', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-400">No fee records found</td></tr>
                  ) : filtered.map(f => {
                    const sc = statusConfig[f.status] || statusConfig.Pending;
                    return (
                      <tr key={f._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold" style={{ color: theme.secondary }}>{f.gr_number}</td>
                        <td className="px-4 py-3.5 text-gray-700 font-medium">{getFullName(f.student_id)}</td>
                        <td className="px-4 py-3.5 text-gray-500">{f.fee_type}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-800">₹{f.total_amount?.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-emerald-600 font-medium">₹{f.amount_paid?.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-gray-500">{new Date(f.due_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5"><span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ color: sc.color, backgroundColor: sc.bg }}>{f.status}</span></td>
                        <td className="px-4 py-3.5"><button onClick={() => downloadReceipt(f)} className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"><FaDownload size={12} /></button></td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => fetchStudentHistory(f.student_id?._id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><FaEye size={12} /></button>
                            <button onClick={() => { setEditing(f); setForm({ ...f, due_date: f.due_date?.split('T')[0] }); setModal(true); }} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><FaEdit size={12} /></button>
                            <button onClick={() => handleDelete(f._id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><FaTrash size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student History Modal */}
      <Modal isOpen={studentHistoryModal} onClose={() => setStudentHistoryModal(false)} title="Student Fee History" size="xl">
        {studentHistoryLoading ? <div className="py-10"><Spinner /></div> : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ backgroundColor: `${theme.primary}08` }}>
                  {['Date', 'Time', 'Action', 'Details'].map(h => <th key={h} className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedStudentHistory.length === 0 ? <tr><td colSpan={4} className="text-center py-6 text-gray-400">No records found</td></tr>
                  : selectedStudentHistory.map(h => (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{h.createdAt ? new Date(h.createdAt).toLocaleTimeString() : '-'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-700">{h.action}</td>
                      <td className="px-4 py-2.5">
                        {h.meta?.total_amount !== undefined && <span className="text-[10px] text-gray-500">Total: ₹{h.meta.total_amount?.toLocaleString()} | Paid: ₹{h.meta.amount_paid?.toLocaleString()}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end"><button onClick={() => setStudentHistoryModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Close</button></div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title={settingsTab === 'change' ? 'Change Password' : 'Reset Password'}>
        {settingsTab === 'change' ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label><input type="password" className={inputCls} value={changeCurrentPassword} onChange={e => setChangeCurrentPassword(e.target.value)} required /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label><input type="password" className={inputCls} value={changeNewPassword} onChange={e => setChangeNewPassword(e.target.value)} required /></div>
            <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: theme.primary }}>Update Password</button>
          </form>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleRequestReset} className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Admin Email</label><input type="email" className={inputCls} value={resetEmail} onChange={e => setResetEmail(e.target.value)} required /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: theme.primary }}>Send Reset Code</button>
            </form>
            {resetSent && (
              <form onSubmit={handleConfirmReset} className="space-y-3 pt-3 border-t border-gray-100">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Verification Code</label><input className={inputCls + " text-center tracking-[0.5em] font-bold"} placeholder="000000" maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value)} required /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label><input type="password" className={inputCls} value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required /></div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: theme.primary }}>Confirm Reset</button>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Fee Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Fee Record' : 'Add Fee Record'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Std</label><select className={inputCls} value={form.std} onChange={handleStdChange}><option value="">Select</option>{stdOptions.map((s: any) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Division</label><select className={inputCls} value={form.division} onChange={handleDivisionChange}><option value="">Select</option>{divisionOptions.map((d: any) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Shift</label><select className={inputCls} value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}><option value="">Select</option>{['Morning','Afternoon'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Medium</label><select className={inputCls} value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })}><option value="">Select</option>{['English','Gujarati','Hindi'].map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Class Code</label><select className={inputCls} value={form.class_code} onChange={handleClassCodeChange}><option value="">Select</option>{classCodeOptions.map((c: any) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fee Type</label><select className={inputCls} value={form.fee_type} onChange={e => setForm({ ...form, fee_type: e.target.value })}>{['Tuition','Transport','Library','Lab','Sports','Other'].map(t => <option key={t}>{t}</option>)}</select></div>
            {!editing && <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Student *</label><select className={inputCls} required value={form.student_id} onChange={handleStudentChange}><option value="">Select student</option>{filteredStudents.map(s => <option key={s._id} value={s._id}>{getFullName(s)} ({s.gr_number})</option>)}</select></div>}
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount *</label><input type="number" className={inputCls} required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid</label><input type="number" className={inputCls} value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Due Date *</label><input type="date" className={inputCls} required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label><select className={inputCls} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>{['Cash','Online','Cheque','DD'].map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year</label><input className={inputCls} value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label><select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Pending','Partial','Paid','Overdue'].map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label><input className={inputCls} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95" style={{ background: theme.primary }}>{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Fees;
