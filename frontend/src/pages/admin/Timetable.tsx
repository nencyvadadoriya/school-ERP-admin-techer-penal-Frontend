import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { classAPI, shiftBreakTimeAPI, subjectAPI, teacherAPI, timetableAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

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

  if (loading) return <Spinner />;

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
    // Prefer Monday's time for consistency across the week (weekly default).
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

    // If there are no slots or period 3 doesn't exist, still append break as standalone (if configured)
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-500">Manage timetables for classes (day-wise dynamic periods & timings)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openShiftBreak} className="btn-secondary flex items-center gap-2">Set Shift Break</button>
          <button onClick={openDayTiming} className="btn-secondary flex items-center gap-2">Set Day Timing</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><FaPlus />Add Entry</button>
        </div>
      </div>

    

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="w-full md:w-80">
            <label className="block text-sm font-medium text-gray-700 mb-1">View Timetable (Class)</label>
            <select
              className="input-field"
              value={viewClassCode}
              onChange={(e) => {
                const next = e.target.value;
                setViewClassCode(next);
                fetchViewTimetable(next);
              }}
              disabled={metaLoading}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                  {getClassLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            {viewLoading ? 'Loading timetable...' : viewTimetable ? `Showing: ${viewTimetable.class_code}` : 'No timetable selected'}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {viewLoading ? (
            <div className="py-10"><Spinner /></div>
          ) : !viewTimetable ? (
            <div className="text-center py-10 text-gray-400">No timetable found for this class</div>
          ) : (
            <table className="min-w-full text-xs border border-gray-100">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 border-b border-gray-100 text-left whitespace-nowrap">Time / Period</th>
                  {days.map((d) => (
                    <th key={d} className="px-3 py-2 border-b border-gray-100 text-left whitespace-nowrap">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewRows.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="text-center py-10 text-gray-400">No periods added yet</td>
                  </tr>
                ) : (
                  viewRows.map((row: any) => {
                    if (row?.type === 'break') {
                      return (
                        <tr key={row.key} className="bg-blue-50">
                          <td className="px-3 py-2 whitespace-nowrap text-gray-700 font-medium">
                            <div>BREAK</div>
                            <div className="text-xs text-gray-500">{row.start_time} - {row.end_time}</div>
                          </td>
                          {days.map((d: any) => (
                            <td key={d} className="px-3 py-2 text-blue-600 text-sm">Break</td>
                          ))}
                        </tr>
                      );
                    }

                    const slot = row;
                    return (
                      <tr key={slot.key} className="border-t border-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700 font-medium">
                          <div>Period {slot.period_number}</div>
                          <div className="text-xs text-gray-400">{slot.start_time || '—'} - {slot.end_time || '—'}</div>
                        </td>
                        {days.map((d) => {
                          const cell = getCell(d, slot);
                          const subj = cell?.subject_name || cell?.subject_code;
                          const tname = cell?.teacher_name || cell?.teacher_code;
                          return (
                            <td key={d} className="px-3 py-2 align-top border-l border-gray-50 min-w-[160px]">
                              {cell ? (
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-900">{subj || '—'}</div>
                                  <div className="text-gray-500 text-xs">{tname || '—'}</div>
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="pb-3 font-medium">Class</th>
                <th className="pb-3 font-medium">Day</th>
                <th className="pb-3 font-medium">Period</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Teacher</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No timetable entries</td></tr>
              ) : (
                items.map(it => {
                  return (
                    <tr key={it._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium text-primary-600">
                        {getClassLabel(classes.find((c) => getClassCode(c) === it.class_code) || { class_code: it.class_code })}
                      </td>
                      <td className="py-3">{it.day || '—'}</td>
                      <td className="py-3">{it.period || '—'}</td>
                      <td className="py-3 text-xs text-gray-500">
                        {it.start_time && it.end_time ? `${it.start_time} - ${it.end_time}` : '—'}
                      </td>
                      <td className="py-3">{getSubjectLabelByCode(it.subject) || it.subject || '—'}</td>
                      <td className="py-3">{it.teacher_code ? getTeacherLabelByCode(it.teacher_code) : '—'}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={()=>openEdit(it)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                          <button onClick={()=>handleDelete(it)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Entry' : 'Add Timetable Entry'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
              <select
                className="input-field"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                className="input-field"
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
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=> <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Number</label>
              <input
                type="number"
                className="input-field"
                min={1}
                value={form.period_number}
                onChange={(e) => setForm({ ...form, period_number: Number(e.target.value) })}
                required
              />
            </div>
            {(String(form.day) === 'Monday' || String(form.day) === 'Saturday') ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mt-1">
                  Start/End time will be inherited from Monday for this period.
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="input-field"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code</label>
              <select
                className="input-field"
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
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save</button>
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={timingModalOpen} onClose={closeTimingModal} title="Set Day Timing (Short Day Support)">
        <form onSubmit={handleTimingSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
              <select
                className="input-field"
                required
                value={timingForm.class_code}
                onChange={(e) => setTimingForm((p) => ({ ...p, class_code: e.target.value }))}
                disabled={metaLoading}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id || getClassCode(c)} value={getClassCode(c)}>
                    {getClassLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                className="input-field"
                value={timingForm.day}
                onChange={(e) => setTimingForm((p) => ({ ...p, day: e.target.value }))}
              >
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=> <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Start Time</label>
              <input
                type="time"
                className="input-field"
                value={timingForm.day_start_time}
                onChange={(e) => setTimingForm((p) => ({ ...p, day_start_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School End Time</label>
              <input
                type="time"
                className="input-field"
                value={timingForm.day_end_time}
                onChange={(e) => setTimingForm((p) => ({ ...p, day_end_time: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break Start (optional)</label>
              <input
                type="time"
                className="input-field"
                value={timingForm.break_start_time}
                onChange={(e) => setTimingForm((p) => ({ ...p, break_start_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break End (optional)</label>
              <input
                type="time"
                className="input-field"
                value={timingForm.break_end_time}
                onChange={(e) => setTimingForm((p) => ({ ...p, break_end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save</button>
            <button type="button" onClick={closeTimingModal} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={shiftBreakModalOpen} onClose={closeShiftBreakModal} title="Set Permanent Break Time (Shift Wise)">
        <form onSubmit={handleShiftBreakSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select
                className="input-field"
                value={shiftBreakForm.shift}
                onChange={(e) => {
                  const nextShift = e.target.value;
                  const existing = shiftBreakTimes.find((x) => String(x.shift) === String(nextShift));
                  setShiftBreakForm({
                    shift: nextShift,
                    break_start_time: existing?.break_start_time || '',
                    break_end_time: existing?.break_end_time || '',
                  });
                }}
                required
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
              </select>
              <div className="text-[11px] text-gray-500 mt-1">
                {shiftBreakLoading ? 'Loading saved break times...' : null}
              </div>
            </div>
            <div />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break Start Time</label>
              <input
                type="time"
                className="input-field"
                value={shiftBreakForm.break_start_time}
                onChange={(e) => setShiftBreakForm((p) => ({ ...p, break_start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break End Time</label>
              <input
                type="time"
                className="input-field"
                value={shiftBreakForm.break_end_time}
                onChange={(e) => setShiftBreakForm((p) => ({ ...p, break_end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save</button>
            <button type="button" onClick={closeShiftBreakModal} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Timetable;