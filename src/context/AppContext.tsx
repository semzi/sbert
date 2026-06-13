import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Course, Student, Question, Submission, Assessment, Session } from '../types';

interface AppContextType {
  sessions: Session[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  courses: Course[];
  students: Student[];
  questions: Question[];
  submissions: Submission[];
  assessments: Assessment[];
  attempts: Attempt[];
  
  // Actions
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  
  addStudent: (student: Student) => void;
  addStudents: (students: Student[]) => void;
  updateStudent: (student: Student) => void;
  removeStudent: (id: string) => void;
  assignStudentToCourse: (studentId: string, courseId: string) => void;
  
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (assessment: Assessment) => void;
  removeAssessment: (id: string) => void;
  
  addQuestion: (question: Question) => void;
  updateQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;
  
  addSubmission: (submission: Submission) => void;
  updateSubmission: (submission: Submission) => void;
  saveAttemptProgress: (attempt: { studentId: string; assessmentId: string; timeLeftSeconds: number; currentState: any; status?: string; total_score?: number }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const BASE_URL = 'http://localhost/thecircuit';
      
      try {
        const [
          sessionsRes, coursesRes, studentsRes, 
          assessmentsRes, questionsRes, submissionsRes, enrollmentsRes, attemptsRes
        ] = await Promise.all([
          fetch(`${BASE_URL}/sessions.php`).then(r => r.json()),
          fetch(`${BASE_URL}/courses.php`).then(r => r.json()),
          fetch(`${BASE_URL}/students.php`).then(r => r.json()),
          fetch(`${BASE_URL}/assessments.php`).then(r => r.json()),
          fetch(`${BASE_URL}/questions.php`).then(r => r.json()),
          fetch(`${BASE_URL}/submissions.php`).then(r => r.json()),
          fetch(`${BASE_URL}/enrollments.php`).then(r => r.json()),
          fetch(`${BASE_URL}/api.php?action=attempts`).then(r => r.json()),
        ]);

        if (Array.isArray(sessionsRes)) {
            setSessions(sessionsRes.map(s => ({
                id: s.id,
                label: s.label,
                isCurrent: s.is_current === 1 || s.is_current === true
            })));
            const current = sessionsRes.find(s => s.is_current == 1 || s.is_current === true);
            if (current) setActiveSessionId(current.id);
        }
        
        if (Array.isArray(coursesRes)) {
            setCourses(coursesRes.map(c => ({
                id: c.id,
                code: c.code,
                title: c.title,
                status: c.status,
                students: 0
            })));
        }

        if (Array.isArray(studentsRes)) {
            // Group enrollments by student_id
            const enrollmentsByStudent: Record<string, string[]> = {};
            if (Array.isArray(enrollmentsRes)) {
                enrollmentsRes.forEach((ent: any) => {
                    if (!enrollmentsByStudent[ent.student_id]) enrollmentsByStudent[ent.student_id] = [];
                    enrollmentsByStudent[ent.student_id].push(ent.course_id);
                });
            }

            setStudents(studentsRes.map(s => ({
                id: s.id,
                firstName: s.first_name,
                lastName: s.last_name,
                name: `${s.first_name} ${s.last_name}`,
                email: s.email,
                matricNo: s.matric_no,
                courses: enrollmentsByStudent[s.id] || []
            })));
        }

        if (Array.isArray(assessmentsRes)) {
            setAssessments(assessmentsRes.map(a => ({
                id: a.id,
                courseId: a.course_id,
                title: a.title,
                status: a.status,
                calculatorType: a.calculator_type,
                durationMinutes: a.duration_minutes
            })));
        }

        if (Array.isArray(questionsRes)) {
            setQuestions(questionsRes.map(q => ({
                id: q.id,
                courseId: q.course_id,
                assessmentId: q.assessment_id,
                type: q.type,
                questionText: q.question_text,
                mark: parseFloat(q.mark) || 0,
                ...(q.content || {})
            })));
        }

        if (Array.isArray(submissionsRes)) {
            setSubmissions(submissionsRes.map(s => ({
                id: s.id,
                studentId: s.student_id,
                assessmentId: s.assessment_id,
                courseId: s.course_id,
                questionId: s.question_id,
                studentAnswer: s.student_answer,
                score: parseFloat(s.score) || 0,
                status: s.status,
                similarityScore: parseFloat(s.similarity_score) || undefined,
                aiFeedback: s.ai_feedback
            })));
        }

        if (Array.isArray(attemptsRes)) {
            setAttempts(attemptsRes.map(a => ({
                id: a.id,
                studentId: a.student_id,
                assessmentId: a.assessment_id,
                status: a.status,
                totalScore: parseFloat(a.total_score) || 0,
                updatedAt: a.updated_at
            })));
        }
      } catch (e) {
        console.error("Failed to load DB data:", e);
      }
    };
    fetchData();
  }, []);

  // Actions
  const BASE_URL = 'http://localhost/thecircuit';

  const addCourse = (course: Course) => {
    fetch(`${BASE_URL}/courses.php`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: activeSessionId,
        code: course.code,
        title: course.title,
        status: course.status
      })
    }).then(res => res.json()).then(data => {
      setCourses(prev => [...prev, { ...course, id: data.id }]);
    }).catch(console.error);
  };
  const updateCourse = (course: Course) => {
    fetch(`${BASE_URL}/courses.php`, {
      method: 'PUT',
      body: JSON.stringify({
        id: course.id,
        session_id: activeSessionId,
        code: course.code,
        title: course.title,
        status: course.status
      })
    }).then(() => setCourses(prev => prev.map(c => c.id === course.id ? course : c))).catch(console.error);
  };
  const removeCourse = (id: string) => {
    fetch(`${BASE_URL}/courses.php`, { method: 'DELETE', body: JSON.stringify({ id }) })
      .then(() => setCourses(prev => prev.filter(c => c.id !== id))).catch(console.error);
  };

  const addStudent = (student: Student) => {
    fetch(`${BASE_URL}/students.php`, {
      method: 'POST',
      body: JSON.stringify({
        matric_no: student.matricNo,
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email
      })
    }).then(res => res.json()).then(data => {
      setStudents(prev => [...prev, { ...student, id: data.id }]);
    }).catch(console.error);
  };
  const addStudents = (newStudents: Student[]) => {
    Promise.all(newStudents.map(student => 
      fetch(`${BASE_URL}/students.php`, {
        method: 'POST',
        body: JSON.stringify({
          matric_no: student.matricNo,
          first_name: student.firstName,
          last_name: student.lastName,
          email: student.email
        })
      }).then(res => res.json()).then(data => ({ ...student, id: data.id }))
    )).then(created => {
      setStudents(prev => [...prev, ...created]);
    }).catch(console.error);
  };
  const updateStudent = (student: Student) => {
    fetch(`${BASE_URL}/students.php`, {
      method: 'PUT',
      body: JSON.stringify({
        id: student.id,
        matric_no: student.matricNo,
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email
      })
    }).then(() => setStudents(prev => prev.map(s => s.id === student.id ? student : s))).catch(console.error);
  };
  const removeStudent = (id: string) => {
    fetch(`${BASE_URL}/students.php`, { method: 'DELETE', body: JSON.stringify({ id }) })
      .then(() => setStudents(prev => prev.filter(s => s.id !== id))).catch(console.error);
  };
  
  const assignStudentToCourse = (studentId: string, courseId: string) => {
    fetch(`${BASE_URL}/enrollments.php`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, course_id: courseId })
    }).then(() => {
      setStudents(prev => prev.map(s => s.id === studentId 
          ? { ...s, courses: Array.from(new Set([...s.courses, courseId])) } 
          : s));
    }).catch(console.error);
  };

  const addAssessment = (assessment: Assessment) => {
    fetch(`${BASE_URL}/assessments.php`, {
      method: 'POST',
      body: JSON.stringify({
        course_id: assessment.courseId,
        title: assessment.title,
        status: assessment.status,
        calculator_type: assessment.calculatorType,
        duration_minutes: assessment.durationMinutes,
        default_mark: assessment.defaultMark || 0
      })
    }).then(res => res.json()).then(data => {
      setAssessments(prev => [...prev, { ...assessment, id: data.id }]);
    }).catch(console.error);
  };
  const updateAssessment = (assessment: Assessment) => {
    fetch(`${BASE_URL}/assessments.php`, {
      method: 'PUT',
      body: JSON.stringify({
        id: assessment.id,
        course_id: assessment.courseId,
        title: assessment.title,
        status: assessment.status,
        calculator_type: assessment.calculatorType,
        duration_minutes: assessment.durationMinutes,
        default_mark: assessment.defaultMark
      })
    }).then(() => setAssessments(prev => prev.map(a => a.id === assessment.id ? assessment : a))).catch(console.error);
  };
  const removeAssessment = (id: string) => {
    fetch(`${BASE_URL}/assessments.php`, { method: 'DELETE', body: JSON.stringify({ id }) })
      .then(() => setAssessments(prev => prev.filter(a => a.id !== id))).catch(console.error);
  };

  const addQuestion = (question: Question) => {
    const { id, courseId, assessmentId, type, questionText, mark, ...content } = question;
    
    fetch(`${BASE_URL}/questions.php`, {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        assessment_id: assessmentId,
        type: type,
        question_text: questionText,
        mark: mark,
        content: content
      })
    }).then(res => res.json()).then(data => {
      setQuestions(prev => [...prev, { ...question, id: data.id }]);
    }).catch(console.error);
  };
  const updateQuestion = (question: Question) => {
    const { id, courseId, assessmentId, type, questionText, mark, ...content } = question;

    fetch(`${BASE_URL}/questions.php`, {
      method: 'PUT',
      body: JSON.stringify({
        id: id,
        course_id: courseId,
        assessment_id: assessmentId,
        type: type,
        question_text: questionText,
        mark: mark,
        content: content
      })
    }).then(() => setQuestions(prev => prev.map(q => q.id === question.id ? question : q))).catch(console.error);
  };
  const removeQuestion = (id: string) => {
    fetch(`${BASE_URL}/questions.php`, { method: 'DELETE', body: JSON.stringify({ id }) })
      .then(() => setQuestions(prev => prev.filter(q => q.id !== id))).catch(console.error);
  };

  const addSubmission = (submission: Submission) => {
    fetch(`${BASE_URL}/submissions.php`, {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: 'default',
        student_id: submission.studentId,
        course_id: submission.courseId,
        assessment_id: submission.assessmentId,
        question_id: submission.questionId,
        student_answer: submission.studentAnswer,
        score: submission.score,
        status: submission.status,
        ai_feedback: submission.aiFeedback,
        similarity_score: submission.similarityScore
      })
    }).then(res => res.json()).then(data => {
      setSubmissions(prev => [...prev, { ...submission, id: data.id }]);
    }).catch(console.error);
  };
  const updateSubmission = (submission: Submission) => {
    fetch(`${BASE_URL}/submissions.php`, {
      method: 'PUT',
      body: JSON.stringify({
        id: submission.id,
        student_id: submission.studentId,
        course_id: submission.courseId,
        assessment_id: submission.assessmentId,
        question_id: submission.questionId,
        student_answer: submission.studentAnswer,
        score: submission.score,
        status: submission.status,
        ai_feedback: submission.aiFeedback,
        similarity_score: submission.similarityScore
      })
    }).then(() => setSubmissions(prev => prev.map(s => s.id === submission.id ? submission : s))).catch(console.error);
  };

  const saveAttemptProgress = (attempt: { studentId: string; assessmentId: string; timeLeftSeconds: number; currentState: any; status?: string; total_score?: number }) => {
    fetch(`${BASE_URL}/save_attempt.php`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: attempt.studentId,
        assessment_id: attempt.assessmentId,
        time_left_seconds: attempt.timeLeftSeconds,
        current_state: attempt.currentState,
        status: attempt.status || 'In_Progress',
        total_score: attempt.total_score || 0
      })
    }).then(() => {
        // Refresh attempts after saving if status is Submitted
        if (attempt.status === 'Submitted') {
            fetch(`${BASE_URL}/api.php?action=attempts&assessment_id=${attempt.assessmentId}`)
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const mapped = data.map(a => ({
                            id: a.id,
                            studentId: a.student_id,
                            assessmentId: a.assessment_id,
                            status: a.status,
                            totalScore: parseFloat(a.total_score) || 0,
                            updatedAt: a.updated_at
                        }));
                        setAttempts(prev => {
                            const otherAttempts = prev.filter(p => !mapped.some(m => m.id === p.id));
                            return [...otherAttempts, ...mapped];
                        });
                    }
                });
        }
    }).catch(console.error);
  };

  return (
    <AppContext.Provider value={{ 
      sessions, activeSessionId, setActiveSessionId,
      courses, students, questions, submissions, assessments, attempts,
      addCourse, updateCourse, removeCourse,
      addStudent, addStudents, updateStudent, removeStudent, assignStudentToCourse,
      addAssessment, updateAssessment, removeAssessment,
      addQuestion, updateQuestion, removeQuestion,
      addSubmission, updateSubmission, saveAttemptProgress
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
