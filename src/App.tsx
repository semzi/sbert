import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AdminLayout from './admin/AdminLayout';
import AssignStudentsPage from './admin/pages/AssignStudentsPage';
import CoursesPage from './admin/pages/CoursesPage';
import DashboardPage from './admin/pages/DashboardPage';
import EssayGradingPage from './admin/pages/EssayGradingPage';
import ExamsPage from './admin/pages/ExamsPage';
import QuestionsPage from './admin/pages/QuestionsPage';
import ResultsPage from './admin/pages/ResultsPage';
import StudentsPage from './admin/pages/StudentsPage';
import PortalPage from './pages/PortalPage';
import ExamPage from './pages/ExamPage';

// Main App Component
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Routes>
        <Route path="/" element={<PortalPage theme={theme} onToggleTheme={handleToggleTheme} />} />
        <Route path="/exam/:assessmentId" element={<ExamPage theme={theme} onToggleTheme={handleToggleTheme} />} />

        <Route path="/admin" element={<AdminLayout theme={theme} onToggleTheme={handleToggleTheme} />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="assign" element={<AssignStudentsPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="essay-grading" element={<EssayGradingPage />} />
          <Route path="results" element={<ResultsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
