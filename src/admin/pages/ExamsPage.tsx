import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ── colour palette ─────────────────────────────────────────────────────────── */
const PALETTE = {
  purple:  '#2B1A66',
  gold:    '#F2C94C',
  green:   '#22C55E',
  red:     '#EF4444',
  amber:   '#F59E0B',
  sky:     '#0EA5E9',
  violet:  '#8B5CF6',
  rose:    '#F43F5E',
  teal:    '#14B8A6',
  indigo:  '#6366F1',
};
const GRADE_COLORS: Record<string, string> = {
  A: '#22C55E',
  B: '#0EA5E9',
  C: '#F2C94C',
  D: '#F59E0B',
  F: '#EF4444',
};

/* ── helpers ────────────────────────────────────────────────────────────────── */
function gradeFromScore(score: number): string {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

const tooltipStyle = {
  borderRadius: 20,
  border: 'none',
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(10px)',
  fontSize: 13,
  fontWeight: 600,
};

/* ── stat card ──────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub: string; accent?: string;
}) {
  return (
    <div className="liquid-glass p-6 bg-white/40 border border-black/5 group hover:scale-[1.02] transition-transform duration-300">
      <div className="q-muted text-[9px] font-black uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent || 'q-text'}`}>{value}</div>
      <div className="mt-1 q-muted text-sm font-medium">{sub}</div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────────────── */
function ExamsPage() {
  const { courses, students, assessments, submissions, questions, attempts } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  /* ── derive analytics ───────────────────────────────────────────────────── */
  const analytics = useMemo(() => {
    const filteredCourses = selectedCourseId === 'all'
      ? courses
      : courses.filter(c => c.id === selectedCourseId);

    const courseIds = new Set(filteredCourses.map(c => c.id));

    const filteredAssessments = assessments.filter(a => courseIds.has(a.courseId));
    const filteredSubmissions = submissions.filter(s => courseIds.has(s.courseId));
    const filteredQuestions   = questions.filter(q => courseIds.has(q.courseId));
    const filteredStudents    = students.filter(st => st.courses.some(cid => courseIds.has(cid)));

    // Join with assessment to get courseId for accurate filtering
    const trueFilteredAttempts = attempts.filter(att => {
        const assessment = assessments.find(a => a.id === att.assessmentId);
        return assessment && (selectedCourseId === 'all' || assessment.courseId === selectedCourseId) && (att.status === 'Submitted' || att.status === 'Graded');
    });

    const gradedAttempts = trueFilteredAttempts;
    const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'Pending');

    const getFullScore = (assessmentId: string) => questions.filter(q => q.assessmentId === assessmentId).reduce((sum, q) => sum + (q.mark || 0), 0) || 1;

    const attemptData = trueFilteredAttempts.map(att => {
        const max = getFullScore(att.assessmentId);
        return {
            ...att,
            percentage: (att.totalScore / max) * 100
        };
    });

    const avgScore = attemptData.length > 0
      ? Math.round(attemptData.reduce((sum, a) => sum + a.percentage, 0) / attemptData.length)
      : 0;

    const passCount = attemptData.filter(a => a.percentage >= 45).length; // Pass mark is 45 in this system
    const failCount = attemptData.length - passCount;
    const passRate  = attemptData.length > 0 ? Math.round((passCount / attemptData.length) * 100) : 0;

    // Grade distribution
    const gradeMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    attemptData.forEach(a => { gradeMap[gradeFromScore(a.percentage)]++; });
    const gradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({
      grade,
      count,
      fill: GRADE_COLORS[grade],
    }));

    // Score distribution (bins)
    const bins = [
      { range: '0-19', min: 0, max: 19, count: 0 },
      { range: '20-39', min: 20, max: 39, count: 0 },
      { range: '40-49', min: 40, max: 49, count: 0 },
      { range: '50-59', min: 50, max: 59, count: 0 },
      { range: '60-69', min: 60, max: 69, count: 0 },
      { range: '70-79', min: 70, max: 79, count: 0 },
      { range: '80-89', min: 80, max: 89, count: 0 },
      { range: '90-100', min: 90, max: 100, count: 0 },
    ];
    attemptData.forEach(a => {
      const bin = bins.find(b => a.percentage >= b.min && a.percentage <= b.max);
      if (bin) bin.count++;
    });
    const scoreDistribution = bins.map(b => ({ range: b.range, students: b.count }));

    // Per-course pass rate
    const coursePassRates = courses.map(c => {
      const courseAtts = attempts.filter(at => {
          const a = assessments.find(ass => ass.id === at.assessmentId);
          return a && a.courseId === c.id && (at.status === 'Submitted' || at.status === 'Graded');
      });
      
      const courseAttData = courseAtts.map(at => {
          const max = getFullScore(at.assessmentId);
          return (at.totalScore / max) * 100;
      });

      const coursePass = courseAttData.filter(p => p >= 45).length;
      const rate = courseAttData.length > 0 ? Math.round((coursePass / courseAttData.length) * 100) : 0;
      const courseAvg = courseAttData.length > 0
        ? Math.round(courseAttData.reduce((sum, p) => sum + p, 0) / courseAttData.length)
        : 0;
      return { course: c.code, passRate: rate, avgScore: courseAvg, total: courseAttData.length };
    });

    // Submission status pie
    const statusPie = [
      { name: 'Graded', value: gradedAttempts.length },
      { name: 'Pending', value: pendingSubmissions.length },
    ].filter(d => d.value > 0);

    // Assessment performance (for the selected course or all)
    const assessmentPerformance = filteredAssessments.map(a => {
      const aAtts = attempts.filter(att => att.assessmentId === a.id && (att.status === 'Submitted' || att.status === 'Graded'));
      const max = getFullScore(a.id);
      
      const aPercentages = aAtts.map(att => (att.totalScore / max) * 100);
      
      const aAvg = aPercentages.length > 0
        ? Math.round(aPercentages.reduce((sum, p) => sum + p, 0) / aPercentages.length)
        : 0;
      const aPass = aPercentages.length > 0
        ? Math.round((aPercentages.filter(p => p >= 45).length / aPercentages.length) * 100)
        : 0;
      const course = courses.find(c => c.id === a.courseId);
      return {
        name: selectedCourseId === 'all' ? `${course?.code} – ${a.title}` : a.title,
        avgScore: aAvg,
        passRate: aPass,
        submissions: aAtts.length,
      };
    });

    // Radial gauge for pass rate
    const radialData = [
      { name: 'Pass Rate', value: passRate, fill: passRate >= 70 ? PALETTE.green : passRate >= 50 ? PALETTE.gold : PALETTE.red },
    ];

    return {
      filteredCourses,
      filteredAssessments,
      filteredSubmissions,
      filteredQuestions,
      filteredStudents,
      graded: gradedAttempts, 
      pending: pendingSubmissions,
      avgScore,
      passRate,
      passCount,
      failCount,
      gradeDistribution,
      scoreDistribution,
      coursePassRates,
      statusPie,
      assessmentPerformance,
      radialData,
    };
  }, [courses, students, assessments, submissions, questions, selectedCourseId]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="grid gap-6 animate-in fade-in duration-700">

      {/* ── Header + Course Selector ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-[#2B1A66] mb-1">
            Performance & Insights
          </div>
          <div className="text-3xl font-black q-text">Exam Analytics</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              id="course-selector"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="q-input pl-4 pr-10 py-2.5 rounded-2xl text-sm font-bold appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 q-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>


      {/* ── Viewing Label ───────────────────────────────────────────────────── */}
      {selectedCourseId !== 'all' && selectedCourse && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedCourseId('all')}
            className="ios-icon-btn"
            aria-label="Back to all courses"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="text-[10px] font-black q-muted uppercase tracking-widest">{selectedCourse.code}</div>
            <div className="text-lg font-bold q-text">{selectedCourse.title}</div>
          </div>
        </div>
      )}

      {/* ── Summary Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={analytics.filteredStudents.length}
          sub={`${analytics.filteredCourses.length} course${analytics.filteredCourses.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Submissions"
          value={analytics.filteredSubmissions.length}
          sub={`${analytics.graded.length} graded · ${analytics.pending.length} pending`}
        />
        <StatCard
          label="Average Score"
          value={analytics.graded.length > 0 ? `${analytics.avgScore}%` : '—'}
          sub={analytics.graded.length > 0 ? (analytics.avgScore >= 50 ? 'Above pass mark' : 'Below pass mark') : 'No graded submissions'}
          accent={analytics.avgScore >= 50 ? 'text-green-600' : 'text-red-500'}
        />
        <StatCard
          label="Pass Rate"
          value={analytics.graded.length > 0 ? `${analytics.passRate}%` : '—'}
          sub={analytics.graded.length > 0 ? `${analytics.passCount} pass · ${analytics.failCount} fail` : 'No graded submissions'}
          accent={analytics.passRate >= 70 ? 'text-green-600' : analytics.passRate >= 50 ? 'text-amber-500' : 'text-red-500'}
        />
      </div>

      {/* ── Charts Row 1: Pass Rate Gauge + Grade Distribution ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Radial Pass Rate Gauge */}
        <div className="liquid-glass p-8 lg:col-span-2 bg-white/30">
          <div className="mb-4">
            <div className="q-muted text-xs font-bold uppercase tracking-widest">Overall</div>
            <div className="q-text text-xl font-black">Pass Rate</div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {analytics.graded.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="60%" outerRadius="90%"
                  barSize={20}
                  data={analytics.radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    background={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    className="fill-current q-text" style={{ fontSize: 40, fontWeight: 900 }}>
                    {analytics.passRate}%
                  </text>
                  <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
                    className="fill-current q-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                    of students passed
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center opacity-40">
                <div className="text-lg font-bold q-text">No data</div>
                <div className="text-sm q-muted">Grade submissions to see pass rate</div>
              </div>
            )}
          </div>
        </div>

        {/* Grade Distribution Pie */}
        <div className="liquid-glass p-8 lg:col-span-3 bg-white/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="q-muted text-xs font-bold uppercase tracking-widest">Breakdown</div>
              <div className="q-text text-xl font-black">Grade Distribution</div>
            </div>
            {analytics.graded.length > 0 && (
              <div className="text-[10px] font-black q-muted uppercase tracking-widest">
                {analytics.graded.length} graded
              </div>
            )}
          </div>
          <div className="h-64 flex items-center">
            {analytics.graded.length > 0 ? (
              <div className="flex items-center w-full gap-6">
                <div className="w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.gradeDistribution.filter(g => g.count > 0)}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="grade"
                        strokeWidth={0}
                      >
                        {analytics.gradeDistribution.filter(g => g.count > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: any, name: any) => [`${value} student${value !== 1 ? 's' : ''}`, `Grade ${name}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 grid gap-2">
                  {analytics.gradeDistribution.map(g => (
                    <div key={g.grade} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.fill }} />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-bold q-text">Grade {g.grade}</span>
                        <span className="text-sm font-black q-muted">{g.count}</span>
                      </div>
                      <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: analytics.graded.length > 0 ? `${(g.count / analytics.graded.length) * 100}%` : '0%',
                            background: g.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full text-center opacity-40">
                <div className="text-lg font-bold q-text">No graded data</div>
                <div className="text-sm q-muted">Submissions need to be graded first</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Score Distribution + Submission Status ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Score Distribution Histogram */}
        <div className="liquid-glass p-8 lg:col-span-3 bg-white/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="q-muted text-xs font-bold uppercase tracking-widest">Distribution</div>
              <div className="q-text text-xl font-black">Score Ranges</div>
            </div>
            <div className="px-3 py-1 bg-purple-500/10 text-purple-700 rounded-full text-[10px] font-bold">
              Histogram
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.scoreDistribution} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.violet} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={PALETTE.purple} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  formatter={(value: any) => [`${value} student${value !== 1 ? 's' : ''}`, 'Count']}
                />
                <Bar dataKey="students" name="Students" radius={[12, 12, 0, 0]} fill="url(#barGrad)" barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submission Status */}
        <div className="liquid-glass p-8 lg:col-span-2 bg-white/30">
          <div className="mb-4">
            <div className="q-muted text-xs font-bold uppercase tracking-widest">Workflow</div>
            <div className="q-text text-xl font-black">Submission Status</div>
          </div>
          <div className="h-56 flex items-center justify-center">
            {analytics.filteredSubmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusPie}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    <Cell fill={PALETTE.green} />
                    {analytics.statusPie.length > 1 && <Cell fill={PALETTE.amber} />}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs font-bold q-text">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center opacity-40">
                <div className="text-lg font-bold q-text">No submissions</div>
              </div>
            )}
          </div>
          {/* Quick stats underneath */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-green-500/8 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-green-600">{analytics.graded.length}</div>
              <div className="text-[9px] font-black q-muted uppercase tracking-widest">Graded</div>
            </div>
            <div className="bg-amber-500/8 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-amber-500">{analytics.pending.length}</div>
              <div className="text-[9px] font-black q-muted uppercase tracking-widest">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Course Comparison (only in "All Courses" view) ──────────────────── */}
      {selectedCourseId === 'all' && (
        <div className="liquid-glass p-8 bg-white/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="q-muted text-xs font-bold uppercase tracking-widest">Comparison</div>
              <div className="q-text text-xl font-black">Pass Rate by Course</div>
            </div>
            <div className="px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-[10px] font-bold">
              Benchmark: 50%
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.coursePassRates} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  formatter={(value: any, name: any) => [`${value}%`, name === 'passRate' ? 'Pass Rate' : 'Avg Score']}
                />
                <Legend
                  verticalAlign="top"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs font-bold q-text">{value === 'passRate' ? 'Pass Rate' : 'Avg Score'}</span>}
                />
                <Bar dataKey="passRate" name="passRate" radius={[12, 12, 0, 0]} fill={PALETTE.green} barSize={28} />
                <Bar dataKey="avgScore" name="avgScore" radius={[12, 12, 0, 0]} fill={PALETTE.purple} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Course tiles underneath */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {analytics.coursePassRates.map(cp => (
              <button
                key={cp.course}
                type="button"
                onClick={() => {
                  const course = courses.find(c => c.code === cp.course);
                  if (course) setSelectedCourseId(course.id);
                }}
                className="q-option p-5 rounded-2xl text-left group transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-black q-text">{cp.course}</div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    cp.passRate >= 70 ? 'bg-green-500/10 text-green-700'
                    : cp.passRate >= 50 ? 'bg-amber-500/10 text-amber-700'
                    : 'bg-red-500/10 text-red-600'
                  }`}>
                    {cp.passRate}% pass
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cp.passRate}%`,
                      background: cp.passRate >= 70 ? PALETTE.green : cp.passRate >= 50 ? PALETTE.gold : PALETTE.red,
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black q-muted uppercase tracking-widest">
                  <span>Avg: {cp.avgScore}%</span>
                  <span>·</span>
                  <span>{cp.total} graded</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-purple-600 text-xs font-black uppercase tracking-widest">
                  <span>Drill down</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Assessment Performance (per-course or overall) ──────────────────── */}
      {analytics.assessmentPerformance.length > 0 && (
        <div className="liquid-glass p-8 bg-white/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="q-muted text-xs font-bold uppercase tracking-widest">Assessment Level</div>
              <div className="q-text text-xl font-black">Performance by Assessment</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.assessmentPerformance} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.purple} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PALETTE.purple} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="passFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PALETTE.green} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="rgba(107,114,128,0.8)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`${value}%`]} />
                <Legend
                  verticalAlign="top"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs font-bold q-text">{value}</span>}
                />
                <Area
                  type="monotone" dataKey="avgScore" name="Avg Score"
                  stroke={PALETTE.purple} strokeWidth={3} fill="url(#avgFill)"
                  dot={{ r: 4, fill: PALETTE.purple, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
                <Area
                  type="monotone" dataKey="passRate" name="Pass Rate"
                  stroke={PALETTE.green} strokeWidth={3} fill="url(#passFill)"
                  dot={{ r: 4, fill: PALETTE.green, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Question Bank & Assessments Summary ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="liquid-glass p-8 bg-white/30">
          <div className="mb-4">
            <div className="q-muted text-xs font-bold uppercase tracking-widest">Content</div>
            <div className="q-text text-xl font-black">Question Bank</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {['MCQ', 'Essay', 'Fill-in-gap'].map(type => {
              const count = analytics.filteredQuestions.filter(q => q.type === type).length;
              return (
                <div key={type} className="bg-white/50 rounded-2xl p-4 border border-black/5 text-center">
                  <div className="text-2xl font-black text-purple-700">{count}</div>
                  <div className="text-[9px] font-black q-muted uppercase tracking-widest mt-0.5">{type}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10">
            <div className="text-3xl font-black text-purple-700">{analytics.filteredQuestions.length}</div>
            <div className="text-[9px] font-black q-muted uppercase tracking-widest mt-0.5">Total Questions</div>
          </div>
        </div>

        <div className="liquid-glass p-8 bg-white/30">
          <div className="mb-4">
            <div className="q-muted text-xs font-bold uppercase tracking-widest">Activity</div>
            <div className="q-text text-xl font-black">Assessments Overview</div>
          </div>
          <div className="grid gap-3 mt-6">
            {analytics.filteredAssessments.length > 0 ? analytics.filteredAssessments.map(a => {
              const course = courses.find(c => c.id === a.courseId);
              const subs = analytics.filteredSubmissions.filter(s => s.assessmentId === a.id);
              return (
                <div key={a.id} className="q-option p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold q-text">{a.title}</div>
                    <div className="text-[10px] font-bold q-muted">{course?.code} · {a.durationMinutes} min</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black q-text">{subs.length}</div>
                      <div className="text-[9px] font-black q-muted uppercase">subs</div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                      a.status === 'Active' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 opacity-40">
                <div className="text-sm font-bold q-text">No assessments found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamsPage;
