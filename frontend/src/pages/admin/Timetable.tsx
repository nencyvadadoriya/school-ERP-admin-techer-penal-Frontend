import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaClock, FaCalendarAlt, FaLayerGroup, FaSearch, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { classAPI, shiftBreakTimeAPI, subjectAPI, teacherAPI, timetableAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { Calendar, Clock, Layout, Users, BookOpen } from 'lucide-react';
import Spinner from '../../components/Spinner';

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

const EMPTY = {
  class_code: '',
  day: 'Monday',
  period_number: 1,
  start_time: '',
  end_time: '',
  subject: '',
  teacher_code: '',
};

const DAY_TIMING_EMPTY = {
  class_code: '',
  day: 'Monday',
  day_start_time: '',
  day_end_time: '',
  break_start_time: '',
  break_end_time: '',
};

const toTimeStr = (s: any) => (s === undefined || s === null ? '' : String(s));

const timeToMinutes = (t: any) => {
  const s = toTimeStr(t);
  const m = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

const Timetable: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [timingModalOpen, setTimingModalOpen] = useState<boolean>(false);
  const [timingForm, setTimingForm] = useState(DAY_TIMING_EMPTY);

  const [shiftBreakModalOpen, setShiftBreakModalOpen] = useState<boolean>(false);
  const [shiftBreakLoading, setShiftBreakLoading] = useState<boolean>(false);
  const [shiftBreakTimes, setShiftBreakTimes] = useState<any[]>([]);
  const [shiftBreakForm, setShiftBreakForm] = useState({
    shift: 'Morning',
    break_start_time: '',
    break_end_time: '',
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubjectChange = (subjectCode: string) => {
    const matchingTeachers = teachers.filter((t) => Array.isArray(t?.subjects) && t.subjects.includes(subjectCode));
    const autoTeacherCode = matchingTeachers.length > 0 ? matchingTeachers[0].teacher_code : '';
    
    setForm((prev) => ({
      ...prev,
      subject: subjectCode,
      teacher_code: autoTeacherCode,
    }));
  };

  const [viewClassCode, setViewClassCode] = useState<string>('');
  const [viewTimetable, setViewTimetable] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<boolean>(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const flattenTimetables = (timetables: any[]) => {
    const rows: any[] = [];
    (timetables || []).forEach((tt) => {
      const class_code = tt?.class_code;
      const schedule = Array.isArray(tt?.schedule) ? tt.schedule : [];
      schedule.forEach((d: any) => {
        const day = d?.day;
        const periods = Array.isArray(d?.periods) ? d.periods : [];
        periods.forEach((p: any) => {
          rows.push({
            _id: `${tt?._id || class_code}-${day}-${p?.period_number || ''}`,
            timetable_id: tt?._id,
            class_code,
            day,
            period: p?.period_number !== undefined && p?.period_number !== null ? String(p.period_number) : '',
            subject: p?.subject_code || p?.subject_name || '',
            teacher_code: p?.teacher_code || '',
            start_time: p?.start_time || '',
            end_time: p?.end_time || '',
          });
        });
      });
    });
    return rows;
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const closeTimingModal = () => {
    setTimingModalOpen(false);
  };

  const closeShiftBreakModal = () => {
    setShiftBreakModalOpen(false);
  };

  const buildTimetablePayloadFromForm = (ttId: any | undefined, f: any) => {
    const subject = subjects.find((s) => s.subject_code === f.subject);
    const teacher = teachers.find((t) => t.teacher_code === f.teacher_code);

    const shouldSendTimes = String(f.day) === 'Monday' || String(f.day) === 'Saturday';

    return {
      _id: ttId,
      class_code: f.class_code,
      schedule: [
        {
          day: f.day,
          periods: [
            {
              period_number: Number(f.period_number),
              start_time: shouldSendTimes ? toTimeStr(f.start_time) : undefined,
              end_time: shouldSendTimes ? toTimeStr(f.end_time) : undefined,
              subject_code: subject?.subject_code || f.subject || undefined,
              subject_name: subject?.subject_name,
              teacher_code: teacher?.teacher_code || f.teacher_code || undefined,
              teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined,
            },
          ],
        },
      ],
    };
  };

  const buildDayTimingPayload = (ttId: any | undefined, f: any) => {
    return {
      _id: ttId,
      class_code: f.class_code,
      schedule: [
        {
          day: f.day,
          day_start_time: toTimeStr(f.day_start_time),
          day_end_time: toTimeStr(f.day_end_time),
          break_start_time: toTimeStr(f.break_start_time),
          break_end_time: toTimeStr(f.break_end_time),
          periods: [],
        },
      ],
    };
  };

  const fetch = async () => {
    try {
      const r = await timetableAPI.getAll();
      setItems(flattenTimetables(r.data.data || []));
    } catch (e) {
      setItems([]);
    } finally { setLoading(false); }
  };

  const fetchViewTimetable = async (classCode: string) => {
    if (!classCode) {
      setViewTimetable(null);
      return;
    }
    setViewLoading(true);
    try {
      const r = await timetableAPI.getByClass(classCode);
      setViewTimetable(r.data.data || null);
    } catch (e: any) {
      setViewTimetable(null);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [cR, tR, sR] = await Promise.all([
        classAPI.getAll(),
        teacherAPI.getAll(),
        subjectAPI.getAll(),
      ]);
      setClasses(cR.data.data || []);
      setTeachers(tR.data.data || []);
      setSubjects(sR.data.data || []);
    } catch (e: any) {
      setClasses([]);
      setTeachers([]);
      setSubjects([]);
      toast.error(e?.response?.data?.message || 'Failed to load dropdown data');
    } finally {
      setMetaLoading(false);
    }
  };

  const fetchShiftBreakTimes = async () => {
    setShiftBreakLoading(true);
    try {
      const r = await shiftBreakTimeAPI.getAll();
      setShiftBreakTimes(r.data.data || []);
    } catch (e: any) {
      setShiftBreakTimes([]);
    } finally {
      setShiftBreakLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    fetchMeta();
    fetchShiftBreakTimes();
  }, []);

  useEffect(() => {
    if (!metaLoading && !viewClassCode && classes.length) {
      const defaultCode = getClassCode(classes[0]);
      setViewClassCode(defaultCode);
      fetchViewTimetable(defaultCode);
    }
  }, [metaLoading, classes]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openDayTiming = () => {
    setTimingForm((prev) => ({ ...DAY_TIMING_EMPTY, class_code: viewClassCode || prev.class_code }));
    setTimingModalOpen(true);
  };
  const openShiftBreak = () => {
    const existing = shiftBreakTimes.find((x) => String(x.shift) === String(shiftBreakForm.shift));
    setShiftBreakForm({
      shift: shiftBreakForm.shift,
      break_start_time: existing?.break_start_time || '',
      break_end_time: existing?.break_end_time || '',
    });
    setShiftBreakModalOpen(true);
  };
  const openEdit = (it: any) => {
    setEditing(it);
    setForm({
      class_code: it.class_code,
      day: it.day,
      period_number: Number(it.period),
      start_time: toTimeStr(it.start_time),
      end_time: toTimeStr(it.end_time),
      subject: it?.subject || '',
      teacher_code: it?.teacher_code || '',
    });
    setModalOpen(true);
  };

  const getClassCode = (c: any) => {
    if (!c) return '';
    if (c.class_code) return String(c.class_code);
    const parts = [c.standard, c.division, c.medium, c.stream, c.shift]
      .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
      .filter(Boolean);
    return parts.join('-');
  };

  const getClassLabel = (c: any) => {
    if (!c) return '';
    const code = getClassCode(c);
    const standard = c.standard ? String(c.standard) : '';
    const division = c.division ? String(c.division) : '';
    const medium = c.medium ? String(c.medium) : '';
    const stream = c.stream ? String(c.stream) : '';
    const shift = c.shift ? String(c.shift) : '';
    const meta = [standard && `Std ${standard}`, division && `Div ${division}`, medium, stream, shift]
      .filter(Boolean)
      .join(' | ');
    return meta ? `${code} (${meta})` : code;
  };

  const selectedClass = classes.find((c) => getClassCode(c) === form.class_code);
  const teacherOptions = form.subject
    ? teachers.filter((t) => Array.isArray(t?.subjects) && t.subjects.includes(form.subject))
    : teachers;

  const subjectOptionsRaw = selectedClass?.subjects?.length
    ? subjects.filter((s) => selectedClass.subjects.includes(s.subject_code))
    : subjects;

  const subjectOptions = subjectOptionsRaw.filter((s, idx, arr) => {
    const key = s?.subject_code || s?._id || s?.subject_name;
    return arr.findIndex((x) => (x?.subject_code || x?._id || x?.subject_name) === key) === idx;
  });

  const getSubjectLabelByCode = (code: any) => {
    if (!code) return '';
    const s = subjects.find((x) => x.subject_code === code);
    return s ? `${s.subject_name} (${s.subject_code})` : String(code);
  };

  const getTeacherLabelByCode = (code: any) => {
    if (!code) return '';
    const t = teachers.find((x) => x.teacher_code === code);
    return t ? `${t.first_name} ${t.last_name} (${t.teacher_code})` : String(code);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const needsTimes = String(form.day) === 'Monday' || String(form.day) === 'Saturday';
      if (needsTimes) {
        const st = timeToMinutes(form.start_time);
        const et = timeToMinutes(form.end_time);
        if (st === null || et === null) {
          toast.error('Please enter valid Start/End time');
          return;
        }
        if (et <= st) {
          toast.error('End Time must be greater than Start Time (use 24-hour time, e.g. 13:20)');
          return;
        }
      }

      const payload: any = buildTimetablePayloadFromForm(editing?.timetable_id, form);
      if (editing) {
        payload.old_day = editing.day;
        payload.old_period_number = Number(editing.period);
      }
      await timetableAPI.save(payload);
      toast.success(editing ? 'Timetable updated' : 'Timetable saved');
      closeModal();
      await fetch();
      if (viewClassCode) {
        await fetchViewTimetable(viewClassCode);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleTimingSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload: any = buildDayTimingPayload(viewTimetable?._id, timingForm);
      await timetableAPI.save(payload);
      toast.success('Day timing saved');
      closeTimingModal();
      await fetch();
      if (viewClassCode) {
        await fetchViewTimetable(viewClassCode);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleShiftBreakSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await shiftBreakTimeAPI.upsert({
        shift: String(shiftBreakForm.shift),
        break_start_time: toTimeStr(shiftBreakForm.break_start_time),
        break_end_time: toTimeStr(shiftBreakForm.break_end_time),
      });
      toast.success('Shift break time saved');
      closeShiftBreakModal();
      await fetchShiftBreakTimes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (it: any) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await timetableAPI.deleteEntry({
        class_code: it.class_code,
        day: it.day,
        period_number: Number(it.period)
      });
      toast.success('Entry deleted');
      await fetch();
      if (viewClassCode) {
        await fetchViewTimetable(viewClassCode);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error deleting entry');
    }
  };

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const viewSchedule = Array.isArray(viewTimetable?.schedule) ? viewTimetable.schedule : [];
  const allPeriods: any[] = [];
  viewSchedule.forEach((d: any) => {
    (Array.isArray(d?.periods) ? d.periods : []).forEach((p: any) => allPeriods.push({ day: d.day, ...p }));
  });

  const getDaySchedule = (day: string) => viewSchedule.find((s: any) => String(s?.day) === String(day));

  const getDayPeriodsSorted = (day: string) => {
    const d = getDaySchedule(day);
    const periods = Array.isArray(d?.periods) ? [...d.periods] : [];
    periods.sort((a: any, b: any) => {
      const sa = toTimeStr(a?.start_time);
      const sb = toTimeStr(b?.start_time);
      if (sa && sb && sa !== sb) return sa.localeCompare(sb);
      return Number(a?.period_number) - Number(b?.period_number);
    });
    return periods;
  };

  const getAllSlotsForView = () => {
    // Build one row per period_number.
    const map = new Map<number, any>();
    const mondayPeriods = getDayPeriodsSorted('Monday');

    mondayPeriods.forEach((p: any) => {
      const pn = Number(p?.period_number);
      if (!pn) return;
      map.set(pn, {
        key: `P${pn}`,
        period_number: pn,
        start_time: toTimeStr(p?.start_time),
        end_time: toTimeStr(p?.end_time),
      });
    });

    // Fill missing periods/times from other days
    days.forEach((d) => {
      getDayPeriodsSorted(d).forEach((p: any) => {
        const pn = Number(p?.period_number);
        if (!pn) return;
        const existing = map.get(pn);
        const st = toTimeStr(p?.start_time);
        const et = toTimeStr(p?.end_time);
        if (!existing) {
          map.set(pn, {
            key: `P${pn}`,
            period_number: pn,
            start_time: st,
            end_time: et,
          });
        } else {
          if (!existing.start_time && st) existing.start_time = st;
          if (!existing.end_time && et) existing.end_time = et;
        }
      });
    });

    const arr = Array.from(map.values());
    arr.sort((a: any, b: any) => Number(a.period_number) - Number(b.period_number));
    return arr;
  };

  const viewSlots = getAllSlotsForView();

  const selectedViewClass = classes.find((c) => getClassCode(c) === viewClassCode);
  const selectedShift = selectedViewClass?.shift || '';
  const shiftBreak = selectedShift ? shiftBreakTimes.find((x) => String(x.shift) === String(selectedShift)) : null;
  const shiftBreakStart = toTimeStr(shiftBreak?.break_start_time);
  const shiftBreakEnd = toTimeStr(shiftBreak?.break_end_time);

  const buildViewRows = () => {
    const slots = [...viewSlots].sort((a: any, b: any) => Number(a?.period_number) - Number(b?.period_number));
    const rows: any[] = [];

    slots.forEach((slot: any) => {
      rows.push(slot);
      // Insert break after period 3
      if (Number(slot?.period_number) === 3 && shiftBreakStart && shiftBreakEnd) {
        rows.push({
          key: `break-${selectedShift}-${shiftBreakStart}-${shiftBreakEnd}`,
          type: 'break',
          start_time: shiftBreakStart,
          end_time: shiftBreakEnd,
        });
      }
    });

    if (slots.length > 0 && !slots.some((s: any) => Number(s?.period_number) === 3) && shiftBreakStart && shiftBreakEnd) {
      rows.push({
        key: `break-${selectedShift}-${shiftBreakStart}-${shiftBreakEnd}`,
        type: 'break',
        start_time: shiftBreakStart,
        end_time: shiftBreakEnd,
      });
    }

    return rows;
  };

  const viewRows = buildViewRows();

  const getCell = (day: string, slot: any) => {
    return allPeriods.find((p: any) => {
      if (String(p.day) !== String(day)) return false;
      return Number(p.period_number) === Number(slot.period_number);
    });
  };

  const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all";

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0 pb-20' : 'p-6'}>
        
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
           
              <div>
                <h1 className="text-2xl font-black text-gray-900">Timetable Management</h1>
                <p className="text-sm text-gray-500 font-medium">Manage class-wise dynamic periods and timings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={openShiftBreak} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                <Clock size={14} className="text-gray-500" /> Set Shift Break
              </button>
              <button onClick={openDayTiming} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                <Calendar size={14} className="text-gray-500" /> Set Day Timing
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white shadow-sm border-b border-gray-100 mb-3 overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ background: themeConfig.primary }}>
              <div>
                <h2 className="text-base font-extrabold text-white">Timetable</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">Dynamic Class Schedule</p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex flex-col gap-4 ${isMobile ? 'pb-10 p-2' : ''}`}>
          {/* Mobile Search & Actions */}
          {isMobile && (
            <div className="flex flex-col gap-2">
              <button onClick={openAdd} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 hover:brightness-110 transition-all w-full" style={{ background: themeConfig.primary }}>
                <FaPlus size={12} /> Add Entry
              </button>
              <div className="relative flex-1">
                <select
                  className={`${inputCls} !py-2 shadow-sm bg-white text-[10px]`}
                  value={viewClassCode}
                  onChange={(e) => {
                    const next = e.target.value;
                    setViewClassCode(next);
                    fetchViewTimetable(next);
                  }}
                  disabled={metaLoading}
                >
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                      {getClassLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Main View Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {!isMobile && (
              <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                    <Layout size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Schedule Viewer</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{viewLoading ? 'Loading...' : viewTimetable ? `Class: ${viewTimetable.class_code}` : 'Select a class'}</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 hover:brightness-110 transition-all whitespace-nowrap" style={{ background: themeConfig.primary }}>
                    <FaPlus size={12} /> Add Entry
                  </button>
                  <div className="w-full md:w-80">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                      <select
                        className={`${inputCls} !pl-10 !py-2.5 shadow-sm bg-white`}
                        value={viewClassCode}
                        onChange={(e) => {
                          const next = e.target.value;
                          setViewClassCode(next);
                          fetchViewTimetable(next);
                        }}
                        disabled={metaLoading}
                      >
                        <option value="">Select class to view...</option>
                        {classes.map((c) => (
                          <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                            {getClassLabel(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={isMobile ? 'p-2' : 'overflow-x-auto custom-scrollbar'}>
              {viewLoading ? (
                <div className="py-10 flex justify-center"><Spinner /></div>
              ) : !viewTimetable ? (
                <div className="py-10 text-center">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No timetable selected</p>
                </div>
              ) : isMobile ? (
                /* Mobile optimized layout - Side-by-side days */
                <div className="grid grid-cols-2 gap-2 p-2">
                  {days.map((day, dayIdx) => (
                    <div key={day} className="border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                      <div className="bg-gray-50 px-2 py-1.5 border-b border-gray-100 flex justify-center items-center">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{day}</span>
                      </div>
                      <div className="divide-y divide-gray-50 flex-1">
                        {viewRows.map((row: any) => {
                          if (row?.type === 'break') {
                            return (
                              <div key={`${day}-${row.key}`} className="px-2 py-1 bg-gray-50/30 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">RECESS</span>
                                <span className="text-[7px] font-bold text-gray-400 leading-none">{row.start_time}</span>
                              </div>
                            );
                          }
                          const cell = getCell(day, row);
                          if (!cell) return null;
                          return (
                            <div key={`${day}-${row.key}`} className="px-2 py-2 flex flex-col">
                              <div className="flex justify-between items-center mb-1">
                                {dayIdx % 2 === 0 && (
                                  <span className="text-[9px] font-black text-primary-600">P{row.period_number}</span>
                                )}
                                <span className={`text-[7px] font-bold text-gray-400 ${dayIdx % 2 !== 0 ? 'ml-auto' : ''}`}>{row.start_time}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-medium text-gray-800 truncate leading-tight" title={cell?.subject_name || cell?.subject_code}>
                                  {cell?.subject_name || cell?.subject_code}
                                </div>
                                <div className="flex items-center gap-0.5 mt-1">
                                  <Users size={7} className="text-gray-300 flex-shrink-0" />
                                  <div className="text-[8px] font-medium text-gray-400 truncate">{cell?.teacher_name || cell?.teacher_code}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-white z-10 border-r border-gray-100 min-w-[100px]">Time / Period</th>
                      {days.map((d) => (
                        <th key={d} className="px-4 py-4 text-left text-[10px] font-black text-gray-700 uppercase tracking-widest min-w-[140px] border-l border-gray-100">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewRows.length === 0 ? (
                      <tr>
                        <td colSpan={days.length + 1} className="py-20 text-center text-gray-400 font-bold italic uppercase tracking-widest">No periods added yet</td>
                      </tr>
                    ) : (
                      viewRows.map((row: any) => {
                        if (row?.type === 'break') {
                          return (
                            <tr key={row.key} className="bg-gray-50">
                              <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                                <div className="text-[10px] font-black text-gray-700 uppercase flex items-center gap-1.5"><Clock size={10} /> BREAK</div>
                                <div className="text-[9px] font-bold text-gray-500 mt-0.5">{row.start_time} - {row.end_time}</div>
                              </td>
                              {days.map((d: any) => (
                                <td key={d} className="px-4 py-3 border-l border-gray-100">
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Recess</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        }

                        const slot = row;
                        return (
                          <tr key={slot.key} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100">
                              <div className="text-[10px] font-black text-gray-800 uppercase">Period {slot.period_number}</div>
                              <div className="text-[9px] font-bold text-gray-400 mt-1">{slot.start_time || '—'} - {slot.end_time || '—'}</div>
                            </td>
                            {days.map((d) => {
                              const cell = getCell(d, slot);
                              const subj = cell?.subject_name || cell?.subject_code;
                              const tname = cell?.teacher_name || cell?.teacher_code;
                              return (
                                <td key={d} className="px-4 py-4 border-l border-gray-100 align-top min-w-[140px]">
                                  {cell ? (
                                    <div className={`bg-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all group cursor-default`}>
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></div>
                                        <div className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} font-medium text-gray-800 truncate group-hover:text-gray-900 transition-colors`}>{subj || '—'}</div>
                                      </div>
                                      <div className={`flex items-center gap-1 pl-2.5`}>
                                        <Users size={isMobile ? 8 : 9} className="text-gray-300" />
                                        <div className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-medium text-gray-400 truncate`}>{tname || '—'}</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center opacity-20 py-4">
                                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* All Entries Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className={`p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between ${isMobile ? 'p-3' : 'p-5'}`}>
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-gray-100 flex items-center justify-center text-gray-600`}>
                  <BookOpen size={isMobile ? 16 : 20} />
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black text-gray-800 uppercase tracking-widest`}>Global Entries</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{items.length} Total Assignments</p>
                </div>
              </div>
            </div>
            <div className={isMobile ? 'p-1.5' : 'overflow-x-auto custom-scrollbar'}>
              {isMobile ? (
                /* Mobile optimized Grid for Global Entries */
                items.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 font-bold italic uppercase tracking-widest text-[9px]">No entries found</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map(it => (
                      <div key={it._id} className="p-2 bg-gray-50/50 rounded-lg border border-gray-100 flex flex-col justify-between gap-1.5 relative pt-4">
                        <div className="absolute top-1 left-1.5">
                          <span className="text-[8px] font-black text-gray-800">#{it.period}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1 mt-1">
                            <span className="text-[8px]  text-primary-700 px-1 py-0.5 rounded border border-primary-100 tracking-tighter">
                              {getClassCode({ class_code: it.class_code })}
                            </span>
                          </div>
                          <div className="text-[7px] font-bold text-gray-500 uppercase mb-0.5">{it.day?.substring(0, 3)}</div>
                          <div className="text-[9px] font-medium text-gray-800 truncate leading-tight mb-1">{getSubjectLabelByCode(it.subject) || it.subject}</div>
                          <div className="flex items-center gap-1">
                            <Clock size={7} className="text-gray-300" />
                            <span className="text-[7px] font-medium text-gray-400">{it.start_time || '—'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 pt-1 border-t border-gray-100">
                          <button onClick={()=>openEdit(it)} className="flex-1 h-6 rounded bg-white text-gray-600 border border-gray-100 flex items-center justify-center shadow-xs active:scale-90 transition-transform"><FaEdit size={9} /></button>
                          <button onClick={()=>handleDelete(it)} className="flex-1 h-6 rounded bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shadow-xs active:scale-90 transition-transform"><FaTrash size={9} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    {(isMobile ? ['Class', 'Day', 'Period', 'Sub', 'Act'] : ['Class', 'Day', 'Period', 'Time', 'Subject', 'Teacher', 'Actions']).map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest ${isMobile ? 'px-2' : 'px-6 py-4'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-bold italic uppercase tracking-widest">No entries found</td>
                    </tr>
                  ) : (
                    items.map(it => (
                      <tr key={it._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className={`px-4 py-3 ${isMobile ? 'px-2' : 'px-6 py-4'}`}>
                          <p className="text-[9px] font-black text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-lg border border-gray-200 inline-block uppercase tracking-tighter">
                            {getClassCode({ class_code: it.class_code })}
                          </p>
                        </td>
                        <td className={`px-4 py-3 text-[9px] font-bold text-gray-700 ${isMobile ? 'px-2' : 'px-6 py-4'}`}>{it.day?.substring(0, 3) || '—'}</td>
                        <td className={`px-4 py-3 ${isMobile ? 'px-2' : 'px-6 py-4'}`}>
                          <span className="text-[9px] font-black text-gray-800">#{it.period}</span>
                        </td>
                        {!isMobile && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              <Clock size={12} className="text-gray-300" />
                              {it.start_time && it.end_time ? `${it.start_time} - ${it.end_time}` : '—'}
                            </div>
                          </td>
                        )}
                        <td className={`px-4 py-3 text-[9px] font-black text-gray-800 ${isMobile ? 'px-2' : 'px-6 py-4'}`}>
                          <div className="truncate max-w-[60px]" title={it.subject}>
                            {it.subject?.substring(0, 10) || '—'}
                          </div>
                        </td>
                        {!isMobile && (
                          <td className="px-6 py-4 text-xs font-bold text-gray-500">
                            {it.teacher_code ? getTeacherLabelByCode(it.teacher_code) : '—'}
                          </td>
                        )}
                        <td className={`px-4 py-3 text-right ${isMobile ? 'px-2' : 'px-6 py-4'}`}>
                          <div className="flex gap-1">
                            <button onClick={()=>openEdit(it)} className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><FaEdit size={10} /></button>
                            <button onClick={()=>handleDelete(it)} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><FaTrash size={10} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Entry Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Timetable Entry' : 'Add New Entry'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Class Selection *</label>
              <select
                className={inputCls}
                required
                value={form.class_code}
                onChange={(e) => {
                  const nextClass = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    class_code: nextClass,
                    subject: '',
                    teacher_code: prev.teacher_code,
                  }));
                }}
                disabled={metaLoading || Boolean(editing)}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                    {getClassLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Academic Day *</label>
              <select
                className={inputCls}
                value={form.day}
                onChange={(e) => {
                  const nextDay = e.target.value;
                  setForm((prev) => {
                    const keepTimes = String(nextDay) === 'Monday' || String(nextDay) === 'Saturday';
                    return {
                      ...prev,
                      day: nextDay,
                      start_time: keepTimes ? prev.start_time : '',
                      end_time: keepTimes ? prev.end_time : '',
                    };
                  });
                }}
                disabled={Boolean(editing)}
              >
                {days.map(d=> <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Period Number *</label>
              <input
                type="number"
                className={inputCls}
                min={1}
                value={form.period_number}
                onChange={(e) => setForm({ ...form, period_number: Number(e.target.value) })}
                required
              />
            </div>
            {(String(form.day) === 'Monday' || String(form.day) === 'Saturday') ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Start Time</label>
                  <input type="time" className={inputCls} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">End Time</label>
                  <input type="time" className={inputCls} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
                </div>
              </div>
            ) : (
              <div className="flex items-center pt-5">
                <div className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-gray-100 flex items-center gap-2">
                  <Clock size={14} /> Times inherited from Monday
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject *</label>
              <select
                className={inputCls}
                value={form.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={metaLoading}
                required
              >
                <option value="">Select subject</option>
                {subjectOptions.map((s) => (
                  <option key={s._id} value={s.subject_code}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Assign Teacher *</label>
              <select
                className={inputCls}
                value={form.teacher_code}
                onChange={(e) => setForm({ ...form, teacher_code: e.target.value })}
                disabled={metaLoading}
                required
              >
                <option value="">Select teacher</option>
                {teacherOptions.map((t) => (
                  <option key={t._id} value={t.teacher_code}>
                    {t.first_name} {t.last_name} ({t.teacher_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md" style={{ background: themeConfig.primary }}>{editing ? 'Update Entry' : 'Save Entry'}</button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Timing Modal */}
      <Modal isOpen={timingModalOpen} onClose={closeTimingModal} title="Set Day Timing">
        <form onSubmit={handleTimingSubmit} className="space-y-4 p-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Class *</label>
              <select className={inputCls} required value={timingForm.class_code} onChange={(e) => setTimingForm((p) => ({ ...p, class_code: e.target.value }))} disabled={metaLoading}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                    {getClassLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Day *</label>
              <select className={inputCls} value={timingForm.day} onChange={(e) => setTimingForm((p) => ({ ...p, day: e.target.value }))}>
                {days.map(d=> <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Start Time</label>
              <input type="time" className={inputCls} value={timingForm.day_start_time} onChange={(e) => setTimingForm((p) => ({ ...p, day_start_time: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">End Time</label>
              <input type="time" className={inputCls} value={timingForm.day_end_time} onChange={(e) => setTimingForm((p) => ({ ...p, day_end_time: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break Start</label>
              <input type="time" className={inputCls} value={timingForm.break_start_time} onChange={(e) => setTimingForm((p) => ({ ...p, break_start_time: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break End</label>
              <input type="time" className={inputCls} value={timingForm.break_end_time} onChange={(e) => setTimingForm((p) => ({ ...p, break_end_time: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md" style={{ background: themeConfig.primary }}>Save Timing</button>
            <button type="button" onClick={closeTimingModal} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Shift Break Modal */}
      <Modal isOpen={shiftBreakModalOpen} onClose={closeShiftBreakModal} title="Set Global Shift Break">
        <form onSubmit={handleShiftBreakSubmit} className="space-y-4 p-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shift *</label>
            <select className={inputCls} required value={shiftBreakForm.shift} onChange={(e) => setShiftBreakForm((p) => ({ ...p, shift: e.target.value }))}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break Start</label>
              <input type="time" className={inputCls} value={shiftBreakForm.break_start_time} onChange={(e) => setShiftBreakForm((p) => ({ ...p, break_start_time: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break End</label>
              <input type="time" className={inputCls} value={shiftBreakForm.break_end_time} onChange={(e) => setShiftBreakForm((p) => ({ ...p, break_end_time: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md" style={{ background: themeConfig.primary }}>Save Break</button>
            <button type="button" onClick={closeShiftBreakModal} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Timetable;