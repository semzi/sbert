import { useState, useEffect } from 'react';

interface SidebarProps {
  assessmentTitle?: string;
  studentName?: string;
  studentMatric?: string;
  durationMinutes?: number;
  startTimeLeft?: number;
  onTimeTick?: (timeLeft: number) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

const Sidebar = ({ assessmentTitle, studentName, studentMatric, durationMinutes = 60, startTimeLeft, onTimeTick, onSubmit, disabled }: SidebarProps) => {
  const totalTime = durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(startTimeLeft !== undefined ? startTimeLeft : totalTime);

  useEffect(() => {
    if (startTimeLeft !== undefined) {
      setTimeLeft(startTimeLeft);
    }
  }, [startTimeLeft]);

  useEffect(() => {
    if (startTimeLeft === undefined) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, startTimeLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev > 0 ? prev - 1 : 0;
        if (onTimeTick) onTimeTick(newTime);
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTimeTick]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  const progressPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isDanger = progressPercent <= 15;

  return (
    <aside className="fixed top-24 bottom-0 right-0 w-[320px] border-l border-white/5 p-6 z-20 backdrop-blur-xl bg-white/40 dark:bg-gray-950/20 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.1)] custom-scrollbar overflow-y-auto hidden lg:block">
      <div className="flex flex-col gap-4">
        {/* Timer - Now positioned first to balance top space */}
        <div className="liquid-glass relative overflow-hidden">
          {/* Progress Fill Background */}
          <div 
            className={`absolute inset-0 opacity-10 dark:opacity-20 transition-all duration-1000 ease-linear ${isDanger ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Progress Indicator Top Border */}
          <div 
            className={`absolute top-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${isDanger ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`}
            style={{ width: `${progressPercent}%` }}
          />
          
          <div className="pt-4 pb-5 px-5">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 opacity-90 relative z-10 transition-colors duration-1000 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Time Remaining</span>
            </div>
            <div className={`text-4xl font-black leading-none mb-1 tracking-tighter tabular-nums drop-shadow-sm flex items-center relative z-10 transition-colors duration-1000 ${isDanger ? 'text-red-600 dark:text-red-400 animate-pulse' : 'q-text'}`}>
              {hours > 0 ? `${formatTime(hours)}:` : ''}{formatTime(minutes)}<span className="opacity-50 mx-0.5 animate-pulse">:</span>{formatTime(seconds)}
            </div>
            <div className={`flex text-[9px] font-bold tracking-widest uppercase gap-6 relative z-10 transition-colors duration-1000 ${isDanger ? 'text-red-500/70 dark:text-red-400/70' : 'q-muted'}`}>
              {hours > 0 && <span>Hours</span>}
              <span>Minutes</span>
              <span>Seconds</span>
            </div>
          </div>
        </div>

        {/* Student Profile */}
        <div className="liquid-glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#2B1A66] dark:bg-indigo-900/40 flex items-center justify-center text-white shadow-inner border border-white/10 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="q-text text-lg font-bold tracking-tight truncate leading-tight mb-0.5">{studentName || 'Student Name'}</div>
              <div className="q-muted text-[10px] font-bold tracking-widest uppercase">{studentMatric || 'MATRIC NUMBER'}</div>
            </div>
          </div>
          <div className="pt-3 border-t border-black/5 dark:border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-widest q-muted mb-0.5">Current Assessment</div>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">{assessmentTitle || 'N/A'}</div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="mt-4">
            <button 
                onClick={onSubmit}
                disabled={disabled}
                className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${
                  disabled 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-black/5' 
                  : 'bg-[#2B1A66] text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95'
                }`}
            >
                {!disabled && (
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
                {disabled ? (
                  <>
                    <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Locked
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Finish Exam
                  </>
                )}
            </button>
            <p className="text-[9px] q-muted font-bold text-center mt-3 uppercase tracking-tighter opacity-60">
                {disabled 
                  ? "Submission opens after 50% time elapsed." 
                  : "Review your answers before final submission."}
            </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .theme-dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
