import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface AdminLayoutProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/assign', label: 'Assign Students' },
  { to: '/admin/exams', label: 'Exams' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/essay-grading', label: 'Essay Grading' },
  { to: '/admin/results', label: 'Results' },
] as const;

function AdminLayout({ theme, onToggleTheme }: AdminLayoutProps) {
  const isDark = theme === 'dark';
  const { sessions, activeSessionId, setActiveSessionId } = useApp();
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 p-4">
        <div className="container mx-auto">
          <div className="liquid-glass px-6 py-3" style={{ overflow: 'visible' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className={isDark ? 'text-sm font-semibold text-white/70' : 'text-sm font-semibold text-[#6B7280]'}>
                  Admin Console
                </div>
                <div className={isDark ? 'text-xl font-bold text-[#F9FAFB]' : 'text-xl font-bold text-[#111827]'}>
                  Lecturer Dashboard
                </div>
              </div>
              
              <div className="flex items-center mx-4">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-green-400' : 'text-green-600'}`}>SBERT: Online</span>
              </div>

              {/* Session Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-200 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                      : 'bg-white/60 border-black/8 hover:bg-white/90 text-[#111827] shadow-sm'
                  }`}
                >
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-bold">
                    {activeSession?.label || 'Select Session'}
                  </span>
                  {activeSession?.isCurrent && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-700 px-1.5 py-0.5 rounded-md">
                      Current
                    </span>
                  )}
                  <svg className={`w-3.5 h-3.5 opacity-40 transition-transform duration-200 ${showSessionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSessionDropdown && (
                  <div className={`absolute top-full left-0 mt-2 w-64 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                    isDark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-black/8'
                  }`}>
                    <div className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      Academic Sessions
                    </div>
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setShowSessionDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          session.id === activeSessionId
                            ? isDark ? 'bg-purple-500/20 text-white' : 'bg-purple-50 text-purple-900'
                            : isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/3 text-[#111827]'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          session.id === activeSessionId ? 'bg-purple-500' : isDark ? 'bg-white/15' : 'bg-black/10'
                        }`} />
                        <span className="text-sm font-semibold">{session.label}</span>
                        {session.isCurrent && (
                          <span className="ml-auto text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-600 px-1.5 py-0.5 rounded-md">
                            Current
                          </span>
                        )}
                        {session.id === activeSessionId && !session.isCurrent && (
                          <svg className="ml-auto w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="ios-icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
                  {isDark ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M12 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M12 20v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M4.93 4.93 6.34 6.34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M17.66 17.66 19.07 19.07" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M2 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M20 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M4.93 19.07 6.34 17.66" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M17.66 6.34 19.07 4.93" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <NavLink to="/" className="ios-btn ios-btn--light" aria-label="Back to exam UI">
                  Exam UI
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-24 lg:self-start" style={{ maxHeight: 'calc(100vh - 7rem)', overflowY: 'auto' }}>
            <div className="liquid-glass p-4">
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) => {
                      const base = 'block rounded-2xl px-4 py-3 font-semibold transition';
                      if (isActive) {
                        return base + ' bg-[#2B1A66] text-white shadow-[0_12px_32px_rgba(43,26,102,0.22)]';
                      }
                      return base + (isDark ? ' bg-white/5 text-white/80 hover:bg-white/10' : ' bg-white/60 text-[#111827] hover:bg-white/80');
                    }}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
