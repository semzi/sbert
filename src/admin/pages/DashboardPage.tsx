import { useApp } from '../../context/AppContext';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const enrollmentTrend = [
  { month: 'Sep', students: 240 },
  { month: 'Oct', students: 310 },
  { month: 'Nov', students: 420 },
  { month: 'Dec', students: 530 },
  { month: 'Jan', students: 610 },
  { month: 'Feb', students: 680 },
];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="liquid-glass p-6 bg-white/40 border border-black/5">
      <div className="q-muted text-xs font-black uppercase tracking-widest">{label}</div>
      <div className="mt-2 text-4xl font-black q-text">{value}</div>
      <div className="mt-1 q-muted text-sm font-medium">{sub}</div>
    </div>
  );
}

function DashboardPage() {
  const { courses, students, submissions, questions } = useApp();
  const navigate = useNavigate();

  const performance = courses.map(c => ({
    course: c.code,
    passRate: Math.floor(Math.random() * 40) + 60 // Mock for now
  }));

  return (
    <div className="grid gap-6 animate-in fade-in duration-700">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-[#2B1A66] mb-1">Academic Insights</div>
          <div className="text-3xl font-black q-text">Dashboard</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/questions')} className="ios-btn ios-btn--light">Question Bank</button>
          <button onClick={() => navigate('/admin/essay-grading')} className="ios-btn ios-btn--primary">Start Grading</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Courses" value={courses.length} sub={`${courses.filter(c => c.status === 'Active').length} Active`} />
        <StatCard label="Enrollment" value={students.length} sub="Total Students" />
        <StatCard label="Question Bank" value={questions.length} sub="Unique Items" />
        <StatCard label="Pending Essays" value={submissions.filter(s => s.status === 'Pending').length} sub="Queue Size" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="liquid-glass p-8 lg:col-span-3 bg-white/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="q-muted text-xs font-bold uppercase tracking-widest">Growth Analytics</div>
              <div className="q-text text-xl font-black">Student Engagement</div>
            </div>
            <div className="px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-[10px] font-bold">+12.5%</div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="studentsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2B1A66" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2B1A66" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} stroke="rgba(107,114,128,0.8)" />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} stroke="rgba(107,114,128,0.8)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#2B1A66" 
                    strokeWidth={4} 
                    fill="url(#studentsFill)" 
                    dot={{ r: 4, fill: '#2B1A66', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="liquid-glass p-8 lg:col-span-2 bg-white/30">
          <div className="mb-6">
            <div className="q-muted text-xs font-bold uppercase tracking-widest">Performance</div>
            <div className="q-text text-xl font-black">Success Ratio</div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} stroke="rgba(107,114,128,0.8)" />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} stroke="rgba(107,114,128,0.8)" />
                <Tooltip
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                   contentStyle={{
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Bar dataKey="passRate" name="Pass Rate %" radius={[12, 12, 0, 0]} fill="#2B1A66" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

export default DashboardPage;
