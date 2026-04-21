import React, { useState, useEffect } from 'react';
import { timetableAPI, dashboardAPI, teacherAPI, classAPI, shiftBreakTimeAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const toTimeStr = (s: any) => (s === undefined || s === null ? '' : String(s));

const timeToMinutes = (t: any) => {
  const s = toTimeStr(t);
  const m = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

// Normalize: "STD-1-A-English-Primary-Morning" -> "1aenglish"
const normalizeCode = (s: string) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Build variants of a class code to handle format mismatches
const getCodeVariants = (code: string): string[] => {
  const s = String(code || '').trim();
  const variants = new Set<string>();
  variants.add(s);
  // Strip STD- prefix
  const noSTD = s.replace(/^STD-/i, '');
  variants.add(noSTD);
  // First 3 dash-segments (standard-division-medium)
  const parts = noSTD.split('-');
  if (parts.length > 3) {
    variants.add(parts.slice(0, 3).join('-'));
  }
  return Array.from(variants).filter(Boolean);
};

const TeacherTimetable: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [viewClassCode, setViewClassCode] = useState<string>('');
  const [viewTimetable, setViewTimetable] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<boolean>(false);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [shiftBreakTimes, setShiftBreakTimes] = useState<any[]>([]);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  const fetchAssignedClasses = async (): Promise<any[]> => {
    try {
      const dR = await dashboardAPI.teacher();
      const dashClasses = dR.data.data?.myClasses || [];
      return Array.isArray(dashClasses) ? dashClasses : [];
    } catch (e) {
      console.error('Failed to load assigned classes from dashboard:', e);
      return [];
    }
  };

  const fetchMeta = async () => {
    setMetaLoading(true);
    try {
      const classList = await fetchAssignedClasses();
      setClasses(classList);
      const firstCode = classList[0]?.class_code || '';
      if (firstCode) {
        setViewClassCode(firstCode);
        fetchViewTimetable(firstCode);
      }

      try {
        const bR = await shiftBreakTimeAPI.getAll();
        setShiftBreakTimes(bR.data.data || []);
      } catch (e) {
        setShiftBreakTimes([]);
      }
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMeta();
  }, [user]);

  const fetchViewTimetable = async (classCode: string) => {
    if (!classCode) { setViewTimetable(null); return; }
    setViewLoading(true);
    try {
      const r = await timetableAPI.getByClass(classCode);
      setViewTimetable(r.data.data || null);
    } catch (e: any) {
      console.error('Error fetching timetable:', e);
      setViewTimetable(null);
    } finally {
      setViewLoading(false);
    }
  };

  const getClassLabel = (c: any) => {
    if (!c) return '';
    if (c.standard && c.division) {
      return `${c.class_code} (Std ${c.standard}-${c.division})`;
    }
    return c.class_code;
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (metaLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
    </div>
  );

  const viewSchedule = Array.isArray(viewTimetable?.schedule) ? viewTimetable.schedule : [];
  const allPeriods: any[] = [];
  viewSchedule.forEach((d: any) => {
    (Array.isArray(d?.periods) ? d.periods : []).forEach((p: any) => allPeriods.push({ day: d.day, ...p }));
  });

  const getDayPeriodsSorted = (day: string) => {
    const d = viewSchedule.find((s: any) => String(s?.day) === String(day));
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
    const map = new Map<number, any>();
    days.forEach((d) => {
      getDayPeriodsSorted(d).forEach((p: any) => {
        const pn = Number(p?.period_number);
        if (!pn) return;
        const existing = map.get(pn);
        const st = toTimeStr(p?.start_time);
        const et = toTimeStr(p?.end_time);
        if (!existing) {
          map.set(pn, { key: `P${pn}`, period_number: pn, start_time: st, end_time: et });
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
  const selectedViewClass = classes.find((c: any) => c?.class_code === viewClassCode);
  const selectedShift = selectedViewClass?.shift || '';
  const shiftBreak = selectedShift ? shiftBreakTimes.find((x: any) => String(x.shift) === String(selectedShift)) : null;
  const shiftBreakStart = toTimeStr(shiftBreak?.break_start_time);
  const shiftBreakEnd = toTimeStr(shiftBreak?.break_end_time);

  const buildViewRows = () => {
    const slots = [...viewSlots].sort((a: any, b: any) => Number(a?.period_number) - Number(b?.period_number));
    const rows: any[] = [];
    slots.forEach((slot: any) => {
      rows.push(slot);
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

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Class Timetable</h1>
          <p className="text-[10px] font-medium text-gray-500">View timetable for your assigned classes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            className="w-full sm:w-64 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
            value={viewClassCode}
            onChange={(e) => {
              const next = e.target.value;
              setViewClassCode(next);
              fetchViewTimetable(next);
            }}
          >
            <option value="">Select Class</option>
            {classes.map((c: any) => (
              <option key={c.class_code} value={c.class_code}>
                {getClassLabel(c)}
              </option>
            ))}
          </select>
          {viewClassCode && (
            <button
              onClick={() => fetchViewTimetable(viewClassCode)}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-[11px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all active:scale-95"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {viewLoading ? (
            <div className="py-12 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-2" style={{ borderBottomColor: theme.primary }}></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : !viewTimetable ? (
            <div className="text-center py-12">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {viewClassCode ? 'No timetable found' : 'Select a class to view'}
              </p>
            </div>
          ) : (
            <table className="min-w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 font-black uppercase tracking-widest">
                  <th className="px-4 py-3 border-b border-gray-100 text-left whitespace-nowrap">Time / Period</th>
                  {days.map(d => (
                    <th key={d} className="px-4 py-3 border-b border-gray-100 text-left whitespace-nowrap">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {viewRows.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest">No periods found</td>
                  </tr>
                ) : (
                  viewRows.map((row: any) => {
                    if (row?.type === 'break') {
                      return (
                        <tr key={row.key} className="bg-blue-50/50">
                          <td className="px-4 py-3 whitespace-nowrap text-primary-700 font-black">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse"></span>
                              RECESS / BREAK
                            </div>
                            <div className="text-[9px] text-primary-500/70 font-bold mt-0.5">{row.start_time} - {row.end_time}</div>
                          </td>
                          {days.map((d: any) => (
                            <td key={d} className="px-4 py-3 text-primary-500 font-bold italic opacity-60">Break</td>
                          ))}
                        </tr>
                      );
                    }

                    const slot = row;
                    return (
                      <tr key={slot.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-black border-r border-gray-50">
                          <div className="text-gray-900">Period {slot.period_number}</div>
                          <div className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">{slot.start_time || '—'} - {slot.end_time || '—'}</div>
                        </td>
                        {days.map((d) => {
                          const cell = getCell(d, slot);
                          const subj = cell?.subject_name || cell?.subject_code;
                          const tname = cell?.teacher_name || cell?.teacher_code;
                          return (
                            <td key={d} className="px-4 py-3 align-top border-l border-gray-50 min-w-[140px]">
                              {cell ? (
                                <div className="space-y-0.5">
                                  <div className="font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-tight">{subj || '—'}</div>
                                  <div className="text-[10px] text-gray-500 font-bold opacity-70 uppercase tracking-tighter">{tname || '—'}</div>
                                </div>
                              ) : (
                                <span className="text-gray-200">—</span>
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
    </div>
  );
};

export default TeacherTimetable;