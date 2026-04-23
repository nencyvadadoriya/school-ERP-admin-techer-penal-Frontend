import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton, CardSkeleton } from '../../components/Skeleton';
import { examAPI, studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, BookOpen, User, GraduationCap, 
  ChevronDown, Save, RefreshCcw, AlertCircle
} from 'lucide-react';

const EnterResults: React.FC = () => {
  const { user, loading: loadingAuth } = useAuth();
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
  const [revisedMarks, setRevisedMarks] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  useEffect(()=>{
    if (user?.teacher_code) {
      examAPI.getAll({ teacher_code: user.teacher_code })
        .then(r => {
          setExams(r.data.data || []);
        })
        .catch(err => {
          console.error("Error fetching exams:", err);
          toast.error("Failed to load exams");
        })
        .finally(() => setMetaLoading(false));
    } else if (!loadingAuth) {
      setMetaLoading(false);
    }
  }, [user, loadingAuth]);

  useEffect(() => {
    if (selectedExam) {
      loadStudents();
    } else {
      setStudents([]);
      setMarks({});
      setRevisedMarks({});
    }
  }, [selectedExam]);

  const loadStudents = async () => {
    const exam = exams.find(e=>e._id===selectedExam);
    if (!exam) return;
    setLoading(true);
    try {
      let sR = await studentAPI.getAll({ class_code: exam.class_code });
      let cls = (sR.data.data || []);

      if (cls.length === 0) {
        const allStudentsR = await studentAPI.getAll({});
        const allStudents = allStudentsR.data.data || [];
        
        let examStd = '';
        let examDiv = '';
        const code = String(exam.class_code || '');
        const stdMatch = code.match(/(\d+)/);
        if (stdMatch) examStd = stdMatch[1];
        const divMatch = code.match(/Div\s*([A-D])/i) || code.match(/-([A-D])\b/i) || code.match(/\s+([A-D])\s+/i);
        if (divMatch) examDiv = divMatch[1];

        const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetNormalized = normalize(code);

        cls = allStudents.filter((s: any) => {
          const studentClassCode = s.class_code || '';
          const studentStd = String(s.std || s.standard || '');
          const studentDiv = String(s.class_name || s.division || '');
          const sStdNorm = normalize(studentStd);
          const sDivNorm = normalize(studentDiv);
          const eStdNorm = normalize(examStd);
          const eDivNorm = normalize(examDiv);

          if (studentClassCode && (studentClassCode === code || normalize(studentClassCode) === targetNormalized)) return true;
          if (eStdNorm && eDivNorm && sStdNorm === eStdNorm && sDivNorm === eDivNorm) return true;
          if (targetNormalized && studentClassCode && normalize(studentClassCode).includes(targetNormalized)) return true;
          return false;
        });
      }
      
      const rR = await examAPI.getResults({ exam_id: selectedExam });
      const existingResults = rR.data.data || [];
      
      setStudents(cls);
      
      const init: any = {};
      const initRevised: any = {};
      cls.forEach((s: any) => {
        const found = existingResults.find((r: any) => String(r.student_id?._id || r.student_id) === String(s._id));
        init[s._id] = found ? String(found.marks_obtained) : '';
        initRevised[s._id] = (found && typeof found.revised_marks !== 'undefined' && found.revised_marks !== null)
          ? String(found.revised_marks)
          : '';
      });
      setMarks(init);
      setRevisedMarks(initRevised);
    } catch(e){
      console.error("Error loading students/results:", e);
      toast.error("Failed to load student list");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const exam = exams.find(e=>e._id===selectedExam);
    if (!exam) return;
    setSaving(true);
    try {
      const promises = students.map(s => {
        const val = marks[s._id];
        if (val === undefined || val === '') return null;
        const m = parseFloat(val);
        if (isNaN(m)) return null;

        const revVal = revisedMarks[s._id];
        const revParsed = (revVal === undefined || revVal === '') ? null : parseFloat(revVal);
        const revised = (revParsed === null || Number.isNaN(revParsed)) ? null : revParsed;
        
        return examAPI.submitResult({
          exam_id: selectedExam, 
          student_id: s._id, 
          gr_number: s.gr_number,
          class_code: exam.class_code, 
          subject_code: exam.subject_code,
          marks_obtained: m, 
          revised_marks: revised,
          total_marks: exam.total_marks
        });
      }).filter(Boolean);

      if (promises.length === 0) {
        toast.info("No marks entered to save");
        setSaving(false);
        return;
      }

      await Promise.all(promises);
      toast.success('Results saved successfully!');
    } catch(e) { 
      console.error("Error saving results:", e);
      toast.error('Error saving results'); 
    }
    finally { setSaving(false); }
  };

  if (metaLoading || loadingAuth) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <CardSkeleton />
    </div>
  );
  
  const exam = exams.find(e=>e._id===selectedExam);

  const handleMarksChange = (studentId: string, value: string) => {
    setMarks({ ...marks, [studentId]: value });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      <div className="hidden md:block px-8 pt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="max-w-[60%]">
            <h1 className="text-2xl font-black text-[#002B5B] tracking-tight">Results Management</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Enter and manage student examination results</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            {exam && (
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#002B5B] text-white shadow-lg rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#003B7B] transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Results'}</span>
              </button>
            )}
          </div>
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#002B5B]/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-14 rounded-b-[32px] relative overflow-visible mb-4">
        <div className="relative z-10">
          <h1 className="text-xl font-black tracking-tight">Enter Results</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Manage Student Marks</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

        {/* Dropdown Integrated in Header for Mobile */}
        <div className="absolute -bottom-4 left-0 right-0 px-5 flex justify-center z-20">
          <div className="w-full max-w-[280px] relative">
            <select
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-100 shadow-xl text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">Select an exam...</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.exam_name} ({ex.class_code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6 md:mt-6 relative z-20 space-y-4">
        {/* Filters and Stats Row for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Settings Card */}
          <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col justify-center">
            <div className="hidden md:block">
              <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Select Exam</label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  <option value="">Select an exam...</option>
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.exam_name} ({ex.class_code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
            </div>

            {exam && (
              <div className="flex items-center justify-between gap-2 md:hidden">
                <div className="flex gap-2">
                  <div className="bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-blue-400 uppercase">Max</span>
                    <span className="text-[10px] font-black text-blue-900">{exam.total_marks}</span>
                  </div>
                  <div className="bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-emerald-400 uppercase">Pass</span>
                    <span className="text-[10px] font-black text-emerald-900">{exam.passing_marks}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#002B5B] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#002B5B]/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? '...' : 'Save'}</span>
                </button>
              </div>
            )}

            {!exam && (
              <div className="md:hidden text-center py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select an exam from header to start</p>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="lg:col-span-6">
            {exam ? (
              <div className="grid grid-cols-2 gap-2 md:gap-4 h-full">
                <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md h-full">
                  <span className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Maximum Marks</span>
                  <span className="text-sm md:text-xl font-black text-[#002B5B]">{exam.total_marks}</span>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md h-full">
                  <span className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Passing Marks</span>
                  <span className="text-sm md:text-xl font-black text-emerald-600">{exam.passing_marks}</span>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex bg-white rounded-xl p-4 border border-gray-100 shadow-sm items-center justify-center h-full">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Exam stats will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Student List Content */}
        <div className="space-y-3">
          {!selectedExam ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <BookOpen size={24} />
              </div>
              <p className="text-[10px] md:text-xs font-medium text-gray-400">Select an exam to enter marks.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Student List ({students.length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                {students.map((s, idx) => {
                  const obtained = parseFloat(marks[s._id]);
                  const isFailing = !isNaN(obtained) && obtained < (exam?.passing_marks || 0);
                  return (
                    <div key={s._id} className="bg-white rounded-xl p-2.5 md:p-3 border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:border-[#002B5B]/20 md:hover:shadow-md">
                      <div className="flex items-center gap-2.5 md:gap-5">
                        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[#002B5B] font-black text-[10px] md:text-sm border border-gray-100">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-[10px] md:text-sm font-black text-gray-900 leading-tight">{s.first_name} {s.last_name}</p>
                          <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">GR: {s.gr_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-6">
                        <div className="relative">
                          <input
                            type="number"
                            max={exam?.total_marks}
                            min="0"
                            step="0.5"
                            value={marks[s._id] || ''}
                            onChange={(e) => handleMarksChange(s._id, e.target.value)}
                            placeholder="0.0"
                            className={`w-14 md:w-20 px-2 py-1 md:py-2 rounded-lg text-[10px] md:text-sm font-black text-center outline-none border transition-all ${
                              !isNaN(obtained) 
                                ? isFailing 
                                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex flex-col items-center min-w-[30px] md:min-w-[50px]">
                          <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest ${!isNaN(obtained) ? (isFailing ? 'text-rose-500' : 'text-emerald-500') : 'text-gray-300'}`}>
                            {!isNaN(obtained) ? (isFailing ? 'Fail' : 'Pass') : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterResults;