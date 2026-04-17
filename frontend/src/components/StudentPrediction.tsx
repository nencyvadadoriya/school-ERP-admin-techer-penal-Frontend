import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartLine, FaExclamationTriangle, FaLightbulb, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface WeakSubject {
  subject_code: string;
  percentage: string;
  reason: string;
  suggestion: string;
}

interface PredictionData {
  status: string;
  overall_percentage: string;
  weak_subjects: WeakSubject[];
  recommendation: string;
}

const StudentPrediction: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prediction/${studentId}`);
        setPrediction(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch prediction');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchPrediction();
    }
  }, [studentId]);

  if (loading) return <div className="p-4 text-center">Loading prediction...</div>;
  if (error) return <div className="p-4 text-red-500 text-sm">{error}</div>;
  if (!prediction) return null;

  const isPass = prediction.status === 'Pass';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isPass ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <FaChartLine className="text-xl" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Performance Prediction</h2>
        </div>
        <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-2 ${
          isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPass ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{prediction.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Overall Score</p>
          <p className="text-2xl font-black text-blue-700">{prediction.overall_percentage}%</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center space-x-2 mb-1">
            <FaLightbulb className="text-purple-600" />
            <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Recommendation</p>
          </div>
          <p className="text-sm text-purple-700 font-medium">{prediction.recommendation}</p>
        </div>
      </div>

      {prediction.weak_subjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center space-x-2">
            <FaExclamationTriangle className="text-yellow-500" />
            <span>Weak Subjects Focus</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {prediction.weak_subjects.map((sub) => (
              <div key={sub.subject_code} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-red-700">{sub.subject_code}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-red-200 text-red-800 rounded-full">{sub.percentage}%</span>
                </div>
                <p className="text-xs text-red-600 italic mb-1">{sub.reason}</p>
                <p className="text-xs text-gray-600">{sub.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPrediction;
