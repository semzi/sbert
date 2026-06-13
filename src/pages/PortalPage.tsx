import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Assessment } from '../types';
import { useNavigate } from 'react-router-dom';

interface PortalPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function PortalPage({ theme, onToggleTheme }: PortalPageProps) {
  const { assessments, students, courses } = useApp();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [matricNo, setMatricNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeAssessments = assessments.filter(a => {
    if (a.status !== 'Active') return false;
    if (!searchQuery) return true;
    
    const course = courses.find(c => c.id === a.courseId);
    const searchLower = searchQuery.toLowerCase();
    
    return a.title.toLowerCase().includes(searchLower) ||
           course?.title.toLowerCase().includes(searchLower) ||
           course?.code.toLowerCase().includes(searchLower);
  });

  const handleAssessmentClick = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowLogin(true);
    setError('');
    // Clear inputs when opening modal
    setMatricNo('');
    setFirstName('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    // Simulate network delay for a premium feel
    setTimeout(() => {
      const student = students.find(
        s => s.matricNo.toLowerCase().trim() === matricNo.toLowerCase().trim() && 
             s.firstName.toLowerCase().trim() === firstName.toLowerCase().trim()
      );

      if (student) {
        const isEnrolled = student.courses.includes(selectedAssessment!.courseId);
        
        if (isEnrolled) {
          navigate(`/exam/${selectedAssessment!.id}?studentId=${student.id}`);
        } else {
          setError('Cross-check your enrollment. You are not registered for this course.');
        }
      } else {
        setError('Verification failed. Invalid Matric Number or Firstname.');
      }
      setIsVerifying(false);
    }, 1200);
  };

  return (
    <div className={`min-h-screen relative overflow-auto pb-20 ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <header className="p-4 z-30 mb-8">
        <div className="container mx-auto">
          <div className="liquid-glass px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#2B1A66] rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  UI
                </div>
                <div>
                  <h1 className="q-text text-xl font-bold">University of Ilorin</h1>
                  <p className="q-muted text-sm font-medium tracking-wide uppercase">CBT Portal Gateway</p>
                </div>
              </div>

              <button 
                onClick={onToggleTheme}
                className="ios-icon-btn"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5 q-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 17.657l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-8 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h2 className="q-text text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
            Active Assessments
          </h2>
          <p className="q-muted text-lg leading-relaxed">
            Welcome to the Unilorin CBT Portal. Search and select an assessment below to begin.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <svg className="w-5 h-5 q-muted absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              placeholder="Search by course code, title, or exam name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="q-input w-full pl-12 pr-6 py-4 rounded-xl transition-all font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Assessments List */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {activeAssessments.map(assessment => {
            const course = courses.find(c => c.id === assessment.courseId);
            return (
              <div 
                key={assessment.id}
                onClick={() => handleAssessmentClick(assessment)}
                className="liquid-glass p-4 sm:p-5 transition-all duration-300 hover:-translate-y-[2px] cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 group"
              >
                <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-white/40 dark:bg-black/20 flex items-center justify-center border border-white/20 shrink-0 shadow-sm">
                     <svg className="w-6 h-6 q-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                     </svg>
                  </div>
                  <div>
                    <h3 className="q-text text-xl font-bold mb-0.5 group-hover:text-[#2B1A66] dark:group-hover:text-yellow-400 transition-colors">
                      {assessment.title}
                    </h3>
                    <p className="q-muted text-sm font-medium">
                      <span className="font-bold">{course?.code}</span> — {course?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-200/50 dark:border-gray-700/50 sm:border-t-0">
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="q-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider">Duration</span>
                    <span className="q-text text-sm font-bold">{assessment.durationMinutes} Mins</span>
                  </div>
                  <button className="ios-btn ios-btn--light whitespace-nowrap !py-2 !px-4 text-sm">
                    Start Session
                  </button>
                </div>
              </div>
            );
          })}

          {activeAssessments.length === 0 && (
            <div className="py-24 text-center liquid-glass !bg-transparent border-dashed mt-4 rounded-3xl">
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 q-muted">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold q-text">No assessments found</h3>
              <p className="q-muted mt-1 font-medium">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </main>

      {/* Verification Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => !isVerifying && setShowLogin(false)}
          ></div>
          
          <div className="relative w-full max-w-md animate-modal-up">
            <div className="liquid-glass p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="q-text text-2xl font-bold mb-1">Student Login</h3>
                  <p className="q-muted text-sm font-medium">Verify identity for <span className="font-bold q-text">{selectedAssessment?.title}</span></p>
                </div>
                <button 
                  onClick={() => !isVerifying && setShowLogin(false)}
                  className="ios-icon-btn"
                >
                  <svg className="w-5 h-5 q-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider q-muted ml-2 block mb-2">Matriculation Number</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 19/52HL000"
                    value={matricNo}
                    onChange={(e) => setMatricNo(e.target.value)}
                    className="q-input w-full px-6 py-4 rounded-xl transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider q-muted ml-2 block mb-2">First Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="As registered officially"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="q-input w-full px-6 py-4 rounded-xl transition-all font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    disabled={isVerifying}
                    className={`ios-btn ios-btn--primary w-full !py-4 !text-base transition-all duration-300 ${isVerifying ? 'opacity-80' : ''}`}
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Begin Assessment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Base Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-modal-up { animation: modal-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}
