export interface QuestionOptionProps {
  type: string;
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

export interface QuestionCardProps {
  questionNumber: number;
  questionType: string;
  points: string;
  question: string;
  children: React.ReactNode;
}

export interface FillGapProps {
  text: string;
  gapId: string;
  value: string;
  onChange: (gapId: string, value: string) => void;
}

export interface QuestionNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number[];
  onQuestionClick: (questionNumber: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onViewAll?: () => void;
  onSubmit?: () => void;
  isSubmitDisabled?: boolean;
}

export interface FloatingNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}
