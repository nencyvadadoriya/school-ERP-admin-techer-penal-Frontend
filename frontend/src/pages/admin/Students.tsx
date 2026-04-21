import React, { useState, useEffect } from 'react';
import { studentAPI, classAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaPlus, FaEdit, FaTrash, FaHistory, FaCheck, FaTimes,
  FaChevronDown, FaEye, FaEyeSlash, FaUserGraduate, FaFilter,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  primary: '#002B5B',
  primaryMid: '#1a3f72',
  secondary: '#2D54A8',
  accent: '#FFC107',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3b82f6',
  bg: '#F0F2F5',
  white: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  surfaceLight: '#F8FAFC',
  successBg: '#D1FAE5',
  successText: '#065F46',
  dangerBg: '#FEE2E2',
  dangerText: '#991B1B',
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    .s-wrap { background: ${T.bg}; min-height: 100vh; font-family: 'Inter', -apple-system, sans-serif; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s ease; }
    .btn:active { transform: scale(0.97); }
    .btn-primary { background: linear-gradient(135deg, ${T.primary} 0%, ${T.secondary} 100%); color: #fff; }
    .btn-primary:hover { opacity: 0.92; box-shadow: 0 4px 14px rgba(0,43,91,0.3); }
    .btn-ghost { background: rgba(0,43,91,0.07); color: ${T.primary}; border: 1.5px solid rgba(0,43,91,0.2); }
    .btn-ghost:hover { background: rgba(0,43,91,0.13); }
    .btn-danger-ghost { background: rgba(239,68,68,0.07); color: ${T.danger}; border: 1.5px solid rgba(239,68,68,0.25); }
    .btn-danger-ghost:hover { background: ${T.danger}; color: #fff; }
    .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
    .btn-xs { padding: 5px 9px; font-size: 11px; border-radius: 7px; }
    .btn-icon { width: 30px; height: 30px; padding: 0; border-radius: 8px; }

    /* Inputs */
    .field { width: 100%; padding: 9px 12px; border: 1.5px solid ${T.border}; border-radius: 10px; font-size: 13px; color: ${T.text}; background: #fff; transition: border-color 0.18s, box-shadow 0.18s; outline: none; }
    .field:focus { border-color: ${T.secondary}; box-shadow: 0 0 0 3px rgba(45,84,168,0.1); }
    .field-sm { padding: 7px 10px; font-size: 12px; border-radius: 8px; }
    .field-error { border-color: ${T.danger} !important; }
    select.field { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; }

    /* Cards */
    .card { background: #fff; border-radius: 14px; border: 1px solid ${T.border}; }
    .card-sm { border-radius: 10px; }

    /* Modals */
    .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; animation: fadeIn 0.2s ease; }
    .modal-box { background: #fff; border-radius: 18px; width: 100%; max-width: 560px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.28); animation: slideUp 0.25s cubic-bezier(0.4,0,0.2,1); }
    .modal-box-wide { max-width: 680px; }
    .modal-header { padding: 18px 22px 14px; border-bottom: 1px solid ${T.border}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .modal-body { overflow-y: auto; flex: 1; padding: 20px 22px; }
    .modal-footer { padding: 14px 22px; border-top: 1px solid ${T.border}; display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
    .modal-body::-webkit-scrollbar { width: 4px; }
    .modal-body::-webkit-scrollbar-thumb { background: rgba(0,43,91,0.2); border-radius: 4px; }

    /* Form sections */
    .form-section { background: #F8FAFC; border: 1px solid ${T.border}; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .form-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.muted}; margin: 0 0 12px; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .form-col-full { grid-column: 1 / -1; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 5px; }
    .form-label-req::after { content: ' *'; color: ${T.danger}; }
    .form-hint { font-size: 11px; color: ${T.muted}; margin: 4px 0 0; }

    /* Table */
    .s-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .s-table th { padding: 9px 14px; text-align: left; font-weight: 700; font-size: 11px; color: ${T.muted}; background: #F8FAFC; border-bottom: 1px solid ${T.border}; white-space: nowrap; }
    .s-table th:last-child { text-align: right; }
    .s-table td { padding: 8px 14px; border-bottom: 1px solid #F9FAFB; vertical-align: middle; }
    .s-table tr:last-child td { border-bottom: none; }
    .s-table tr:hover td { background: #F8FAFC; }
    .s-table tr.selected td { background: rgba(0,43,91,0.05); }

    /* Tags & badges */
    .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-success { background: ${T.successBg}; color: ${T.successText}; }
    .badge-danger { background: ${T.dangerBg}; color: ${T.dangerText}; }
    .badge-info { background: rgba(59,130,246,0.1); color: #1e40af; }
    .chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }

    /* Mobile sheet */
    .sheet-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: flex-end; z-index: 200; animation: fadeIn 0.2s ease; }
    .sheet-box { background: #fff; border-radius: 22px 22px 0 0; width: 100%; max-height: 92vh; display: flex; flex-direction: column; animation: sheetUp 0.28s cubic-bezier(0.4,0,0.2,1); }
    .sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: #D1D5DB; margin: 10px auto 4px; flex-shrink: 0; }
    .sheet-header { padding: 6px 18px 14px; border-bottom: 1px solid ${T.border}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .sheet-body { overflow-y: auto; flex: 1; padding: 16px 18px; }
    .sheet-footer { padding: 12px 18px 20px; border-top: 1px solid ${T.border}; flex-shrink: 0; }
    .sheet-body::-webkit-scrollbar { width: 0; }

    /* Mobile form sections */
    .m-section { background: #F8FAFC; border: 1px solid ${T.border}; border-radius: 14px; padding: 14px; margin-bottom: 12px; }
    .m-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: ${T.muted}; margin: 0 0 11px; display: flex; align-items: center; gap: 6px; }
    .m-section-label::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: ${T.primary}; }
    .m-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    /* Bulk card row */
    .bulk-card { background: #fff; border: 1px solid ${T.border}; border-radius: 14px; overflow: hidden; margin-bottom: 10px; }
    .bulk-card-head { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; background: #fff; }
    .bulk-card-body { border-top: 1px solid ${T.border}; padding: 12px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .bulk-card-info { display: flex; flex-direction: column; gap: 1px; }
    .bulk-card-info-label { font-size: 10px; color: ${T.muted}; font-weight: 500; }
    .bulk-card-info-val { font-size: 12px; font-weight: 600; color: ${T.text}; }
    .bulk-card-edit { border-top: 1px solid ${T.border}; padding: 12px 14px; background: #FAFAFA; }
    .bulk-card-incomplete { border: 1.5px dashed #FCA5A5; background: #FFF5F5; }
    .bulk-avatar { width: 26px; height: 26px; border-radius: 50%; background: ${T.primary}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }

    /* Progress dots */
    .prog-dot { width: 8px; height: 8px; border-radius: 50%; transition: background 0.2s; }
    .prog-dot-on { background: ${T.primary}; }
    .prog-dot-off { background: #D1D5DB; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner-ring { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #E5E7EB; border-top-color: ${T.primary}; animation: spin 0.9s linear infinite; }

    /* Group header */
    .group-header { padding: 10px 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to right, rgba(0,43,91,0.04), rgba(0,43,91,0.02)); border-bottom: 1px solid transparent; transition: background 0.15s; }
    .group-header:hover { background: rgba(0,43,91,0.07); }
    .group-header.open { border-bottom-color: ${T.border}; }
    .chevron { transition: transform 0.22s ease; }
    .chevron.open { transform: rotate(180deg); }

    /* Stat cards */
    .stat-card { background: #fff; border-radius: 13px; border: 1px solid ${T.border}; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .stat-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    /* Filter bar */
    .filter-bar { background: #fff; border-radius: 13px; border: 1px solid ${T.border}; padding: 14px 18px; }

    /* Empty state */
    .empty-state { background: #fff; border-radius: 14px; border: 1px solid ${T.border}; padding: 56px 32px; text-align: center; }

    /* Mobile header */
    .m-header { background: #002B5B; padding: 44px 18px 28px; }
    .m-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .m-stat-cell { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; }
    .m-stat-icon { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }

    /* Mobile group card */
    .m-group-card { background: #fff; border-radius: 16px; border: 1px solid ${T.border}; padding: 16px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: box-shadow 0.15s; }
    .m-group-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .m-arrow-box { width: 34px; height: 34px; border-radius: 10px; background: rgba(0,43,91,0.07); display: flex; align-items: center; justify-content: center; color: ${T.primary}; flex-shrink: 0; }

    /* Fullscreen overlay for mobile class view */
    .m-fullscreen { position: fixed; inset: 0; background: #F0F2F5; z-index: 300; display: flex; flex-direction: column; }
    .m-fs-header { background: #002B5B; padding: 52px 18px 18px; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
    .m-fs-body { flex: 1; overflow-y: auto; padding: 16px; }
    .m-student-card { background: #fff; border-radius: 13px; border: 1px solid ${T.border}; padding: 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }

    /* Password toggle */
    .pwd-wrap { position: relative; }
    .pwd-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${T.muted}; padding: 0; display: flex; align-items: center; }

    /* Responsive */
    @media (max-width: 640px) {
      .modal-bg { align-items: flex-end; padding: 0; }
      .modal-box { border-radius: 22px 22px 0 0; max-width: 100%; max-height: 96vh; }
      .modal-header { padding: 6px 18px 14px; }
    }
  `}</style>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getStreamOptions = (std: string) => {
  const n = Number(std);
  if (n >= 11) return ['Science-Maths', 'Science-Bio', 'Commerce', 'Higher Secondary'];
  if (n >= 9) return ['Foundation', 'Secondary'];
  if (n >= 6) return ['Upper Primary'];
  if (n >= 1) return ['Primary'];
  return [];
};

const genderColor = (g: string) =>
  g === 'Male' ? '#1d4ed8' : g === 'Female' ? '#be185d' : T.muted;

const initials = (first: string, last: string) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

const avatarHues = ['#002B5B', '#2D54A8', '#1d4ed8', '#065F46', '#5b21b6', '#be185d'];
const avatarColor = (name: string) => avatarHues[name.charCodeAt(0) % avatarHues.length];

const STDS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D'];
const MEDIUMS = ['English','Gujarati','Hindi'];
const SHIFTS = ['Morning','Afternoon'];
const GENDERS = ['Male','Female','Other'];

// ─── ICON SVGS (inline, no extra deps) ───────────────────────────────────────
const IconUsers = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconMale = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="6"/><path d="M20 4l-6 6"/><path d="M14 4h6v6"/>
  </svg>
);
const IconFemale = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M12 14v7"/><path d="M9 18h6"/>
  </svg>
);
const IconGraduate = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconBack = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────
const emptyForm = () => ({
  std: '', roll_no: '', first_name: '', middle_name: '', last_name: '',
  gender: '', phone1: '', phone2: '', address: '', pin: '1234',
  class_code: '', class_name: '', password: '123456', fees: '',
  shift: '', stream: '', medium: '',
});

const emptyBulkApply = () => ({
  std: '', class_name: '', shift: '', gender: '', stream: '',
  medium: '', fees: '', pin: '1234', password: '123456',
});

const emptyBulkRow = (defaults: any = {}) => ({
  first_name: '', middle_name: '', last_name: '', phone1: '', phone2: '', address: '',
  std: defaults.std || '', class_name: defaults.class_name || '',
  shift: defaults.shift || '', gender: defaults.gender || '',
  stream: defaults.stream || '', medium: defaults.medium || '',
  fees: defaults.fees || '', pin: defaults.pin || '1234',
  password: defaults.password || '123456',
  _expanded: true,
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const Students: React.FC = () => {
  const navigate = useNavigate();

  // Data
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStd, setFilterStd] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterMedium, setFilterMedium] = useState('');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // Add/Edit form
  const [form, setForm] = useState(emptyForm());

  // Bulk
  const [bulkApply, setBulkApply] = useState(emptyBulkApply());
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Mobile
  const [isMobile, setIsMobile] = useState(false);
  const [mobileClassView, setMobileClassView] = useState(false);
  const [activeGroup, setActiveGroup] = useState<any>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  useEffect(() => { fetchStudents(); fetchClasses(); }, []);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener?.('change', apply);
    return () => mql.removeEventListener?.('change', apply);
  }, []);

  // ── API ────────────────────────────────────────────────────
  const fetchStudents = async () => {
    try { const r = await studentAPI.getAll(); setStudents(r.data.data); }
    catch { toast.error('Error fetching students'); }
    finally { setLoading(false); }
  };
  const fetchClasses = async () => {
    try { const r = await classAPI.getAll(); setClasses(r.data?.data || []); }
    catch (e) { console.error(e); }
  };

  // ── Derived data ───────────────────────────────────────────
  const uniqueOf = (field: string) =>
    [...new Set(students.map((s: any) => s[field]).filter(Boolean))].sort() as string[];

  const filtered = students
    .filter(s => {
      if (filterStd && s.std !== filterStd) return false;
      if (filterClass && s.class_name !== filterClass) return false;
      if (filterShift && s.shift !== filterShift) return false;
      if (filterMedium && s.medium !== filterMedium) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.first_name?.toLowerCase().includes(q) &&
            !s.last_name?.toLowerCase().includes(q) &&
            !s.gr_number?.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));

  const grouped: Record<string, any> = filtered.reduce((acc: any, s) => {
    const key = `${s.std}-${s.class_name}-${s.shift}-${s.medium}`;
    if (!acc[key]) acc[key] = { std: s.std, class_name: s.class_name, shift: s.shift, medium: s.medium, students: [] };
    acc[key].students.push(s);
    return acc;
  }, {});

  const hasFilters = !!(search || filterStd || filterClass || filterShift || filterMedium);

  // ── Selection helpers ──────────────────────────────────────
  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleGroupSelect = (ids: string[]) => {
    const allOn = ids.every(id => selected.has(id));
    const n = new Set(selected);
    ids.forEach(id => allOn ? n.delete(id) : n.add(id));
    setSelected(n);
  };
  const toggleGroup = (key: string) => {
    const n = new Set(expandedGroups);
    n.has(key) ? n.delete(key) : n.add(key);
    setExpandedGroups(n);
  };
  const clearFilters = () => {
    setSearch(''); setFilterStd(''); setFilterClass('');
    setFilterShift(''); setFilterMedium('');
    setSelected(new Set()); setExpandedGroups(new Set());
  };

  // ── CRUD ───────────────────────────────────────────────────
  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm());
    setShowPwd(false);
    setShowModal(true);
  };
  const openEdit = (s: any) => {
    setEditStudent(s);
    setForm({
      std: s.std || '', roll_no: s.roll_no || '', first_name: s.first_name || '',
      middle_name: s.middle_name || '', last_name: s.last_name || '',
      gender: s.gender || '', phone1: s.phone1 || '', phone2: s.phone2 || '',
      address: s.address || '', pin: s.pin || '', class_code: s.class_code || '',
      class_name: s.class_name || '', password: '', fees: s.fees || '',
      shift: s.shift || '', stream: s.stream || '', medium: s.medium || '',
    });
    setShowPwd(false);
    setShowModal(true);
  };

  const handleFormChange = async (e: any) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === 'std') updated.stream = '';
    setForm(updated);
    if ((name === 'std' || name === 'class_name') && !editStudent) {
      const std = name === 'std' ? value : form.std;
      const class_name = name === 'class_name' ? value : form.class_name;
      if (std && class_name) {
        try {
          const res = await studentAPI.getNextRollNumber({ std, class_name, shift: form.shift, medium: form.medium, stream: updated.stream });
          if (res.data?.success) setForm(prev => ({ ...prev, roll_no: res.data.nextRollNo, std, class_name }));
        } catch {}
      }
    }
  };

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();
    const required = ['std', 'class_name', 'first_name', 'last_name', 'medium'];
    const missing = required.filter(f => !form[f as keyof typeof form]?.toString().trim());
    if (missing.length) { toast.error(`Please fill: ${missing.join(', ')}`); return; }
    if (Number(form.std) >= 11 && !form.stream) { toast.error('Stream is required for Std 11 & 12'); return; }
    try {
      const payload = { ...form, fees: form.fees ? Number(form.fees) : 0 };
      if (editStudent) {
        await studentAPI.update(editStudent._id || editStudent.id, payload);
        toast.success('Student updated');
      } else {
        const res = await studentAPI.register(payload);
        toast.success(res?.data?.generated_password ? `Added. Password: ${res.data.generated_password}` : 'Student added');
      }
      setShowModal(false); fetchStudents();
    } catch (err: any) {
      const d = err.response?.data;
      if (d?.message === 'Validation error' && d.errors)
        toast.error(Object.keys(d.errors).map(k => `${k}: ${d.errors[k]}`).join(' | '));
      else toast.error(d?.message || 'Error saving student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this student?')) return;
    try { await studentAPI.delete(id); toast.success('Deleted'); fetchStudents(); }
    catch { toast.error('Error deleting student'); }
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} selected student(s)?`)) return;
    try {
      await Promise.all(Array.from(selected).map(id => studentAPI.delete(id)));
      toast.success(`${selected.size} students deleted`);
      setSelected(new Set()); fetchStudents();
    } catch { toast.error('Error deleting some students'); }
  };

  // ── Bulk helpers ───────────────────────────────────────────
  const openBulk = () => {
    setBulkRows([]); setBulkText(''); setBulkResults(null); setBulkSubmitting(false);
    setBulkApply(emptyBulkApply());
    setShowBulkModal(true);
  };

  const parseBulkText = (text: string, defaults: any) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
      const row = emptyBulkRow(defaults);
      if (line.includes('|') && line.includes(':')) {
        line.split('|').forEach(part => {
          const [k, ...vParts] = part.split(':');
          const v = vParts.join(':').trim();
          const key = k.trim().toLowerCase().replace(/\s/g, '');
          if (key === 'firstname') row.first_name = v.replace(/^\d+[\.\s]*/, '').trim();
          else if (key === 'lastname') row.last_name = v;
          else if (key === 'middlename') row.middle_name = v;
          else if (key === 'phone1') row.phone1 = v;
          else if (key === 'phone2') row.phone2 = v;
          else if (key === 'address') row.address = v;
        });
      } else {
        const cols = line.split(line.includes('\t') ? '\t' : ',');
        row.first_name = (cols[0] || '').replace(/^\d+[\.\s]*/, '').trim();
        row.last_name = cols[1]?.trim() || '';
        row.phone1 = cols[2]?.trim() || '';
        row.phone2 = cols[3]?.trim() || '';
        row.address = cols[4]?.trim() || '';
        if (cols[5]) row.std = cols[5].trim();
        if (cols[6]) row.class_name = cols[6].trim();
        if (cols[7]) row.pin = cols[7].trim();
        if (cols[8]) row.password = cols[8].trim();
      }
      row._expanded = false;
      return row;
    });
  };

  const handleAddToList = () => {
    if (!bulkText.trim()) { toast.error('Paste some data first'); return; }
    const parsed = parseBulkText(bulkText, bulkApply);
    setBulkRows(prev => [...prev, ...parsed]);
    setBulkText('');
    toast.success(`Added ${parsed.length} students`);
  };

  const updateBulkRow = (idx: number, field: string, value: any) => {
    const rows = [...bulkRows];
    rows[idx] = { ...rows[idx], [field]: value };
    setBulkRows(rows);
  };

  const toggleBulkExpand = (idx: number) => {
    const rows = [...bulkRows];
    rows[idx] = { ...rows[idx], _expanded: !rows[idx]._expanded };
    setBulkRows(rows);
  };

  const removeBulkRow = (idx: number) => setBulkRows(bulkRows.filter((_, i) => i !== idx));

  const bulkRowReady = (r: any) => !!(r.first_name && r.last_name && r.std && r.class_name && r.medium);
  const readyCount = bulkRows.filter(bulkRowReady).length;

  const handleBulkSubmit = async () => {
    const invalid = bulkRows.map((r, i) => !bulkRowReady(r) ? i + 1 : null).filter(Boolean);
    if (invalid.length) { toast.error(`Rows missing required fields: ${invalid.join(', ')}`); return; }
    if (!bulkRows.length) { toast.error('Add at least one student'); return; }
    try {
      setBulkSubmitting(true); setBulkResults(null);
      const res = await studentAPI.bulkCreate({ students: bulkRows });
      setBulkResults(res?.data);
      toast.success(`Created ${res?.data?.count || 0} students`);
      setShowBulkModal(false); fetchStudents();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Bulk create failed';
      toast.error(msg); setBulkResults(err?.response?.data || null);
    } finally { setBulkSubmitting(false); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const parsed = parseBulkText(text, bulkApply);
    if (parsed.length) {
      setBulkRows(prev => [...prev, ...parsed]);
      toast.success(`Pasted ${parsed.length} rows`);
      e.preventDefault();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg }}>
      <GlobalStyles />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner-ring" style={{ margin: '0 auto 14px' }} />
        <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: 0 }}>Loading students…</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // ADD / EDIT MODAL (shared desktop + mobile)
  // ─────────────────────────────────────────────────────────────────────────────
  const streamOpts = getStreamOptions(form.std);
  const isEdit = !!editStudent;

  const AddEditModal = () => {
    const Overlay = isMobile ? 'div' : 'div';
    const overlayClass = isMobile ? 'sheet-bg' : 'modal-bg';
    const boxClass = isMobile ? 'sheet-box' : 'modal-box';

    const FormContent = () => (
      <>
        {/* Class Info */}
        <div className={isMobile ? 'm-section' : 'form-section'}>
          <p className={isMobile ? 'm-section-label' : 'form-section-title'}>Class info</p>
          <div className={isMobile ? 'm-grid-2' : 'form-grid-2'}>
            <div>
              <label className="form-label form-label-req">Standard</label>
              <select name="std" value={form.std} onChange={handleFormChange} className="field field-sm">
                <option value="">Select</option>
                {STDS.map(s => <option key={s} value={s}>Class {s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-req">Section</label>
              <select name="class_name" value={form.class_name} onChange={handleFormChange} className="field field-sm">
                <option value="">Select</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label form-label-req">Medium</label>
              <select name="medium" value={form.medium} onChange={handleFormChange} className="field field-sm">
                <option value="">Select</option>
                {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Shift</label>
              <select name="shift" value={form.shift} onChange={handleFormChange} className="field field-sm">
                <option value="">Select</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {streamOpts.length > 0 && (
              <div className={!isMobile ? 'form-col-full' : ''}>
                <label className={`form-label${Number(form.std) >= 11 ? ' form-label-req' : ''}`}>Stream</label>
                <select name="stream" value={form.stream} onChange={handleFormChange} className="field field-sm" required={Number(form.std) >= 11}>
                  <option value="">Select</option>
                  {streamOpts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Personal Details */}
        <div className={isMobile ? 'm-section' : 'form-section'}>
          <p className={isMobile ? 'm-section-label' : 'form-section-title'}>Personal details</p>
          <div className={isMobile ? 'm-grid-2' : 'form-grid-2'}>
            <div>
              <label className="form-label form-label-req">First name</label>
              <input name="first_name" value={form.first_name} onChange={handleFormChange} placeholder="Aarav" className="field field-sm" />
            </div>
            <div>
              <label className="form-label">Middle name</label>
              <input name="middle_name" value={form.middle_name} onChange={handleFormChange} placeholder="Kumar" className="field field-sm" />
            </div>
            <div>
              <label className="form-label form-label-req">Last name</label>
              <input name="last_name" value={form.last_name} onChange={handleFormChange} placeholder="Patel" className="field field-sm" />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select name="gender" value={form.gender} onChange={handleFormChange} className="field field-sm">
                <option value="">Select</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact & Account */}
        <div className={isMobile ? 'm-section' : 'form-section'}>
          <p className={isMobile ? 'm-section-label' : 'form-section-title'}>Contact & account</p>
          <div className={isMobile ? 'm-grid-2' : 'form-grid-2'}>
            <div>
              <label className="form-label">Primary phone</label>
              <input name="phone1" value={form.phone1} onChange={handleFormChange} placeholder="98765 43210" className="field field-sm" />
            </div>
            <div>
              <label className="form-label">Secondary phone</label>
              <input name="phone2" value={form.phone2} onChange={handleFormChange} placeholder="Optional" className="field field-sm" />
            </div>
            <div>
              <label className="form-label">Fees (₹)</label>
              <input name="fees" value={form.fees} onChange={handleFormChange} placeholder="0" type="number" className="field field-sm" />
            </div>
            <div>
              <label className="form-label">PIN</label>
              <input name="pin" value={form.pin} onChange={handleFormChange} placeholder="1234" className="field field-sm" />
            </div>
            <div className="form-col-full">
              <label className="form-label">Password</label>
              <div className="pwd-wrap">
                <input name="password" value={form.password} onChange={handleFormChange} placeholder="Leave blank to auto-generate" type={showPwd ? 'text' : 'password'} className="field field-sm" style={{ paddingRight: 34 }} />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </div>
              <p className="form-hint">Leave blank to auto-generate a password</p>
            </div>
            <div className="form-col-full">
              <label className="form-label">Address</label>
              <textarea name="address" value={form.address} onChange={handleFormChange} placeholder="Full address…" className="field field-sm" style={{ resize: 'none', height: 64 }} />
            </div>
          </div>
        </div>
      </>
    );

    if (isMobile) return (
      <div className="sheet-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
        <div className="sheet-box">
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>{isEdit ? 'Edit student' : 'Add student'}</p>
              <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Fill in the details below</p>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
              <IconClose size={15} />
            </button>
          </div>
          <div className="sheet-body">
            <form id="student-form" onSubmit={handleFormSubmit}>
              <FormContent />
            </form>
          </div>
          <div className="sheet-footer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="student-form" className="btn btn-primary">
                {isEdit ? 'Save changes' : 'Add student'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
        <div className="modal-box">
          <div className="modal-header">
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0 }}>{isEdit ? 'Edit student' : 'Add new student'}</p>
              <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>All fields marked * are required</p>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
              <IconClose />
            </button>
          </div>
          <div className="modal-body">
            <form id="student-form-d" onSubmit={handleFormSubmit}>
              <FormContent />
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" form="student-form-d" className="btn btn-primary">
              {isEdit ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BULK MODAL
  // ─────────────────────────────────────────────────────────────────────────────
  const BulkModal = () => {
    const BulkRowCard = ({ row, idx }: { row: any; idx: number }) => {
      const ready = bulkRowReady(row);
      const hasName = !!(row.first_name || row.last_name);
      return (
        <div className={`bulk-card${!ready && hasName ? ' bulk-card-incomplete' : ''}`}>
          <div className="bulk-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div className="bulk-avatar" style={{ background: avatarColor(row.first_name || 'A') }}>
                {hasName ? initials(row.first_name, row.last_name) : <span style={{ fontSize: 12 }}>{idx + 1}</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasName ? `${row.first_name} ${row.last_name}`.trim() : `Student ${idx + 1}`}
                </p>
                <p style={{ fontSize: 11, color: T.muted, margin: '1px 0 0' }}>
                  {row.phone1 || (ready ? `Std ${row.std} · ${row.class_name}` : 'Incomplete — tap to expand')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {!ready && hasName && (
                <span className="badge badge-danger" style={{ fontSize: 10 }}>Incomplete</span>
              )}
              {ready && <span className="badge badge-success" style={{ fontSize: 10 }}>✓ Ready</span>}
              <button onClick={() => toggleBulkExpand(idx)} style={{ width: 28, height: 28, borderRadius: 8, background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
                <FaChevronDown size={11} style={{ transform: row._expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              <button onClick={() => removeBulkRow(idx)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.danger }}>
                <FaTrash size={11} />
              </button>
            </div>
          </div>

          {!row._expanded && ready && (
            <div className="bulk-card-body">
              <div className="bulk-card-info">
                <span className="bulk-card-info-label">Std / Section</span>
                <span className="bulk-card-info-val">Class {row.std} / {row.class_name}</span>
              </div>
              <div className="bulk-card-info">
                <span className="bulk-card-info-label">Medium</span>
                <span className="bulk-card-info-val">{row.medium}</span>
              </div>
              {row.shift && (
                <div className="bulk-card-info">
                  <span className="bulk-card-info-label">Shift</span>
                  <span className="bulk-card-info-val">{row.shift}</span>
                </div>
              )}
              {row.gender && (
                <div className="bulk-card-info">
                  <span className="bulk-card-info-label">Gender</span>
                  <span className="bulk-card-info-val" style={{ color: genderColor(row.gender) }}>{row.gender}</span>
                </div>
              )}
            </div>
          )}

          {row._expanded && (
            <div className="bulk-card-edit">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { field: 'first_name', label: 'First name *', placeholder: 'First name', isReq: true },
                  { field: 'last_name', label: 'Last name *', placeholder: 'Last name', isReq: true },
                  { field: 'phone1', label: 'Phone', placeholder: 'Phone number', isReq: false },
                  { field: 'middle_name', label: 'Middle name', placeholder: 'Middle name', isReq: false },
                ].map(({ field, label, placeholder, isReq }) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>
                      {label}
                    </label>
                    <input
                      value={row[field]}
                      onChange={e => updateBulkRow(idx, field, e.target.value)}
                      placeholder={placeholder}
                      className={`field field-sm${isReq && !row[field] ? ' field-error' : ''}`}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>Standard *</label>
                  <select value={row.std} onChange={e => updateBulkRow(idx, 'std', e.target.value)} className={`field field-sm${!row.std ? ' field-error' : ''}`}>
                    <option value="">Select</option>
                    {STDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>Section *</label>
                  <select value={row.class_name} onChange={e => updateBulkRow(idx, 'class_name', e.target.value)} className={`field field-sm${!row.class_name ? ' field-error' : ''}`}>
                    <option value="">Select</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>Medium *</label>
                  <select value={row.medium} onChange={e => updateBulkRow(idx, 'medium', e.target.value)} className={`field field-sm${!row.medium ? ' field-error' : ''}`}>
                    <option value="">Select</option>
                    {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>Gender</label>
                  <select value={row.gender} onChange={e => updateBulkRow(idx, 'gender', e.target.value)} className="field field-sm">
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    const ModalShell = ({ children }: { children: React.ReactNode }) => {
      if (isMobile) return (
        <div className="sheet-bg" onClick={e => e.target === e.currentTarget && setShowBulkModal(false)}>
          <div className="sheet-box">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>Bulk add students</p>
                <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Add multiple students at once</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
                <IconClose size={15} />
              </button>
            </div>
            {children}
          </div>
        </div>
      );
      return (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowBulkModal(false)}>
          <div className="modal-box modal-box-wide">
            <div className="modal-header">
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0 }}>Bulk student creator</p>
                <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Add multiple students at once</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
                <IconClose />
              </button>
            </div>
            {children}
          </div>
        </div>
      );
    };

    const bodyClass = isMobile ? 'sheet-body' : 'modal-body';
    const footerClass = isMobile ? 'sheet-footer' : 'modal-footer';

    return (
      <ModalShell>
        <div className={bodyClass}>
          {/* Default Settings */}
          <div className={isMobile ? 'm-section' : 'form-section'}>
            <p className={isMobile ? 'm-section-label' : 'form-section-title'}>Default settings — applied to all rows</p>
            <div className={isMobile ? 'm-grid-2' : 'form-grid-3'}>
              {[
                { key: 'std',        label: 'Standard *', opts: STDS },
                { key: 'class_name', label: 'Class *',    opts: SECTIONS },
                { key: 'shift',      label: 'Shift',      opts: SHIFTS },
                { key: 'gender',     label: 'Gender',     opts: GENDERS },
                { key: 'stream',     label: 'Stream',     opts: ['Science-Maths','Science-Bio','Commerce','Higher Secondary','Foundation','Secondary','Upper Primary','Primary'] },
                { key: 'medium',     label: 'Medium *',   opts: MEDIUMS },
                { key: 'fees',       label: 'Fees',       opts: [] },
                { key: 'pin',        label: 'PIN',        opts: [] },
                { key: 'password',   label: 'Password',   opts: [] },
              ].map(({ key, label, opts }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                  {opts.length > 0 ? (
                    <select value={bulkApply[key as keyof typeof bulkApply]} onChange={e => setBulkApply({ ...bulkApply, [key]: e.target.value })} className="field field-sm">
                      <option value="">Select</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={bulkApply[key as keyof typeof bulkApply]} onChange={e => setBulkApply({ ...bulkApply, [key]: e.target.value })} className="field field-sm" placeholder={label} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Paste area */}
          <div className={isMobile ? 'm-section' : 'form-section'}>
            <p className={isMobile ? 'm-section-label' : 'form-section-title'}>Paste student data</p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              onPaste={handlePaste}
              placeholder={'First Name: Aarav | Last Name: Patel | Phone1: 9876543210\nOr paste CSV: First, Last, Phone, …'}
              className="field"
              style={{ height: 80, fontFamily: 'monospace', fontSize: 12, resize: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: T.muted }}>
                {bulkText.split('\n').filter(l => l.trim()).length} line(s) detected
              </span>
              <button onClick={handleAddToList} className="btn btn-primary btn-sm">+ Add to list</button>
            </div>
          </div>

          {/* Row list header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>
                {bulkRows.length} Student(s) to create
              </p>
              {bulkRows.length > 0 && (
                <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>
                  Tip: Copy rows from Excel and paste here to auto-fill
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {bulkRows.length > 0 && (
                <button onClick={() => setBulkRows([])} style={{ fontSize: 12, color: T.danger, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
              )}
              <button onClick={() => setBulkRows(prev => [...prev, emptyBulkRow(bulkApply)])} className="btn btn-ghost btn-sm">+ Add Row</button>
            </div>
          </div>

          {/* MOBILE: card view */}
          {isMobile && bulkRows.length > 0 && (
            <div>
              {bulkRows.map((row, idx) => <BulkRowCard key={idx} row={row} idx={idx} />)}
            </div>
          )}

          {/* DESKTOP: full column table — all original columns preserved */}
          {!isMobile && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ background: `${T.primary}06` }}>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['#','First Name *','Middle Name','Last Name *','Phone 1','Phone 2','Address','PIN','Password','Std *','Class *','Medium *',''].map((h, i) => (
                      <th key={i} style={{ padding: '8px 10px', textAlign: i === 12 ? 'center' : 'left', fontWeight: 700, color: T.muted, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid #F3F4F6`, background: (!row.first_name || !row.last_name || !row.std || !row.class_name || !row.medium) && (row.first_name || row.last_name) ? '#FFF9F9' : '#fff' }}>
                      <td style={{ padding: '5px 10px', color: T.muted, fontWeight: 600 }}>{idx + 1}</td>
                      {[
                        { f: 'first_name',  req: true },
                        { f: 'middle_name', req: false },
                        { f: 'last_name',   req: true },
                        { f: 'phone1',      req: false },
                        { f: 'phone2',      req: false },
                        { f: 'address',     req: false },
                        { f: 'pin',         req: false },
                        { f: 'password',    req: false },
                      ].map(({ f, req }) => (
                        <td key={f} style={{ padding: '4px 4px' }}>
                          <input
                            value={row[f]}
                            onChange={e => updateBulkRow(idx, f, e.target.value)}
                            className={`field${req && !row[f] ? ' field-error' : ''}`}
                            style={{ fontSize: 11, padding: '5px 7px', width: f === 'address' ? 110 : f === 'password' || f === 'middle_name' ? 80 : 72 }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '4px 4px' }}>
                        <select value={row.std} onChange={e => updateBulkRow(idx, 'std', e.target.value)} className={`field${!row.std ? ' field-error' : ''}`} style={{ fontSize: 11, padding: '5px 20px 5px 7px', width: 56 }}>
                          <option value="">—</option>
                          {STDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <select value={row.class_name} onChange={e => updateBulkRow(idx, 'class_name', e.target.value)} className={`field${!row.class_name ? ' field-error' : ''}`} style={{ fontSize: 11, padding: '5px 20px 5px 7px', width: 60 }}>
                          <option value="">—</option>
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <select value={row.medium} onChange={e => updateBulkRow(idx, 'medium', e.target.value)} className={`field${!row.medium ? ' field-error' : ''}`} style={{ fontSize: 11, padding: '5px 20px 5px 7px', width: 84 }}>
                          <option value="">—</option>
                          {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                        <button onClick={() => removeBulkRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bulkRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                  <FaUserGraduate size={26} color="#D1D5DB" style={{ marginBottom: 8 }} />
                  <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>No students added yet — paste data above or click "+ Add Row"</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile empty */}
          {isMobile && bulkRows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', border: '2px dashed #E5E7EB', borderRadius: 12 }}>
              <FaUserGraduate size={28} color="#D1D5DB" style={{ marginBottom: 8 }} />
              <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Paste data above or add rows manually</p>
            </div>
          )}

          {bulkResults && (
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, border: `1px solid ${bulkResults.success ? '#BBF7D0' : '#FCA5A5'}`, background: bulkResults.success ? '#F0FDF4' : '#FFF5F5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {bulkResults.success ? <FaCheck color="#16A34A" size={12} /> : <FaTimes color="#DC2626" size={12} />}
                <span style={{ fontWeight: 700, fontSize: 12, color: bulkResults.success ? '#15803D' : '#B91C1C' }}>
                  {bulkResults.success ? `Created ${bulkResults.count} students successfully` : 'Creation failed'}
                </span>
              </div>
              {bulkResults.errors?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#B91C1C' }}>
                  {bulkResults.errors.slice(0, 5).map((err: any, i: number) => (
                    <p key={i} style={{ margin: '2px 0' }}>Row {err.index + 1}: {err.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={footerClass}>
          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button onClick={() => setShowBulkModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleBulkSubmit} disabled={bulkSubmitting || !bulkRows.length} className="btn btn-primary" style={{ opacity: (bulkSubmitting || !bulkRows.length) ? 0.5 : 1 }}>
                {bulkSubmitting ? 'Creating…' : `Create ${bulkRows.length} student${bulkRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          ) : (
            <>
              <span style={{ fontSize: 11, color: T.muted, marginRight: 'auto' }}>Ready: {readyCount} / {bulkRows.length} students</span>
              <button onClick={() => setShowBulkModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleBulkSubmit} disabled={bulkSubmitting || !bulkRows.length} className="btn btn-primary" style={{ opacity: (bulkSubmitting || !bulkRows.length) ? 0.5 : 1 }}>
                {bulkSubmitting ? 'Creating…' : `Create ${bulkRows.length || ''} students`}
              </button>
            </>
          )}
        </div>
      </ModalShell>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  const MobileView = () => (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div className="m-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Students</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '2px 0 0', fontWeight: 500 }}>SmartSchool ERP</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={openBulk} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
              + Bulk
            </button>
            <button onClick={openAdd} style={{ background: '#fff', border: 'none', borderRadius: 10, color: '#002B5B', fontSize: 13, fontWeight: 800, padding: '9px 16px', cursor: 'pointer' }}>
              + Add
            </button>
          </div>
        </div>

        <div className="m-stat-grid" style={{ marginTop: 16 }}>
          {[
            { label: 'Total', value: students.length, icon: <IconUsers size={14} color="#fff" /> },
            { label: 'Active', value: students.filter(s => s.is_active).length, icon: <IconGraduate size={14} /> },
            { label: 'Male', value: students.filter(s => s.gender === 'Male').length, icon: <IconMale size={14} /> },
            { label: 'Female', value: students.filter(s => s.gender === 'Female').length, icon: <IconFemale size={14} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="m-stat-cell">
              <div className="m-stat-icon">{icon}</div>
              <div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: '#fff', borderRadius: 13, border: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search by name or GR…" value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 14, color: T.text, flex: 1, background: 'transparent' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 0 }}><IconClose size={13} /></button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { value: filterStd, set: setFilterStd, placeholder: 'All standards', opts: uniqueOf('std').map(s => ({ v: s, l: `Std ${s}` })) },
            { value: filterClass, set: setFilterClass, placeholder: 'All sections', opts: uniqueOf('class_name').map(c => ({ v: c, l: `Sec ${c}` })) },
          ].map(({ value, set, placeholder, opts }, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <select value={value} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '10px 30px 10px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: '#fff', fontSize: 13, fontWeight: 600, color: T.text, appearance: 'none' }}>
                <option value="">{placeholder}</option>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <FaChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: T.muted }} />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
          {Object.keys(grouped).length} Class Group{Object.keys(grouped).length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Class group cards */}
      <div style={{ padding: '0 16px' }}>
        {Object.entries(grouped).map(([key, group]: [string, any]) => (
          <div key={key} className="m-group-card" onClick={() => { setActiveGroup(group); setMobileClassView(true); }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: T.text, margin: 0 }}>
                Std {group.std} — Section {group.class_name}
              </p>
              <p style={{ fontSize: 12, color: T.muted, fontWeight: 500, margin: '3px 0 0' }}>
                {group.shift} · {group.medium} · {group.students.length} students
              </p>
            </div>
            <div className="m-arrow-box">
              <FaChevronDown style={{ transform: 'rotate(-90deg)', fontSize: 12 }} />
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <FaUserGraduate size={32} color="#D1D5DB" />
            <p style={{ color: T.muted, fontSize: 14, margin: '10px 0 0', fontWeight: 500 }}>No students found</p>
          </div>
        )}
      </div>

      {/* Fullscreen class student list */}
      {mobileClassView && activeGroup && (
        <div className="m-fullscreen">
          <div className="m-fs-header">
            <button onClick={() => setMobileClassView(false)} style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <IconBack />
            </button>
            <div style={{ marginLeft: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                Class {activeGroup.std} — {activeGroup.class_name}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {activeGroup.students.length} students · {activeGroup.shift} · {activeGroup.medium}
              </p>
            </div>
          </div>
          <div className="m-fs-body">
            {activeGroup.students.map((s: any) => (
              <div key={s._id || s.id} className="m-student-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(s.first_name || 'A'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{initials(s.first_name, s.last_name)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{s.first_name} {s.last_name}</p>
                    <p style={{ fontSize: 11, color: T.muted, margin: '1px 0 0' }}>
                      Roll {s.roll_no} · <span style={{ color: genderColor(s.gender) }}>{s.gender}</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigate(`/admin/student-history/${s._id || s.id}`)} style={{ width: 32, height: 32, borderRadius: 8, background: `${T.primary}12`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.primary }}>
                    <FaHistory size={12} />
                  </button>
                  <button onClick={() => { setMobileClassView(false); openEdit(s); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.info }}>
                    <FaEdit size={12} />
                  </button>
                  <button onClick={() => handleDelete(s._id || s.id)} style={{ width: 32, height: 32, borderRadius: 8, background: T.dangerBg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.danger }}>
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  const DesktopView = () => (
    <>
      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.primary, margin: 0 }}>Students</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>Manage and organise all students in your school</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.size > 0 && (
            <button onClick={handleDeleteSelected} className="btn btn-danger-ghost btn-sm">
              <FaTrash size={11} /> Delete ({selected.size})
            </button>
          )}
          <button onClick={openBulk} className="btn btn-ghost">
            <FaPlus size={12} /> Bulk add
          </button>
          <button onClick={openAdd} className="btn btn-primary">
            <FaPlus size={12} /> Add student
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '22px 24px 40px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total students', value: students.length, sub: 'All enrolled', iconBg: `${T.primary}12`, icon: <IconUsers size={18} color={T.primary} /> },
            { label: 'Active', value: students.filter(s => s.is_active).length, sub: 'Currently active', iconBg: `${T.success}18`, icon: <IconGraduate size={18} /> },
            { label: 'Male', value: students.filter(s => s.gender === 'Male').length, sub: 'Students', iconBg: '#1d4ed815', icon: <IconMale size={18} /> },
            { label: 'Female', value: students.filter(s => s.gender === 'Female').length, sub: 'Students', iconBg: '#be185d15', icon: <IconFemale size={18} /> },
          ].map(({ label, value, sub, iconBg, icon }) => (
            <div key={label} className="stat-card">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: T.primary, margin: '4px 0 2px' }}>{value}</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{sub}</p>
              </div>
              <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="filter-bar" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaFilter size={12} color={T.primary} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Filters & search</p>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: `${T.primary}10`, border: `1.5px solid ${T.primary}`, borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8 }}>
            <input type="text" placeholder="Search by name or GR…" value={search} onChange={e => setSearch(e.target.value)} className="field field-sm" />
            {[
              { value: filterStd, set: setFilterStd, placeholder: 'All standards', opts: uniqueOf('std').map(s => ({ v: s, l: `Class ${s}` })) },
              { value: filterClass, set: setFilterClass, placeholder: 'All sections', opts: uniqueOf('class_name').map(c => ({ v: c, l: `Sec ${c}` })) },
              { value: filterShift, set: setFilterShift, placeholder: 'All shifts', opts: uniqueOf('shift').map(s => ({ v: s, l: s })) },
              { value: filterMedium, set: setFilterMedium, placeholder: 'All mediums', opts: uniqueOf('medium').map(m => ({ v: m, l: m })) },
            ].map(({ value, set, placeholder, opts }, i) => (
              <select key={i} value={value} onChange={e => set(e.target.value)} className="field field-sm">
                <option value="">{placeholder}</option>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ))}
          </div>
          {hasFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
              {[
                { label: `Class ${filterStd}`, show: !!filterStd, clear: () => setFilterStd('') },
                { label: `Section ${filterClass}`, show: !!filterClass, clear: () => setFilterClass('') },
                { label: filterShift, show: !!filterShift, clear: () => setFilterShift('') },
                { label: filterMedium, show: !!filterMedium, clear: () => setFilterMedium('') },
                { label: `"${search}"`, show: !!search, clear: () => setSearch('') },
              ].filter(b => b.show).map(({ label, clear }) => (
                <span key={label} className="chip" style={{ background: `${T.primary}10`, color: T.primary }}>
                  {label}
                  <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, display: 'flex' }}>
                    <IconClose size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Student groups */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FaUserGraduate size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 700, color: T.text, fontSize: 15, margin: '0 0 6px' }}>No students found</p>
            <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Try adjusting your filters or add a new student</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(grouped).map(([key, group]: [string, any]) => {
              const groupIds = group.students.map((s: any) => s._id || s.id);
              const allSel = groupIds.every((id: string) => selected.has(id));
              const someSel = groupIds.some((id: string) => selected.has(id));
              const isOpen = expandedGroups.has(key);
              return (
                <div key={key} className="card" style={{ overflow: 'hidden' }}>
                  <div className={`group-header${isOpen ? ' open' : ''}`} onClick={() => toggleGroup(key)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={allSel}
                        ref={el => { if (el) el.indeterminate = someSel && !allSel; }}
                        onChange={() => toggleGroupSelect(groupIds)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0, accentColor: T.primary }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: T.primary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Class {group.std} · Section {group.class_name} · {group.shift} · {group.medium}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{group.students.length} students</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {someSel && (
                        <button onClick={e => { e.stopPropagation(); handleDeleteSelected(); }} className="btn btn-danger-ghost btn-xs">
                          <FaTrash size={10} /> Delete ({groupIds.filter((id: string) => selected.has(id)).length})
                        </button>
                      )}
                      <FaChevronDown size={12} color={T.muted} className={`chevron${isOpen ? ' open' : ''}`} />
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="s-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}></th>
                            <th style={{ width: 60 }}>Roll</th>
                            <th>GR Number</th>
                            <th>Student</th>
                            <th>Gender</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.students.map((s: any) => {
                            const sid = s._id || s.id;
                            const isSel = selected.has(sid);
                            return (
                              <tr key={sid} className={isSel ? 'selected' : ''}>
                                <td>
                                  <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sid)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: T.primary }} />
                                </td>
                                <td><span style={{ fontWeight: 700, color: T.text }}>{s.roll_no}</span></td>
                                <td><span style={{ color: T.muted, fontFamily: 'monospace', fontSize: 11 }}>{s.gr_number}</span></td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(s.first_name || 'A'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{initials(s.first_name, s.last_name)}</span>
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 600, color: T.text, margin: 0, fontSize: 12 }}>{s.first_name} {s.last_name}</p>
                                      <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{s.phone1}</p>
                                    </div>
                                  </div>
                                </td>
                                <td><span style={{ fontSize: 12, color: genderColor(s.gender), fontWeight: 600 }}>{s.gender}</span></td>
                                <td>
                                  <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                                    {s.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
                                    {[
                                      { title: 'History', bg: `${T.primary}10`, color: T.primary, icon: <FaHistory size={11} />, onClick: () => navigate(`/admin/student-history/${sid}`) },
                                      { title: 'Edit', bg: `${T.info}10`, color: T.info, icon: <FaEdit size={11} />, onClick: () => openEdit(s) },
                                      { title: 'Delete', bg: T.dangerBg, color: T.danger, icon: <FaTrash size={11} />, onClick: () => handleDelete(sid) },
                                    ].map(({ title, bg, color, icon, onClick }) => (
                                      <button key={title} onClick={onClick} title={title} className="btn btn-icon" style={{ background: bg, color, border: 'none' }}>
                                        {icon}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="s-wrap">
      <GlobalStyles />
      {isMobile ? <MobileView /> : <DesktopView />}
      {showModal && <AddEditModal />}
      {showBulkModal && <BulkModal />}
    </div>
  );
};

export default Students;