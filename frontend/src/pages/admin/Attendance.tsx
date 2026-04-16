import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { attendanceAPI, classAPI } from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  const [filters, setFilters] = useState<{ 
    standard: string; 
    medium: string; 
    division: string;
    from: string; 
    to: string 
  }>({ standard: '', medium: '', division: '', from: '', to: '' });

  const fetchClasses = async () => {
    try {
      const res = await classAPI.getAll();
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (filters.standard && filters.division && filters.medium) {
        const cls = classes.find(c => 
          String(c.standard) === filters.standard && 
          c.division === filters.division && 
          c.medium === filters.medium
        );
        if (cls) {
          params.class_code = `STD-${cls.standard}-${cls.division}-${cls.medium}-${cls.stream || 'NA'}-${cls.shift || 'NA'}`;
        }
      }

      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const r = await attendanceAPI.getAll(params);
      setRecords(r.data.data || []);
    } catch(e){
      console.error('Error fetching attendance:', e);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchClasses();
      fetch();
    };
    init();
  }, []);

  const standards = Array.from(new Set(classes.map(c => String(c.standard)))).sort((a, b) => Number(a) - Number(b));
  const mediums = Array.from(new Set(classes.map(c => c.medium))).filter(Boolean);
  const divisions = Array.from(new Set(classes.map(c => c.division))).filter(Boolean).sort();

  const parseClassCode = (classCode: string) => {
    const parts = classCode.split('-');
    return {
      standard: parts[1],
      division: parts[2],
      medium: parts[3],
      stream: parts[4],
      shift: parts[5]
    };
  };

  // Group records by class -> month -> day
  const groupedRecords = useMemo(() => {
    const groups: any = {};

    records.forEach(record => {
      const classCode = record.class_code;
      const date = new Date(record.date);
      const monthKey = format(date, 'yyyy-MM');
      const dayKey = format(date, 'yyyy-MM-dd');

      if (!groups[classCode]) groups[classCode] = {};
      if (!groups[classCode][monthKey]) groups[classCode][monthKey] = {};
      if (!groups[classCode][monthKey][dayKey]) groups[classCode][monthKey][dayKey] = [];
      
      groups[classCode][monthKey][dayKey].push(record);
    });

    return groups;
  }, [records]);

  const toggleClass = (classCode: string) => {
    setExpandedClasses(prev => ({ ...prev, [classCode]: !prev[classCode] }));
  };

  const toggleMonth = (classMonthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [classMonthKey]: !prev[classMonthKey] }));
  };

  const toggleDay = (classMonthDayKey: string) => {
    setExpandedDays(prev => ({ ...prev, [classMonthDayKey]: !prev[classMonthDayKey] }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-sm text-gray-500">View and manage student attendance class-wise, month-wise and day-wise</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
          <select 
            className="input-field" 
            value={filters.standard} 
            onChange={e => setFilters({ ...filters, standard: e.target.value })}
          >
            <option value="">Standard</option>
            {standards.map(s => <option key={s} value={s}>Class {s}</option>)}
          </select>

          <select 
            className="input-field" 
            value={filters.medium} 
            onChange={e => setFilters({ ...filters, medium: e.target.value })}
          >
            <option value="">Medium</option>
            {mediums.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            className="input-field" 
            value={filters.division} 
            onChange={e => setFilters({ ...filters, division: e.target.value })}
          >
            <option value="">Division</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <input 
            type="date" 
            className="input-field" 
            value={filters.from} 
            onChange={e=>setFilters({...filters,from:e.target.value})} 
            placeholder="From Date"
          />
          <input 
            type="date" 
            className="input-field" 
            value={filters.to} 
            onChange={e=>setFilters({...filters,to:e.target.value})} 
            placeholder="To Date"
          />
          <button 
            onClick={fetch} 
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FaSearch /> Search
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedRecords).length === 0 ? (
              <div className="text-center py-10 text-gray-400">No attendance records found</div>
            ) : (
              Object.keys(groupedRecords).sort().map(classCode => {
                const classDetails = parseClassCode(classCode);
                const isClassExpanded = expandedClasses[classCode];
                const months = groupedRecords[classCode];

                return (
                  <div key={classCode} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Class Header */}
                    <button 
                      onClick={() => toggleClass(classCode)}
                      className="w-full flex items-center justify-between bg-blue-50 px-6 py-4 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isClassExpanded ? <FaChevronDown className="text-blue-600" /> : <FaChevronRight className="text-blue-600" />}
                        <h3 className="text-lg font-bold text-gray-900">
                          Class {classDetails.standard} - {classDetails.division} ({classDetails.medium} Medium)
                        </h3>
                      </div>
                      <Badge status="blue">
                        {(Object.values(months) as any[]).reduce((acc: number, m: any) => acc + Object.keys(m).length, 0)} Days Recorded
                      </Badge>
                    </button>

                    {isClassExpanded && (
                      <div className="p-4 space-y-3 bg-white">
                        {Object.keys(months).sort().reverse().map(monthKey => {
                          const monthDate = new Date(monthKey + '-01');
                          const classMonthKey = `${classCode}-${monthKey}`;
                          const isMonthExpanded = expandedMonths[classMonthKey];
                          const days = months[monthKey];

                          return (
                            <div key={monthKey} className="ml-4 border-l-2 border-gray-100 pl-4">
                              <button 
                                onClick={() => toggleMonth(classMonthKey)}
                                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {isMonthExpanded ? <FaChevronDown size={14} className="text-gray-500" /> : <FaChevronRight size={14} className="text-gray-500" />}
                                  <span className="font-semibold text-gray-700">
                                    {format(monthDate, 'MMMM yyyy')}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">{Object.keys(days).length} Days</span>
                              </button>

                              {isMonthExpanded && (
                                <div className="mt-2 space-y-2">
                                  {Object.keys(days).sort().reverse().map(dayKey => {
                                    const dayDate = new Date(dayKey);
                                    const classMonthDayKey = `${classCode}-${monthKey}-${dayKey}`;
                                    const isDayExpanded = expandedDays[classMonthDayKey];
                                    const dayRecords = days[dayKey];

                                    return (
                                      <div key={dayKey} className="ml-6 border-l-2 border-gray-50 pl-4">
                                        <button 
                                          onClick={() => toggleDay(classMonthDayKey)}
                                          className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            {isDayExpanded ? <FaChevronDown size={12} className="text-gray-400" /> : <FaChevronRight size={12} className="text-gray-400" />}
                                            <span className="text-sm font-medium text-gray-600">
                                              {format(dayDate, 'do MMMM (EEEE)')}
                                            </span>
                                          </div>
                                          <div className="flex gap-3">
                                            <span className="text-xs text-green-600 font-medium">
                                              P: {dayRecords.reduce((acc: number, r: any) => acc + (r.records?.filter((sr: any) => sr.status === 'Present' || sr.status === 'Late').length || 0), 0)}
                                            </span>
                                            <span className="text-xs text-red-600 font-medium">
                                              A: {dayRecords.reduce((acc: number, r: any) => acc + (r.records?.filter((sr: any) => sr.status === 'Absent').length || 0), 0)}
                                            </span>
                                          </div>
                                        </button>

                                        {isDayExpanded && (
                                          <div className="mt-3 overflow-hidden border border-gray-100 rounded-lg">
                                            {dayRecords.map((att: any, idx: number) => (
                                              <div key={att._id || idx} className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                  <thead className="bg-gray-50">
                                                    <tr>
                                                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">GR No.</th>
                                                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Roll No.</th>
                                                      <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Student Name</th>
                                                      <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="bg-white divide-y divide-gray-50">
                                                    {att.records?.map((record: any, sIdx: number) => (
                                                      <tr key={record.student_id || sIdx} className="hover:bg-gray-50 transition-colors text-xs">
                                                        <td className="px-4 py-2 text-gray-900 font-mono">{record.gr_number || record.gr_no || '-'}</td>
                                                        <td className="px-4 py-2 text-gray-900">{record.roll_no || record.roll_number || '-'}</td>
                                                        <td className="px-4 py-2 text-gray-900 font-medium">{record.student_name || record.name || 'N/A'}</td>
                                                        <td className="px-4 py-2 text-center">
                                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            record.status === 'Present' 
                                                              ? 'bg-green-100 text-green-800' 
                                                              : record.status === 'Late'
                                                              ? 'bg-yellow-100 text-yellow-800'
                                                              : 'bg-red-100 text-red-800'
                                                          }`}>
                                                            {record.status || 'Absent'}
                                                          </span>
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ))}
                                          </div>
                                        )}
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
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;