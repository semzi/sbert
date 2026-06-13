import { useState } from 'react';
import { useApp } from '../../context/AppContext';

function ResultsPage() {
  const { courses, assessments, attempts, students, questions, submissions } = useApp();

  // Navigation state
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeAssessment = assessments.find(a => a.id === activeAssessmentId);

  // Assessments for the active course
  const courseAssessments = activeCourseId
    ? assessments.filter(a => a.courseId === activeCourseId)
    : [];

  // Filter for completed/submitted attempts for the active assessment
  const assessmentAttempts = activeAssessmentId
    ? attempts.filter(a => a.assessmentId === activeAssessmentId && (a.status === 'Submitted' || a.status === 'Graded'))
    : [];

  // Calculate Max Score for active assessment
  const maxScore = activeAssessmentId 
    ? questions.filter(q => q.assessmentId === activeAssessmentId).reduce((sum, q) => sum + (q.mark || 0), 0)
    : 1;

  // Enrich with student info and breakdown
  const resultRows = assessmentAttempts.map(att => {
    const student = students.find(s => s.id === att.studentId);
    // Breakdown and Total Calculation
    const studentSubs = submissions.filter(s => s.studentId === att.studentId && s.assessmentId === activeAssessmentId);
    
    // Summing up submissions to ensure we have the latest "calculated together" score
    const calculatedTotal = studentSubs.reduce((sum, s) => sum + s.score, 0);
    const finalScore = calculatedTotal > 0 ? calculatedTotal : att.totalScore;
    
    const mcqScore = studentSubs.filter(s => questions.find(q => q.id === s.questionId)?.type === 'MCQ')
                               .reduce((sum, s) => sum + s.score, 0);
    const theoryScore = finalScore - mcqScore;
    
    const percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    return {
      ...att,
      score: finalScore,
      percentage: Math.round(percentage),
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      matricNo: student?.matricNo || '—',
      mcqScore,
      theoryScore
    };
  });

  // Stats per assessment
  const getAssessmentStats = (assessmentId: string) => {
    const assessmentQs = questions.filter(q => q.assessmentId === assessmentId);
    if (!assessmentQs || assessmentQs.length === 0) {
        return { total: 0, avg: null, passed: 0, failed: 0 };
    }
    const aMaxScore = assessmentQs.reduce((sum, q) => sum + (q.mark || 0), 0) || 1;
    
    const atts = attempts.filter(a => a.assessmentId === assessmentId && (a.status === 'Submitted' || a.status === 'Graded'));
    
    // Calculate accurate average by summing submissions for each attempt
    const totalPointsAcrossAll = atts.reduce((sum, att) => {
        const studentSubs = (submissions || []).filter(s => s.studentId === att.studentId && s.assessmentId === assessmentId);
        const calculatedTotal = studentSubs.reduce((sSum, s) => sSum + s.score, 0);
        return sum + (calculatedTotal > 0 ? calculatedTotal : att.totalScore || 0);
    }, 0);

    const avgScore = atts.length > 0 ? totalPointsAcrossAll / atts.length : null;
    
    const passMark = 40; // Standard pass mark
    const avgPercentage = avgScore !== null ? Math.round((avgScore / aMaxScore) * 100) : null;
    
    const passedCount = atts.filter(att => {
        const studentSubs = (submissions || []).filter(s => s.studentId === att.studentId && s.assessmentId === assessmentId);
        const calculatedTotal = studentSubs.reduce((sSum, s) => sSum + s.score, 0);
        const finalScore = calculatedTotal > 0 ? calculatedTotal : att.totalScore || 0;
        return (finalScore / aMaxScore) * 100 >= passMark;
    }).length;

    const failedCount = atts.length - passedCount;
    
    return { total: atts.length, avg: avgPercentage, passed: passedCount, failed: failedCount };
  };

  // Overall Course Results logic
  const courseMaxScore = activeCourseId
    ? questions.filter(q => courseAssessments.some(a => a.id === q.assessmentId)).reduce((sum, q) => sum + (q.mark || 0), 0) || 1
    : 1;

  const courseOverallResults = activeCourseId
    ? students
        .filter(s => s.courses.includes(activeCourseId))
        .map(student => {
          const studentSubs = submissions.filter(
            sub => sub.studentId === student.id && courseAssessments.some(a => a.id === sub.assessmentId)
          );
          
          const studentAttempts = attempts.filter(
            a => a.studentId === student.id && courseAssessments.some(ca => ca.id === a.assessmentId) && (a.status === 'Submitted' || a.status === 'Graded')
          );

          let totalScore = studentSubs.reduce((sum, s) => sum + s.score, 0);
          if (totalScore === 0 && studentAttempts.length > 0) {
              totalScore = studentAttempts.reduce((sum, att) => sum + att.totalScore, 0);
          }

          const percentage = courseMaxScore > 0 ? (totalScore / courseMaxScore) * 100 : 0;

          return {
            student,
            totalScore,
            percentage: Math.round(percentage),
            attemptsCount: studentAttempts.length
          };
        })
        .filter(r => r.attemptsCount > 0)
        .sort((a, b) => b.totalScore - a.totalScore)
    : [];

  // Stats per course
  const getCourseStats = (courseId: string) => {
    const courseAssessments = assessments.filter(a => a.courseId === courseId);
    const allAtts = attempts.filter(att => 
        courseAssessments.some(a => a.id === att.assessmentId) && 
        (att.status === 'Submitted' || att.status === 'Graded')
    );
    
    const passMark = 40;
    const passedAtts = allAtts.filter(att => {
        const assessment = assessments.find(a => a.id === att.assessmentId);
        if (!assessment) return false;

        const aQs = questions.filter(q => q.assessmentId === assessment.id);
        const aMaxScore = aQs.reduce((sum, q) => sum + (q.mark || 0), 0) || 1;
        
        const studentSubs = (submissions || []).filter(s => s.studentId === att.studentId && s.assessmentId === assessment.id);
        const calculatedTotal = studentSubs.reduce((sSum, s) => sSum + s.score, 0);
        const finalScore = calculatedTotal > 0 ? calculatedTotal : att.totalScore || 0;
        
        return (finalScore / aMaxScore) * 100 >= passMark;
    });

    return {
      assessmentCount: courseAssessments.length,
      submissionCount: allAtts.length,
      passRate: allAtts.length > 0 ? Math.round((passedAtts.length / allAtts.length) * 100) : null
    };
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeAssessment || resultRows.length === 0) return;

    const headers = ['Matric No', 'Student Name', 'Total Score', 'Percentage'];
    const rows = resultRows.map(r => [
      r.matricNo,
      r.studentName,
      r.score,
      `${r.percentage}%`,
    ]);

    const csvContent = [
      `# ${activeCourse?.code} - ${activeAssessment.title} (Max Score: ${maxScore})`,
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${activeCourse?.code}_${activeAssessment.title.replace(/\s+/g, '_')}_Results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-6">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {(activeCourseId || activeAssessmentId) && (
            <button
              type="button"
              onClick={() => {
                if (activeAssessmentId) { setActiveAssessmentId(null); }
                else { setActiveCourseId(null); }
              }}
              className="ios-icon-btn"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <div className="q-muted text-sm font-semibold">
              {activeAssessment
                ? `${activeCourse?.code} · ${activeAssessment.title}`
                : activeCourse
                ? `${activeCourse.code} · ${courseAssessments.length} assessment${courseAssessments.length !== 1 ? 's' : ''}`
                : 'Analytics'}
            </div>
            <div className="text-2xl font-bold q-text">
              {activeAssessment
                ? 'Student Results'
                : activeCourse
                ? activeCourse.title
                : 'Results'}
            </div>
          </div>
        </div>

        {/* Action buttons — only visible on the results table view */}
        {activeAssessmentId && resultRows.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="ios-btn ios-btn--light flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Sheet
            </button>
            <button
              type="button"
              className="ios-btn ios-btn--primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Publish Results
            </button>
          </div>
        )}
      </div>

      {/* ── Level 1 — Course Tiles ───────────────────────────────────────────── */}
      {!activeCourseId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(course => {
            const stats = getCourseStats(course.id);
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setActiveCourseId(course.id)}
                className="liquid-glass p-6 text-left group transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    course.status === 'Active'
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {course.status}
                  </span>
                </div>

                <div className="text-xs font-black q-muted uppercase tracking-widest mb-1">{course.code}</div>
                <div className="text-lg font-bold q-text leading-tight mb-4">{course.title}</div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Assessments', value: stats.assessmentCount },
                    { label: 'Submissions', value: stats.submissionCount },
                    { label: 'Success Rate', value: stats.passRate !== null ? `${stats.passRate}%` : '—' }
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="text-xl font-black q-text">{stat.value}</div>
                      <div className="text-[8px] font-black q-muted uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-purple-600 text-xs font-black uppercase tracking-widest">
                  <span>View results</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Level 2 — Assessment Instances ──────────────────────────────────── */}
      {activeCourseId && !activeAssessmentId && (
        <>
          {courseAssessments.length === 0 ? (
            <div className="liquid-glass p-12 text-center opacity-40">
              <div className="text-lg font-bold q-text mb-1">No assessments found</div>
              <p className="text-sm q-muted">Create assessments in the Questions tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseAssessments.map(assessment => {
                const stats = getAssessmentStats(assessment.id);

                return (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => setActiveAssessmentId(assessment.id)}
                    className="liquid-glass p-6 text-left group transition-all duration-200 hover:scale-[1.01] hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="text-[10px] font-black q-muted uppercase tracking-widest mb-1">
                          {activeCourse?.code} · {assessment.durationMinutes} min
                        </div>
                        <div className="text-lg font-bold q-text">{assessment.title}</div>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        assessment.status === 'Active'
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        {assessment.status === 'Active' ? 'Published' : 'Not Published'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-4 mb-3">
                      <div>
                        <div className="text-xl font-black q-text">{stats.total}</div>
                        <div className="text-[9px] font-black q-muted uppercase tracking-widest">Submitted</div>
                      </div>
                      <div className="h-8 w-[1px] bg-black/5"></div>
                      <div>
                        <div className="text-xl font-black text-green-600">{stats.passed}</div>
                        <div className="text-[9px] font-black q-muted uppercase tracking-widest">Passed</div>
                      </div>
                      <div className="h-8 w-[1px] bg-black/5"></div>
                      <div>
                        <div className="text-xl font-black text-red-600">{stats.failed}</div>
                        <div className="text-[9px] font-black q-muted uppercase tracking-widest">Failed</div>
                      </div>
                    </div>

                    {stats.avg !== null && (
                      <div className="flex items-center gap-2 mt-2 mb-4">
                        <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          stats.avg >= 70 ? 'bg-green-500/10 text-green-700' : 
                          stats.avg >= 40 ? 'bg-amber-500/10 text-amber-700' : 
                          'bg-red-500/10 text-red-700'
                        }`}>
                          Course Avg: {stats.avg}%
                        </div>
                      </div>
                    )}

                    {/* Quick scores preview */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-black/5">
                        <div className="text-[9px] font-black q-muted uppercase tracking-widest mb-2">Recent Results</div>
                        {attempts
                          .filter(at => at.assessmentId === assessment.id && (at.status === 'Submitted' || at.status === 'Graded'))
                          .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .slice(0, 3)
                          .map((att, i) => {
                            const student = students.find(s => s.id === att.studentId);
                            const qCount = questions.filter(q => q.assessmentId === assessment.id);
                            const max = qCount.reduce((sum, q) => sum + (q.mark || 0), 0) || 1;
                            const perc = Math.round((att.totalScore / max) * 100);
                            return (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold q-text truncate max-w-[120px]">{student?.firstName} {student?.lastName}</span>
                                    <span className="font-black text-purple-700">{perc}%</span>
                                </div>
                            );
                        })}
                        {stats.total > 3 && (
                            <div className="text-[10px] italic q-muted mt-1">+{stats.total - 3} more...</div>
                        )}
                        {stats.total === 0 && (
                            <div className="text-[10px] italic q-muted py-1">No submissions yet</div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-purple-600 text-xs font-black uppercase tracking-widest">
                      <span>View student results</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Level 2.5 — Course Overall Results Table ──────────────────────── */}
          {courseAssessments.length > 0 && courseOverallResults.length > 0 && (
            <div className="liquid-glass p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold q-text">Overall Course Results</h3>
                  <p className="text-sm q-muted">Aggregated scores across all assessments in this course</p>
                </div>
                <div className="bg-purple-500/10 text-purple-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-purple-500/20">
                  Max Score: {courseMaxScore}
                </div>
              </div>
              
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="q-muted border-b border-black/5">
                      <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">#</th>
                      <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Matric No</th>
                      <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Student Name</th>
                      <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Assessments Taken</th>
                      <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Total Score</th>
                      <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseOverallResults.map((row, idx) => (
                      <tr key={row.student.id} className="border-t border-black/5 hover:bg-black/3 transition-colors">
                        <td className="py-3.5 pr-4 text-xs q-muted font-semibold">{idx + 1}</td>
                        <td className="py-3.5 pr-4 font-black text-purple-700 text-xs font-mono">{row.student.matricNo}</td>
                        <td className="py-3.5 pr-4 font-semibold q-text">{row.student.firstName} {row.student.lastName}</td>
                        <td className="py-3.5 pr-4 font-semibold q-text">{row.attemptsCount} / {courseAssessments.length}</td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black q-text">
                              {row.totalScore.toFixed(1)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${
                              row.percentage >= 70 ? 'bg-green-500/10 text-green-700' : 
                              row.percentage >= 40 ? 'bg-amber-500/10 text-amber-700' : 
                              'bg-red-500/10 text-red-700'
                            }`}>
                              {row.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${
                              row.percentage >= 40 ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 
                              'bg-red-500/10 text-red-700 border border-red-500/20'
                          }`}>
                              {row.percentage >= 40 ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Level 3 — Student Results Table ─────────────────────────────────── */}
      {activeAssessmentId && (
        <div className="liquid-glass p-6">
          {resultRows.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 q-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-lg font-bold q-text mb-1">No submissions yet</div>
              <p className="text-sm q-muted">Students haven't submitted for this assessment.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Total Submissions', value: resultRows.length, color: 'text-purple-700' },
                  {
                    label: 'Average Score',
                    value: resultRows.length > 0
                      ? Math.round(resultRows.reduce((s, r) => s + r.score, 0) / resultRows.length) + '%'
                      : '—',
                    color: 'text-blue-700'
                  },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/50 rounded-2xl p-4 border border-black/5">
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[9px] font-black q-muted uppercase tracking-widest mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="q-muted border-b border-black/5">
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">#</th>
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Matric No</th>
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Student Name</th>
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Score (/ {maxScore})</th>
                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, idx) => (
                    <tr key={row.id} className="border-t border-black/5 hover:bg-black/3 transition-colors">
                      <td className="py-3.5 pr-4 text-xs q-muted font-semibold">{idx + 1}</td>
                      <td className="py-3.5 pr-4 font-black text-purple-700 text-xs font-mono">{row.matricNo}</td>
                      <td className="py-3.5 pr-4 font-semibold q-text">{row.studentName}</td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-base font-black q-text">
                                    {row.score.toFixed(1)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${
                                    row.percentage >= 70 ? 'bg-green-500/10 text-green-700' : 
                                    row.percentage >= 40 ? 'bg-amber-500/10 text-amber-700' : 
                                    'bg-red-500/10 text-red-700'
                                }`}>
                                    {row.percentage}%
                                </span>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[9px] font-bold q-muted uppercase">OBJ: {row.mcqScore.toFixed(1)}</span>
                                <span className="text-[9px] font-bold q-muted uppercase">THY: {row.theoryScore.toFixed(1)}</span>
                            </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${
                            row.percentage >= 40 ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 
                            'bg-red-500/10 text-red-700 border border-red-500/20'
                        }`}>
                            {row.percentage >= 40 ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsPage;
