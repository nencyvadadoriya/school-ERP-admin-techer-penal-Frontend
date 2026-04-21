import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaChevronDown, FaChevronRight, FaFilter } from 'react-icons/fa';
import { attendanceAPI, classAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { format } from 'date-fns';
import { CalendarCheck2, Users, TrendingUp, AlertCircle, Layout, CheckCircle, Circle } from 'lucide-react';
import StatCard from '../../components/StatCard';

const themeConfig = {
  primary: '#002B5B',
  secondary: '#2D54A8',
  accent: '#FFC107',
  success: '#10B981',
  warning: '#f59e0b',
  danger: '#EF4444',
  info: '#3b82f6',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filters, setFilters] = useState({ standard: '', medium: '', division: '', from: '', to: '' });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchClasses = async () => { try { const r = await classAPI.getAll(); setClasses(r.data.data || []); } catch { } };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.standard && filters.division && filters.medium) {
        const cls = classes.find(c => String(c.standard) === filters.standard && c.division === filters.division && c.medium === filters.medium);
        if (cls) params.class_code = `STD-${cls.standard}-${cls.division}-${cls.medium}-${cls.stream || 'NA'}-${cls.shift || 'NA'}`;
      }
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const r = await attendanceAPI.getAll(params);
      setRecords(r.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { const init = async () => { await fetchClasses(); fetchData(); }; init(); }, []);

  const standards = Array.from(new Set(classes.map(c => String(c.standard)))).sort((a, b) => Number(a) - Number(b));
  const mediums = Array.from(new Set(classes.map(c => c.medium))).filter(Boolean);
  const divisions = Array.from(new Set(classes.map(c => c.division))).filter(Boolean).sort();

  const parseClassCode = (cc: string) => { const p = cc.split('-'); return { standard: p[1], division: p[2], medium: p[3] }; };

  const groupedRecords = useMemo<Record<string, Record<string, Record<string, any[]>>>>(() => {
    const groups: Record<string, Record<string, Record<string, any[]>>> = {};
    records.forEach(record => {
      const cc = record.class_code, date = new Date(record.date);
      const mk = format(date, 'yyyy-MM'), dk = format(date, 'yyyy-MM-dd');
      if (!groups[cc]) groups[cc] = {};
      if (!groups[cc][mk]) groups[cc][mk] = {};
      if (!groups[cc][mk][dk]) groups[cc][mk][dk] = [];
      groups[cc][mk][dk].push(record);
    });
    return groups;
  }, [records]);

  const totalPresent = records.reduce((acc, r) => acc + (r.records?.filter((s: any) => s.status === 'Present' || s.status === 'Late').length || 0), 0);
  const totalAbsent = records.reduce((acc, r) => acc + (r.records?.filter((s: any) => s.status === 'Absent').length || 0), 0);
  const totalRec = totalPresent + totalAbsent;
  const rate = totalRec > 0 ? Math.round((totalPresent / totalRec) * 100) : 0;

  const totalDaysCount = useMemo<number>(() => {
    const classGroups = Object.values(groupedRecords) as Array<Record<string, Record<string, any[]>>>;
    return classGroups.reduce((a, cls) => {
      const months = Object.values(cls) as Array<Record<string, any[]>>;
      return a + months.reduce((b, m) => b + Object.keys(m).length, 0);
    }, 0);
  }, [groupedRecords]);

  const InputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-2xl font-black text-gray-900">Attendance Records</h1>
                <p className="text-sm text-gray-500 font-medium">View attendance class-wise, month-wise and day-wise</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Attendance</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">Student Activity Records</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                <CalendarCheck2 size={18} />
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isMobile ? 'mb-3 px-4' : 'mb-5'}`}>
          <StatCard
            title="Total Days"
            value={totalDaysCount}
            icon={CalendarCheck2}
            iconColor={themeConfig.primary}
            iconBg="rgba(0, 43, 91, 0.08)"
            subtitle="Academic"
          />
          <StatCard
            title="Avg Rate"
            value={`${rate}%`}
            icon={TrendingUp}
            iconColor={themeConfig.primary}
            iconBg="rgba(34, 77, 62, 0.08)"
            subtitle="Success"
          />
          <StatCard
            title="Total Absent"
            value={totalAbsent}
            icon={AlertCircle}
            iconColor={themeConfig.primary}
            iconBg="rgba(34, 77, 62, 0.08)"
            subtitle="Requires Review"
          />
        </div>

        {/* Filter Section */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-5 ${isMobile ? 'mx-4 p-3' : 'p-4'}`}>
          <div className="flex items-center gap-2 mb-3">
            <FaFilter size={11} className="text-primary-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Filter Records</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-1">
              <select className={InputCls} value={filters.standard} onChange={e => setFilters({ ...filters, standard: e.target.value })}>
                <option value="">Standard</option>
                {standards.map(s => <option key={s} value={s}>Class {s}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <select className={InputCls} value={filters.medium} onChange={e => setFilters({ ...filters, medium: e.target.value })}>
                <option value="">Medium</option>
                {mediums.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <select className={InputCls} value={filters.division} onChange={e => setFilters({ ...filters, division: e.target.value })}>
                <option value="">Division</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <input type="date" className={InputCls} value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div className="md:col-span-1">
              <input type="date" className={InputCls} value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div className="md:col-span-1">
              <button onClick={fetchData} className="w-full h-full flex items-center justify-center gap-2 py-2 rounded-xl text-white text-xs font-black active:scale-95 transition-all shadow-sm" style={{ background: themeConfig.primary }}>
                <FaSearch size={12} /> Search
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={`space-y-3 ${isMobile ? 'px-4 pb-10' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Spinner />
            </div>
          ) : Object.keys(groupedRecords).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gray-50 border border-gray-100">
                <CalendarCheck2 size={24} className="text-gray-300" />
              </div>
              <p className="text-xs font-black text-gray-700">No attendance records found</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Try adjusting your filters and search again</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.keys(groupedRecords).sort().map(classCode => {
                const cd = parseClassCode(classCode);
                const isExp = expandedClasses[classCode];
                const months = groupedRecords[classCode];
                const totalDays = Object.values(months).reduce((acc: number, m: any) => acc + Object.keys(m).length, 0);

                return (
                  <div key={classCode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <button onClick={() => setExpandedClasses(prev => ({ ...prev, [classCode]: !prev[classCode] }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
                          <Users size={15} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-gray-900">Class {cd.standard} - {cd.division}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{cd.medium} Medium</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 uppercase tracking-wider">{`${totalDays} Days`}</span>
                        <div className={`p-1 rounded-full transition-transform ${isExp ? 'rotate-180 bg-primary-50' : 'bg-gray-50'}`}>
                          <FaChevronDown size={8} className={isExp ? 'text-primary-600' : 'text-gray-400'} />
                        </div>
                      </div>
                    </button>

                    {isExp && (
                      <div className="bg-gray-50/50 divide-y divide-gray-100">
                        {Object.keys(months).sort().reverse().map(mk => {
                          const mDate = new Date(mk + '-01');
                          const cmk = `${classCode}-${mk}`;
                          const isMonthExp = expandedMonths[cmk];
                          const days = months[mk];
                          return (
                            <div key={mk}>
                              <button onClick={() => setExpandedMonths(prev => ({ ...prev, [cmk]: !prev[cmk] }))}
                                className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-white transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded-md transition-transform ${isMonthExp ? 'rotate-180' : ''}`}>
                                    <FaChevronDown size={7} className="text-gray-400" />
                                  </div>
                                  <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">{format(mDate, 'MMMM yyyy')}</span>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400">{Object.keys(days).length} Records</span>
                              </button>

                              {isMonthExp && Object.keys(days).sort().reverse().map(dk => {
                                const dDate = new Date(dk);
                                const cmdk = `${classCode}-${mk}-${dk}`;
                                const isDayExp = expandedDays[cmdk];
                                const dayRecs = days[dk];
                                const pCnt = dayRecs.reduce((a: number, r: any) => a + (r.records?.filter((s: any) => s.status === 'Present' || s.status === 'Late').length || 0), 0);
                                const aCnt = dayRecs.reduce((a: number, r: any) => a + (r.records?.filter((s: any) => s.status === 'Absent').length || 0), 0);
                                return (
                                  <div key={dk} className="bg-white/50 border-t border-gray-50">
                                    <button onClick={() => setExpandedDays(prev => ({ ...prev, [cmdk]: !prev[cmdk] }))}
                                      className="w-full flex items-center justify-between px-8 py-2 hover:bg-white transition-colors">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-0.5 rounded-full ${isDayExp ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-300'}`}>
                                          <FaChevronDown size={7} />
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-600">{format(dDate, 'do MMM (EEE)')}</span>
                                      </div>
                                      <div className="flex gap-3">
                                        <div className="flex items-center gap-1">
                                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                          <span className="text-[9px] font-black text-emerald-600 uppercase">P: {pCnt}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                                          <span className="text-[9px] font-black text-red-600 uppercase">A: {aCnt}</span>
                                        </div>
                                      </div>
                                    </button>

                                    {isDayExp && (
                                      <div className="px-8 pb-3">
                                        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                                          {dayRecs.map((att: any, idx: number) => (
                                            <div key={att._id || idx} className="overflow-x-auto">
                                              <table className="w-full text-left">
                                                <thead>
                                                  <tr className="bg-gray-50 border-b border-gray-100">
                                                    {['GR No.', 'Roll', 'Student Name', 'Status'].map(h => (
                                                      <th key={h} className="px-3 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                  {att.records?.map((rec: any, si: number) => (
                                                    <tr key={rec.student_id || si} className="hover:bg-gray-50/50 transition-colors group">
                                                      <td className="px-3 py-1.5 font-mono text-[9px] font-bold text-primary-600 group-hover:text-primary-700">{rec.gr_number || rec.gr_no || '-'}</td>
                                                      <td className="px-3 py-1.5 text-[9px] font-black text-gray-700">{rec.roll_no || rec.roll_number || '-'}</td>
                                                      <td className="px-3 py-1.5 text-[10px] font-bold text-gray-900">{rec.student_name || rec.name || 'N/A'}</td>
                                                      <td className="px-3 py-1.5">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                          rec.status === 'Late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-red-50 text-red-600 border border-red-100'
                                                          }`}>
                                                          {rec.status || 'Absent'}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
