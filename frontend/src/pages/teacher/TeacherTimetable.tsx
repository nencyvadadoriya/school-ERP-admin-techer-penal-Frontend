import React, { useState, useEffect } from 'react';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { timetableAPI, dashboardAPI, shiftBreakTimeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CalendarDays, RefreshCcw, ChevronDown, Clock, 
  BookOpen, User, Coffee, LayoutGrid
} from 'lucide-react';
import Spinner from '../../components/Spinner';

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
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
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
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-14 rounded-b-[32px] relative overflow-visible mb-4">
        <div className="relative z-10">
          <h1 className="text-xl font-black tracking-tight">Class Timetable</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Weekly Schedule Overview</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

        {/* Dropdown Integrated in Header for Mobile - Positioned to overlay the curve */}
        <div className="absolute -bottom-4 left-0 right-0 px-5 flex justify-center z-20">
          <div className="w-full max-w-[280px] relative">
            <select
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-100 shadow-xl text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer"
              value={viewClassCode}
              onChange={(e) => {
                setViewClassCode(e.target.value);
                fetchViewTimetable(e.target.value);
              }}
            >
              <option value="">Select a class...</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.class_code}>
                  {cls.class_code} (Std {cls.standard}-{cls.division})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6 md:mt-8 space-y-4">
        {/* Selection Card - Smaller for Mobile */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Select Class</label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
                  value={viewClassCode}
                  onChange={(e) => {
                    setViewClassCode(e.target.value);
                    fetchViewTimetable(e.target.value);
                  }}
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.class_code}>
                      {cls.class_code} (Std {cls.standard}-{cls.division})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Content */}
        {!viewClassCode ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
              <CalendarDays size={24} />
            </div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Select a class to view timetable</p>
          </div>
        ) : viewLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4 border-r border-gray-100">Time Slots</th>
                    {days.map(day => (
                      <th key={day} className="px-6 py-4 text-center">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {viewRows.map((row: any, idx: number) => (
                    <tr key={row.key || idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 border-r border-gray-100 bg-gray-50/10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 uppercase">
                            {row.type === 'break' ? 'Break' : `Slot ${row.period_number}`}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{row.start_time} - {row.end_time}</span>
                        </div>
                      </td>
                      {days.map(day => {
                        if (row.type === 'break') {
                          return (
                            <td key={day} className="px-4 py-4 text-center bg-gray-50/50">
                              <span className="text-[9px] font-bold text-gray-400 uppercase">Break</span>
                            </td>
                          );
                        }
                        const period = getCell(day, row);
                        return (
                          <td key={day} className="px-2 py-3 text-center">
                            {period ? (
                              <div className="p-2.5 rounded-lg bg-white border border-gray-100 space-y-1 group hover:border-blue-200 hover:shadow-sm transition-all text-center">
                                <p className="text-[11px] font-bold text-gray-700 uppercase leading-tight">{period.subject_code}</p>
                                <div className="flex items-center justify-center gap-1 text-[8px] font-medium text-gray-400 uppercase tracking-tighter">
                                  <span>Room {period.room_number || '—'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-100">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-50">
              {days.map(day => {
                const dayPeriods = viewRows.map(row => ({ row, period: row.type === 'break' ? null : getCell(day, row) }))
                  .filter(item => item.period || item.row.type === 'break');
                
                if (dayPeriods.length === 0) return null;

                return (
                  <div key={day} className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 rounded-full bg-[#002B5B]"></div>
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{day}</h3>
                    </div>
                    <div className="space-y-2">
                      {dayPeriods.map((item, idx) => (
                        <div key={idx} className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                          item.row.type === 'break' ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100 shadow-sm'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                              item.row.type === 'break' ? 'bg-blue-100 text-[#002B5B]' : 'bg-gray-50 text-[#002B5B]'
                            }`}>
                              {item.row.type === 'break' ? <Coffee size={12} /> : item.row.period_number}
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-gray-900 leading-tight uppercase">
                                {item.row.type === 'break' ? 'Recess Break' : item.period?.subject_code}
                              </p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                                <Clock size={8} /> {item.row.start_time} - {item.row.end_time}
                              </p>
                            </div>
                          </div>
                          {item.row.type !== 'break' && item.period?.room_number && (
                            <span className="text-[7px] font-black text-[#002B5B] bg-[#002B5B]/5 px-1.5 py-0.5 rounded-lg uppercase">
                              R-{item.period.room_number}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetable;