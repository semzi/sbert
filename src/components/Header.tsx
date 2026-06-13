interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCalculator: () => void;
  studentName?: string;
  calculatorType?: 'None' | 'Basic' | 'Scientific';
}

const Header = ({ theme, onToggleTheme, onOpenCalculator, studentName, calculatorType }: HeaderProps) => {
  const isDark = theme === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 p-4 z-30">
      <div className="container mx-auto">
        <div className="liquid-glass px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#2B1A66] rounded-xl flex items-center justify-center text-white font-bold">
                UI
              </div>
              <div>
                <h1 className="q-text text-xl font-bold">
                   University of Ilorin
                </h1>
                <p className="q-muted text-sm font-medium">{studentName ? `CBT Portal: ${studentName}` : 'COMPUTER BASED TEST'}</p>
              </div>
              <div className="hidden sm:flex items-center ml-4 border-l border-black/10 dark:border-white/10 pl-4 gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-green-400' : 'text-green-600'}`}>SBERT Active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {calculatorType && calculatorType !== 'None' && (
                <button 
                  onClick={onOpenCalculator}
                  className="ios-btn ios-btn--light hidden sm:flex shrink-0 !py-2 !px-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="16" y1="14" x2="16" y2="18" />
                    <path d="M16 10h.01" />
                    <path d="M12 10h.01" />
                    <path d="M8 10h.01" />
                    <path d="M12 14h.01" />
                    <path d="M8 14h.01" />
                    <path d="M12 18h.01" />
                    <path d="M8 18h.01" />
                  </svg>
                  {calculatorType} 
                </button>
              )}

              <button 
                onClick={onToggleTheme}
                className="ios-icon-btn hidden sm:flex"
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 17.657l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 q-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden sm:block">
                  <div className={`text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-white/50' : 'text-gray-400'}`}>Authenticated</div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{studentName?.split(' ')[0] || 'Guest'}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-purple-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
