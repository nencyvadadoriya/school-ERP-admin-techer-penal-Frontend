import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { examAPI, studentAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

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
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
    </div>
  );
  
  const exam = exams.find(e=>e._id===selectedExam);

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Enter Results</h1>
          <p className="text-[10px] font-medium text-gray-500">Enter and manage student marks for exams</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedExam && (
            <>
              <button 
                onClick={() => { if(window.confirm('Discard all unsaved changes?')) loadStudents(); }} 
                className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
              >
                Reset
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || students.length === 0} 
                className="px-6 py-2 text-[11px] font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                style={{ backgroundColor: theme.primary }}
              >
                {saving ? 'Saving...' : 'Save Results'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Exam Selection Section */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <div className="max-w-md space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Select Examination
            </label>
            <select 
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
              value={selectedExam} 
              onChange={e=>setSelectedExam(e.target.value)}
            >
              <option value="">Choose an exam...</option>
              {exams.map(ex=>(
                <option key={ex._id} value={ex._id}>
                  {ex.exam_name} - {ex.class_code} ({ex.exam_type})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Exam Info Banner */}
        {exam && (
          <div className="px-5 py-2.5 bg-blue-50/50 border-b border-blue-100 flex items-center justify-center">
            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-primary-700">
              <span className="flex items-center gap-2">
                <span className="opacity-60">Subject:</span>
                <span className="text-primary-900">{exam.subject_code}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="opacity-60">Total Marks:</span>
                <span className="text-primary-900">{exam.total_marks}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="opacity-60">Passing:</span>
                <span className="text-green-600">{exam.passing_marks}</span>
              </span>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-2" style={{ borderBottomColor: theme.primary }}></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading students...</p>
            </div>
          ) : students.length > 0 ? (
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Student Information</th>
                  <th className="px-6 py-4">GR Number</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Cut</th>
                  <th className="px-6 py-4 text-center w-40">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[11px]">
                {students.map(s => {
                  const obtained = parseFloat(marks[s._id]);
                  const revised = parseFloat(revisedMarks[s._id]);
                  const effective = !isNaN(revised) ? revised : obtained;
                  const cutMarks = !isNaN(effective) ? (exam?.total_marks - effective).toFixed(1) : '—';
                  const isFailing = !isNaN(obtained) && obtained < (exam?.passing_marks || 0);
                  
                  return (
                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-tight">
                          {s.first_name} {s.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-400 uppercase tracking-tighter">
                        {s.gr_number}
                      </td>
                      <td className="px-6 py-3 text-center font-black text-gray-400">
                        {exam?.total_marks}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`font-black ${!isNaN(obtained) && obtained < (exam?.total_marks || 0) ? 'text-red-500' : 'text-gray-300'}`}>
                          {cutMarks !== '0.0' ? `-${cutMarks}` : '0'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-center">
                          <input 
                            type="number" 
                            min="0" 
                            max={exam?.total_marks} 
                            step="0.5"
                            className={`w-24 px-3 py-1.5 text-center font-black rounded-lg focus:ring-4 outline-none transition-all
                              ${isFailing 
                                ? 'bg-red-50 border-2 border-red-100 text-red-600 focus:ring-red-500/10' 
                                : 'bg-gray-50 border-2 border-gray-100 text-gray-900 focus:ring-blue-500/10'
                              }`}
                            value={marks[s._id] || ''} 
                            onChange={e => setMarks({...marks, [s._id]: e.target.value})} 
                            placeholder="0.0" 
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : selectedExam && !loading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">No students found for this class</p>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Please select an exam to enter marks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterResults;