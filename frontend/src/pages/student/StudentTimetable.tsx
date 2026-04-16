import React, { useState, useEffect } from 'react';
import { timetableAPI, dashboardAPI, classAPI, shiftBreakTimeAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const toTimeStr = (s: any) => (s === undefined || s === null ? '' : String(s));

const timeToMinutes = (t: any) => {
  const s = toTimeStr(t);
  const m = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [shift, setShift] = useState<string>('');
  const [shiftBreakTimes, setShiftBreakTimes] = useState<any[]>([]);

  const fetchTimetable = async () => {
    try {
      // Get student's class_code from their own data or dashboard
      const classCode = user?.class_code;
      if (classCode) {
        const r = await timetableAPI.getByClass(classCode);
        setTimetable(r.data.data || null);
      }
    } catch (e: any) {
      console.error('Error fetching student timetable:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  useEffect(() => {
    const fetchShiftInfo = async () => {
      try {
        const classCode = user?.class_code;
        if (!classCode) return;

        try {
          const cR = await classAPI.getByCode(classCode);
          setShift(cR.data.data?.shift || '');
        } catch (e) {
          setShift('');
        }

        try {
          const bR = await shiftBreakTimeAPI.getAll();
          setShiftBreakTimes(bR.data.data || []);
        } catch (e) {
          setShiftBreakTimes([]);
        }
      } catch (e) {
        setShift('');
        setShiftBreakTimes([]);
      }
    };

    if (user) fetchShiftInfo();
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) return <Spinner />;

  const viewSchedule = Array.isArray(timetable?.schedule) ? timetable.schedule : [];
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

  const shiftBreak = shift ? shiftBreakTimes.find((x: any) => String(x.shift) === String(shift)) : null;
  const shiftBreakStart = toTimeStr(shiftBreak?.break_start_time);
  const shiftBreakEnd = toTimeStr(shiftBreak?.break_end_time);

  const buildViewRows = () => {
    const slots = [...viewSlots].sort((a: any, b: any) => Number(a?.period_number) - Number(b?.period_number));
    const rows: any[] = [];

    slots.forEach((slot: any) => {
      rows.push(slot);
      if (Number(slot?.period_number) === 3 && shiftBreakStart && shiftBreakEnd) {
        rows.push({
          key: `break-${shift}-${shiftBreakStart}-${shiftBreakEnd}`,
          type: 'break',
          start_time: shiftBreakStart,
          end_time: shiftBreakEnd,
        });
      }
    });

    if (slots.length > 0 && !slots.some((s: any) => Number(s?.period_number) === 3) && shiftBreakStart && shiftBreakEnd) {
      rows.push({
        key: `break-${shift}-${shiftBreakStart}-${shiftBreakEnd}`,
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
        <h1 className="text-2xl font-bold text-gray-900">My Class Timetable</h1>
        <p className="text-sm text-gray-500">Weekly schedule for your class: {user?.class_code || 'N/A'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {!timetable ? (
          <div className="text-center py-10 text-gray-400">No timetable found for your class</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-100">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 border-b border-gray-100 text-left whitespace-nowrap">Time / Period</th>
                  {days.map(d => <th key={d} className="px-3 py-2 border-b border-gray-100 text-left whitespace-nowrap">{d}</th>)}
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
                                  <div className="text-xs text-gray-500">{tname || '—'}</div>
                                </div>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
