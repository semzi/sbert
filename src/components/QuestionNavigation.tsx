import type { QuestionNavigationProps } from './types';

const QuestionNavigation = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  onQuestionClick,
  onPrevious,
  onNext,
  onViewAll,
  onSubmit,
  isSubmitDisabled,
}: QuestionNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4">
      <div className="container mx-auto">
        <div className="liquid-glass px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              {[...Array(totalQuestions)].map((_, i) => {
                const questionNumber = i + 1;
                const isCurrent = currentQuestion === questionNumber;
                const isAnswered = answeredQuestions.includes(questionNumber);

                return (
                  <button
                    key={questionNumber}
                    onClick={() => onQuestionClick(questionNumber)}
                    className={
                      `h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border shadow-sm ` +
                      (isCurrent
                        ? 'bg-[#2B1A66] text-white border-[#2B1A66]/35 shadow-[0_10px_26px_rgba(43,26,102,0.25)]'
                        : isAnswered
                          ? 'bg-[#F2C94C] text-[#2B1A66] border-[#F2C94C]/60 shadow-[0_10px_26px_rgba(242,201,76,0.22)]'
                          : 'bg-white/70 text-[#111827] border-black/10 hover:bg-white/90')
                    }
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={`Go to question ${questionNumber}`}
                  >
                    {questionNumber}
                  </button>
                );
              })}
            </div>

            <div className="h-7 w-px bg-black/10 shrink-0" />

            <button
              type="button"
              onClick={onViewAll}
              className={
                `ios-btn ios-btn--light shrink-0 ` +
                (!onViewAll ? 'opacity-55 cursor-not-allowed' : '')
              }
              disabled={!onViewAll}
            >
              View All {totalQuestions} Questions
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onPrevious}
                disabled={currentQuestion === 1}
                className="ios-btn ios-btn--light"
              >
                Previous
              </button>

              {currentQuestion === totalQuestions && onSubmit ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitDisabled}
                  className={`ios-btn font-black text-xs uppercase tracking-widest ${
                    isSubmitDisabled 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-black/5' 
                    : 'bg-[#2B1A66] text-white shadow-lg shadow-indigo-500/20 active:translate-y-0.5'
                  }`}
                >
                  {isSubmitDisabled ? 'Locked 🔒' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentQuestion === totalQuestions}
                  className={currentQuestion === totalQuestions ? 'ios-btn ios-btn--light' : 'ios-btn ios-btn--primary'}
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation;
