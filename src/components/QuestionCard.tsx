import type { QuestionCardProps } from './types';

const QuestionCard = ({ questionNumber, questionType, points, question, children }: QuestionCardProps) => {
  return (
    <div className="liquid-glass p-6 mb-8">
      <div className="flex items-center mb-4">
        <span className="bg-[#2B1A66] text-white text-xs font-bold px-3 py-1 rounded-full mr-2">
          Question {questionNumber}
        </span>
        <span className="q-muted text-sm font-medium leading-5">{questionType} • {points} Points</span>
      </div>
      {question && <h2 className="text-lg font-semibold mb-4 q-text leading-7">{question}</h2>}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default QuestionCard;
