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

  if (metaLoading || loadingAuth) return <div className="py-20"><Spinner /></div>;
  
  const exam = exams.find(e=>e._id===selectedExam);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enter Results</h1>
        <p className="text-sm text-gray-500 mt-1">Enter and manage student marks for exams</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Exam Selection Section */}
        <div className="p-5 border-b border-gray-200">
          <div className="max-w-md">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Exam
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-blue-700">
                📚 Subject: <strong className="font-semibold">{exam.subject_code}</strong>
              </span>
              <span className="text-blue-700">
                🎯 Total: <strong>{exam.total_marks}</strong>
              </span>
              <span className="text-blue-700">
                ✅ Passing: <strong>{exam.passing_marks}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Students Table */}
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : students.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GR No.</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Cut</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(s => {
                    const obtained = parseFloat(marks[s._id]);
                    const revised = parseFloat(revisedMarks[s._id]);
                    const effective = !isNaN(revised) ? revised : obtained;
                    const cutMarks = !isNaN(effective) ? (exam?.total_marks - effective).toFixed(1) : '—';
                    const isFailing = !isNaN(obtained) && obtained < (exam?.passing_marks || 0);
                    
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{s.first_name} {s.last_name}</div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{s.gr_number}</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-gray-700">{exam?.total_marks}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-sm font-medium ${!isNaN(obtained) && obtained < (exam?.total_marks || 0) ? 'text-red-500' : 'text-gray-400'}`}>
                            {cutMarks !== '0.0' ? `-${cutMarks}` : '0'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <input 
                              type="number" 
                              min="0" 
                              max={exam?.total_marks} 
                              step="0.5"
                              className={`w-28 px-2 py-1.5 text-center text-sm border rounded-md focus:ring-2 focus:outline-none transition
                                ${isFailing 
                                  ? 'border-red-300 text-red-600 focus:ring-red-500 focus:border-red-500' 
                                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              value={marks[s._id] || ''} 
                              onChange={e => setMarks({...marks, [s._id]: e.target.value})} 
                              placeholder="Marks" 
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Action Buttons */}
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => { if(window.confirm('Discard all unsaved changes?')) loadStudents(); }} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 transition"
              >
                Reset
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Saving...' : 'Save Results'}
              </button>
            </div>
          </>
        ) : selectedExam && !loading ? (
          <div className="py-16 text-center">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <p className="text-sm">No students found for this class</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EnterResults;