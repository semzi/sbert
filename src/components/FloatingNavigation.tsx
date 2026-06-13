import type { FloatingNavigationProps } from './types';

const FloatingNavigation = ({ currentQuestion, totalQuestions, onPrevious, onNext, onSubmit }: FloatingNavigationProps) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform liquid-glass liquid-glass--purple  -translate-x-1/2 z-20">
      <div className="liquid-glass px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevious}
            disabled={currentQuestion === 1}
            className="ios-btn ios-btn--light"
          >
            Previous
          </button>

          <span className="text-[#6B7280] font-semibold">
            {currentQuestion} of {totalQuestions}
          </span>

          <button
            onClick={onNext}
            disabled={currentQuestion === totalQuestions}
            className={currentQuestion === totalQuestions ? 'ios-btn ios-btn--light' : 'ios-btn ios-btn--primary'}
          >
            Next Question
          </button>

          {currentQuestion === totalQuestions && (
            <button
              onClick={onSubmit}
              className="ios-btn ios-btn--primary ml-2"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingNavigation;
