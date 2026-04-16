import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOTP';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';

// Layouts
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManagement from './pages/admin/AdminManagement';
import Students from './pages/admin/Students';
import StudentHistory from './pages/admin/StudentHistory';
import Teachers from './pages/admin/Teachers';
import TeacherHistory from './pages/admin/TeacherHistory';
import Classes from './pages/admin/Classes';
import Subjects from './pages/admin/Subjects';
import Attendance from './pages/admin/Attendance';
import Exams from './pages/admin/Exams';
import Fees from './pages/admin/Fees';
import Notices from './pages/admin/Notices';
import Events from './pages/admin/Events';
import AssignClassTeacher from './pages/admin/AssignClassTeacher';
import SubjectAssignment from './pages/admin/SubjectAssignment';
import Timetable from './pages/admin/Timetable';
import LeaveManagement from './pages/admin/LeaveManagement';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import TeacherHomework from './pages/teacher/TeacherHomework';
import EnterResults from './pages/teacher/EnterResults';
import TeacherLeave from './pages/teacher/TeacherLeave';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherEvents from './pages/teacher/TeacherEvents';
import TeacherNotices from './pages/teacher/TeacherNotices';
import StudentLeaveApprovals from './pages/teacher/StudentLeaveApprovals';
import HolidayCalendar from './pages/HolidayCalendar';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentLeave from './pages/student/StudentLeave';

// Common
import Profile from './pages/Profile';

import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute: React.FC<any> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

const DashboardLayout: React.FC<any> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <div className="flex h-screen w-full max-w-full overflow-x-hidden bg-gray-100">
      <div className="flex-shrink-0">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      </div>
      <div className="flex-1 min-w-0 w-full max-w-full flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-gray-100 p-6 text-xs [&_h1]:text-base md:[&_h1]:text-lg [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/verify-otp" element={<VerifyOTP />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/change-password" element={<ChangePassword />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><DashboardLayout><AdminDashboard /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/admins" element={<PrivateRoute role="admin"><DashboardLayout><AdminManagement /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/students" element={<PrivateRoute role="admin"><DashboardLayout><Students /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/student-history/:id" element={<PrivateRoute role="admin"><DashboardLayout><StudentHistory /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/teachers" element={<PrivateRoute role="admin"><DashboardLayout><Teachers /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/teacher-history/:id" element={<PrivateRoute role="admin"><DashboardLayout><TeacherHistory /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/classes" element={<PrivateRoute role="admin"><DashboardLayout><Classes /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/subjects" element={<PrivateRoute role="admin"><DashboardLayout><Subjects /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/attendance" element={<PrivateRoute role="admin"><DashboardLayout><Attendance /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/exams" element={<PrivateRoute role="admin"><DashboardLayout><Exams /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/fees" element={<PrivateRoute role="admin"><DashboardLayout><Fees /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/notices" element={<PrivateRoute role="admin"><DashboardLayout><Notices /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/events" element={<PrivateRoute role="admin"><DashboardLayout><Events /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/assign-class-teacher" element={<PrivateRoute role="admin"><DashboardLayout><AssignClassTeacher /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/subject-assignment" element={<PrivateRoute role="admin"><DashboardLayout><SubjectAssignment /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/timetable" element={<PrivateRoute role="admin"><DashboardLayout><Timetable /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/calendar" element={<PrivateRoute role="admin"><DashboardLayout><HolidayCalendar /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/leaves" element={<PrivateRoute role="admin"><DashboardLayout><LeaveManagement /></DashboardLayout></PrivateRoute>} />
      <Route path="/admin/profile" element={<PrivateRoute role="admin"><DashboardLayout><Profile /></DashboardLayout></PrivateRoute>} />

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherDashboard /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/attendance" element={<PrivateRoute role="teacher"><DashboardLayout><MarkAttendance /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/exams" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherExams /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/homework" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherHomework /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/results" element={<PrivateRoute role="teacher"><DashboardLayout><EnterResults /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/timetable" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherTimetable /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/calendar" element={<PrivateRoute role="teacher"><DashboardLayout><HolidayCalendar /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/leaves" element={<PrivateRoute role="teacher"><DashboardLayout><StudentLeaveApprovals /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/events" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherEvents /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/notices" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherNotices /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/leave" element={<PrivateRoute role="teacher"><DashboardLayout><TeacherLeave /></DashboardLayout></PrivateRoute>} />
      <Route path="/teacher/profile" element={<PrivateRoute role="teacher"><DashboardLayout><Profile /></DashboardLayout></PrivateRoute>} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<PrivateRoute role="student"><DashboardLayout><StudentDashboard /></DashboardLayout></PrivateRoute>} />
      <Route path="/student/timetable" element={<PrivateRoute role="student"><DashboardLayout><StudentTimetable /></DashboardLayout></PrivateRoute>} />
      <Route path="/student/calendar" element={<PrivateRoute role="student"><DashboardLayout><HolidayCalendar /></DashboardLayout></PrivateRoute>} />
      <Route path="/student/leave" element={<PrivateRoute role="student"><DashboardLayout><StudentLeave /></DashboardLayout></PrivateRoute>} />
      <Route path="/student/profile" element={<PrivateRoute role="student"><DashboardLayout><Profile /></DashboardLayout></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
