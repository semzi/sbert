export type Session = {
  id: string;
  label: string; // e.g. "2024/2025"
  isCurrent: boolean;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  students: number;
  status: 'Active' | 'Draft';
};

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Maintain for backward compatibility
  email: string;
  matricNo: string;
  courses: string[]; // Course IDs
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string; // e.g. "CA 1", "CA 2", "Final Exam"
  status: 'Draft' | 'Active';
  
  // Instance settings
  calculatorType: 'None' | 'Basic' | 'Scientific';
  durationMinutes: number;
  defaultMark?: number;
}

export type QuestionType = 'MCQ' | 'Fill-in-gap' | 'Essay';

export type Question = {
  id: string;
  courseId: string;
  assessmentId: string; // Linked to a specific assessment instance
  type: QuestionType;
  questionText: string;
  mark?: number;
  
  // MCQ specific
  options?: string[];
  correctOption?: number;
  
  // Fill-in-gap specific
  gapAnswer?: string;
  
  // Essay specific
  referenceAnswer?: string;
  threshold: number; // 0-100
  minCharacters?: number;
  maxCharacters?: number;
};

export type Submission = {
  id: string;
  studentId: string;
  questionId: string;
  assessmentId: string;
  courseId: string;
  studentAnswer: string;
  score: number;
  status: 'Pending' | 'Graded';
  aiFeedback?: string;
  similarityScore?: number;
};

export type Attempt = {
  id: string;
  studentId: string;
  assessmentId: string;
  status: 'In_Progress' | 'Submitted' | 'Graded';
  totalScore: number;
  updatedAt: string;
};
