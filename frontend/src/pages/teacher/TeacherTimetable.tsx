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

  // Resolve actual DB class_code by matching against all classes
  const resolveActualClassCode = async (rawCode: string, allClasses: any[]): Promise<string> => {
    const variants = getCodeVariants(rawCode);
    // Direct match first
    for (const v of variants) {
      const found = allClasses.find((c: any) => c.class_code === v);
      if (found) return found.class_code;
    }
    // Normalized match
    const targetNorm = normalizeCode(rawCode);
    const found = allClasses.find((c: any) => normalizeCode(c.class_code) === targetNorm);
    if (found) return found.class_code;
    // Return the shortest variant (most likely correct)
    return variants.sort((a, b) => a.length - b.length)[0] || rawCode;
  };

  // Fetch teacher's assigned class objects using multiple fallback strategies
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
      const medium = c.medium ? ` | ${c.medium}` : '';
      const stream = c.stream ? ` | ${c.stream}` : '';
      const shift = c.shift ? ` | ${c.shift}` : '';
      return `${c.class_code} (Std ${c.standard}-${c.division}${medium}${stream}${shift})`;
    }
    return c.class_code;
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (metaLoading) return <Spinner />;

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
        <p className="text-sm text-gray-500">View timetable for your assigned class</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-end gap-3 md:items-center md:justify-between flex-col md:flex-row">
          <div className="w-full md:w-80">
            <label className="block text-sm font-medium text-gray-700 mb-1">View Timetable (Class)</label>
            {classes.length === 0 ? (
              <p className="text-sm text-red-500 mt-1">No classes assigned. Please contact admin.</p>
            ) : (
              <select
                className="input-field"
                value={viewClassCode}
                onChange={(e) => {
                  const next = e.target.value;
                  setViewClassCode(next);
                  fetchViewTimetable(next);
                }}
              >
                <option value="">Select class</option>
                {classes.map((c: any) => (
                  <option key={c.class_code} value={c.class_code}>
                    {getClassLabel(c)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {viewLoading
                ? 'Loading timetable...'
                : viewTimetable
                ? `Showing: ${viewTimetable.class_code}`
                : 'No timetable selected'}
            </div>
            {viewClassCode && (
              <button
                onClick={() => fetchViewTimetable(viewClassCode)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {viewLoading ? (
            <div className="py-10"><Spinner /></div>
          ) : !viewTimetable ? (
            <div className="text-center py-10 text-gray-400">
              {viewClassCode
                ? 'No timetable found for this class. Admin needs to create it.'
                : 'Please select a class to view timetable.'}
            </div>
          ) : (
            <table className="min-w-full text-xs border border-gray-100">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 border-b border-gray-100 text-left whitespace-nowrap">Time / Period</th>
                  {days.map(d => (
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
    </div>
  );
};

export default TeacherTimetable;