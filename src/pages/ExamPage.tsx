import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import QuestionOption from '../components/QuestionOption';
import QuestionCard from '../components/QuestionCard';
import FillGap from '../components/FillGap';
import QuestionNavigation from '../components/QuestionNavigation';
import CalculatorModal from '../components/CalculatorModal';
import { useApp } from '../context/AppContext';
import { calculateEssayGrade } from '../lib/grading';

interface ExamPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function ExamPage({ theme, onToggleTheme }: ExamPageProps) {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  
  const { questions, assessments, addSubmission, students } = useApp();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [fillGaps, setFillGaps] = useState<{ [key: string]: string }>({});
  const [essayAnswers, setEssayAnswers] = useState<{ [key: string]: string }>({});
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [examResult, setExamResult] = useState<boolean | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<any | null>(null);

  const assessment = assessments.find(a => a.id === assessmentId);
  const examQuestions = questions.filter(q => q.assessmentId === assessmentId);
  const student = students.find(s => s.id === studentId);

  const totalQuestions = examQuestions.length;

  const [timeLeft, setTimeLeft] = useState((assessment?.durationMinutes || 60) * 60);
  const totalDurationSeconds = (assessment?.durationMinutes || 60) * 60;
  const isSubmitDisabled = false; // Restriction removed per request
  const { saveAttemptProgress } = useApp();

  const stateRef = useRef({
    currentQuestionIndex,
    selectedAnswers,
    fillGaps,
    essayAnswers,
    timeLeft
  });

  // Load existing attempt on component mount
  useEffect(() => {
    if (!studentId || !assessmentId) return;
    
    fetch(`https://unilorin.alwaysdata.net/load_attempt.php?student_id=${studentId}&assessment_id=${assessmentId}`)
      .then(r => r.json())
      .then(data => {
         if (data && (data.status === 'Submitted' || data.status === 'Graded')) {
             setIsCompleted(true);
             return;
         }
         if (data && data.current_state) {
             try {
                const state = JSON.parse(data.current_state);
                if (state.currentQuestionIndex !== undefined) setCurrentQuestionIndex(state.currentQuestionIndex);
                if (state.selectedAnswers) setSelectedAnswers(state.selectedAnswers);
                if (state.fillGaps) setFillGaps(state.fillGaps);
                if (state.essayAnswers) setEssayAnswers(state.essayAnswers);
                if (data.time_left_seconds !== undefined && data.time_left_seconds !== null) {
                    const savedSeconds = parseInt(data.time_left_seconds, 10);
                    setTimeLeft(Math.min(savedSeconds, totalDurationSeconds));
                }
             } catch (e) {
                console.error("Failed to parse attempt state", e);
             }
         }
      })
      .catch(console.error);
  }, [studentId, assessmentId]);

  useEffect(() => {
    stateRef.current = { currentQuestionIndex, selectedAnswers, fillGaps, essayAnswers, timeLeft };
  }, [currentQuestionIndex, selectedAnswers, fillGaps, essayAnswers, timeLeft]);

  // Auto-save progress silently every 10 seconds
  useEffect(() => {
    if (!studentId || !assessmentId) return;
    const interval = setInterval(() => {
      saveAttemptProgress({
        studentId,
        assessmentId,
        timeLeftSeconds: stateRef.current.timeLeft,
        currentState: {
          currentQuestionIndex: stateRef.current.currentQuestionIndex,
          selectedAnswers: stateRef.current.selectedAnswers,
          fillGaps: stateRef.current.fillGaps,
          essayAnswers: stateRef.current.essayAnswers
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [studentId, assessmentId, saveAttemptProgress]);

  const answeredQuestions = [
    ...Object.keys(selectedAnswers).map(key => parseInt(key)),
    ...Object.keys(fillGaps).map(key => parseInt(key.split('_')[0])),
    ...Object.keys(essayAnswers).map(key => parseInt(key))
  ].filter((q, index, arr) => arr.indexOf(q) === index);

  const handleRadioChange = (index: number, value: string) => {
    setSelectedAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleFillGapChange = (gapId: string, value: string) => {
    setFillGaps(prev => ({ ...prev, [gapId]: value }));
  };

  const handleEssayChange = (index: number, value: string) => {
    setEssayAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleQuestionClick = (questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submissionsToSave: any[] = [];
    let score = 0;
    let maxPossibleScore = 0;

    for (let i = 0; i < examQuestions.length; i++) {
        const q = examQuestions[i];
        const weight = q.mark || 1;
        maxPossibleScore += weight;
        
        let questionScore = 0;
        let similarityScore = 0;
        let studentAnswerStr = "";

        if (q.type === 'MCQ') {
            studentAnswerStr = selectedAnswers[i] || "";
            // Convert 'a','b','c' back to index for comparison with q.correctOption (0,1,2)
            const answerIndex = studentAnswerStr ? studentAnswerStr.charCodeAt(0) - 97 : -1;
            if (answerIndex === q.correctOption) {
                questionScore = weight;
            }
        } else if (q.type === 'Fill-in-gap') {
            const studentVal = (fillGaps[`${i}_gap`] || '');
            const correctVal = (q.gapAnswer || '');
            studentAnswerStr = studentVal;

            const studentAnswers = studentVal.split(',,,').map(s => s.toLowerCase().trim());
            const correctAnswers = correctVal.split('|').map(c => c.toLowerCase().trim());
            
            if (correctAnswers.length > 0) {
                let correctCount = 0;
                correctAnswers.forEach((ans, idx) => {
                    if (studentAnswers[idx] === ans) {
                        correctCount++;
                    }
                });
                questionScore = (correctCount / correctAnswers.length) * weight;
            }
        } else if (q.type === 'Essay') {
            const studentAns = essayAnswers[i] || '';
            studentAnswerStr = studentAns;
            const reference = q.referenceAnswer || "";
            const threshold = q.threshold || 60;
            
            try {
                // Perform SBERT semantic analysis
                const res = await calculateEssayGrade(studentAns, reference, threshold);
                similarityScore = res.similarityScore;
                if (res.passed) {
                    // If percentage is >= threshold, mark the point complete (full marks)
                    questionScore = weight;
                }
            } catch (e) {
                console.error("Grading failed for essay", i, e);
            }
        }

        score += questionScore;

        // Prepare submission record for this specific question
        submissionsToSave.push({
            id: `sub-${Date.now()}-${i}`,
            studentId: studentId || 'anonymous',
            questionId: q.id,
            assessmentId: assessmentId || '',
            courseId: assessment?.courseId || '',
            studentAnswer: studentAnswerStr,
            score: questionScore,
            status: 'Graded',
            similarityScore: similarityScore > 0 ? similarityScore : undefined
        });
    }

    // Save all individual question results
    submissionsToSave.forEach(sub => addSubmission(sub));
 
    // Finalize the attempt status
    saveAttemptProgress({
      studentId: studentId || 'anonymous',
      assessmentId: assessmentId || '',
      timeLeftSeconds: 0,
      currentState: { selectedAnswers, fillGaps, essayAnswers },
      status: 'Submitted',
      total_score: score
    });
 
    setExamResult(true); // Just mark as success
    setIsSubmitting(false);
    setIsConfirmModalOpen(false);
    setHoldProgress(0);
  };

  const handleHoldStart = () => {
    if (holdTimerRef.current) return;
    
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setHoldProgress(progress);

      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        handleSubmit();
      }
    }, 20);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const renderCurrentQuestion = () => {
    if (examQuestions.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4">No questions found for this assessment</h2>
                <p className="text-gray-500">Please contact your administrator.</p>
            </div>
        );
    }

    const q = examQuestions[currentQuestionIndex];
    const points = q.mark || 1;

    return (
        <QuestionCard
            questionNumber={currentQuestionIndex + 1}
            questionType={q.type}
            points={points.toString()}
            question={q.type === 'Fill-in-gap' ? '' : q.questionText}
        >
            {q.type === 'MCQ' && (
                <div className="space-y-3">
                    {q.options?.map((opt: string, idx: number) => {
                        const letter = String.fromCharCode(97 + idx); // a, b, c, d
                        return (
                            <QuestionOption
                                key={idx}
                                type="radio"
                                selected={selectedAnswers[currentQuestionIndex] === letter}
                                onClick={() => handleRadioChange(currentQuestionIndex, letter)}
                            >
                                {opt}
                            </QuestionOption>
                        );
                    })}
                </div>
            )}

            {q.type === 'Fill-in-gap' && (
                <FillGap
                    text={q.questionText.includes('[GAP]') ? q.questionText : (q.questionText.includes('___') ? q.questionText.replace(/___/g, '[GAP]') : `[GAP] ${q.questionText}`)}
                    gapId={`${currentQuestionIndex}_gap`}
                    value={fillGaps[`${currentQuestionIndex}_gap`] || ''}
                    onChange={handleFillGapChange}
                />
            )}

            {q.type === 'Essay' && (
                <textarea
                  className="q-textarea w-full h-48 p-6 rounded-3xl resize-none bg-gray-50 dark:bg-gray-800 border-none ring-2 ring-transparent focus:ring-purple-500/50 transition-all outline-none font-medium"
                  placeholder="Type your comprehensive answer here..."
                  value={essayAnswers[currentQuestionIndex] || ''}
                  onChange={(e) => handleEssayChange(currentQuestionIndex, e.target.value)}
                ></textarea>
            )}
        </QuestionCard>
    );
  };

  if (examResult !== null || isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAFA] dark:bg-[#0F172A]">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-12 text-center rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-[#111827] dark:text-white mb-2 tracking-tight">
            {isCompleted ? 'Assessment Completed' : 'Exam Submitted'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
            {isCompleted 
              ? 'You have already finalized this evaluation. Access to the question set is now locked.' 
              : 'Your responses have been recorded successfully. Results will be released by the administrator.'}
          </p>
          
          <button 
            type="button"
            className="w-full py-5 rounded-2xl border-2 border-[#2B1A66] text-[#2B1A66] dark:text-white dark:border-white font-black text-lg hover:bg-[#2B1A66] hover:text-white transition-all shadow-lg"
            onClick={() => window.location.href = '/'}
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenCalculator={() => setCalculatorOpen(true)}
        studentName={student?.name || 'Student'}
        calculatorType={assessment?.calculatorType as any}
      />

      <div className="flex flex-1 pt-24 pb-24 relative overflow-hidden">
        {/* Decorative background for exam */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none"></div>

        {isSubmitting && (
          <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-fade-in">
             <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
             <div className="text-2xl font-black tracking-tight dark:text-white">Auto-Grading with SBERT...</div>
             <p className="text-gray-500 mt-2">Analyzing your essay answers for semantic accuracy.</p>
          </div>
        )}

        <main className="flex-1 p-8 lg:p-12 z-10">{renderCurrentQuestion()}</main>

        <div className="hidden lg:block w-[320px] shrink-0" />
        <Sidebar 
          assessmentTitle={assessment?.title} 
          studentName={student?.name} 
          studentMatric={student?.matricNo} 
          durationMinutes={assessment?.durationMinutes}
          startTimeLeft={timeLeft}
          onTimeTick={setTimeLeft}
          onSubmit={() => setIsConfirmModalOpen(true)}
          disabled={isSubmitDisabled}
        />
      </div>

      <QuestionNavigation
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions.map(idx => idx + 1)}
        onQuestionClick={handleQuestionClick}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={() => setIsConfirmModalOpen(true)}
        isSubmitDisabled={isSubmitDisabled}
      />

      <CalculatorModal 
        open={calculatorOpen} 
        onClose={() => setCalculatorOpen(false)} 
        calculatorType={assessment?.calculatorType as any}
      />

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className={`max-w-md w-full p-10 rounded-[2.5rem] shadow-2xl border ${theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-black/5'} animate-in zoom-in-95 duration-300`}>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className={`text-2xl font-black text-center mb-3 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Finish Examination?</h3>
              <p className={`text-center mb-10 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>You have answered <span className="text-purple-600 font-bold">{answeredQuestions.length}</span> of <span className="font-bold">{totalQuestions}</span> questions. You cannot change your answers after submission.</p>
              
              <div className="flex flex-col items-center gap-8">
                 <div className="relative w-32 h-32 flex items-center justify-center group">
                    <button 
                       onMouseDown={handleHoldStart}
                       onMouseUp={handleHoldEnd}
                       onMouseLeave={handleHoldEnd}
                       onTouchStart={handleHoldStart}
                       onTouchEnd={handleHoldEnd}
                       className={`w-24 h-24 rounded-full bg-[#2B1A66] text-white flex items-center justify-center transition-all relative z-10 select-none shadow-2xl ${holdProgress > 0 ? 'scale-[0.85]' : 'hover:scale-105 shadow-indigo-500/30'}`}
                    >
                       {holdProgress > 0 ? (
                           <span className="text-xl font-black">{Math.round(holdProgress)}%</span>
                       ) : (
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                       )}
                    </button>
                    
                    {/* Circular Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-0" viewBox="0 0 100 100">
                        <circle
                            cx="50" cy="50" r="44"
                            fill="none"
                            stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                            strokeWidth="8"
                        />
                        <circle
                            cx="50" cy="50" r="44"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="8"
                            strokeDasharray="276.46"
                            strokeDashoffset={276.46 - (276.46 * holdProgress) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-300 ease-linear"
                            style={{ 
                                filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))',
                            }}
                        />
                    </svg>
                 </div>

                 <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] q-muted mb-4">Press & Hold Circle to Confirm</div>
                    <button 
                        onClick={() => { if(holdProgress === 0) setIsConfirmModalOpen(false); }} 
                        disabled={holdProgress > 0}
                        className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'} transition-all ${holdProgress > 0 ? 'opacity-0 scale-90' : ''}`}
                    >
                        Maybe not yet
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default ExamPage;
