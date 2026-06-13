import { useState } from 'react';
import { calculateEssayGrade, initExtractor } from '../../lib/grading';

function EssayGradingPage() {
  // Model Status State
  const [modelStatus, setModelStatus] = useState<'Offline' | 'Loading' | 'Online'>('Offline');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  
  // Tester State
  const [testQuestion, setTestQuestion] = useState('Explain the concept of Web Architecture.');
  const [testReference, setTestReference] = useState('Web architecture is the conceptual structure and logical organization of a web-based system. It defines the interaction between the client, server, and database.');
  const [testAnswer, setTestAnswer] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    similarityScore: number;
    lexicalScore: number;
    passed: boolean;
    feedback: string;
  } | null>(null);

  const handleRunTest = async () => {
    if (!testAnswer || !testReference) return;

    setIsTesting(true);
    if (modelStatus !== 'Online') setModelStatus('Loading');
    
    try {
      const result = await calculateEssayGrade(
        testAnswer, 
        testReference, 
        70,
        (p) => {
            if (p.status === 'progress') setDownloadProgress(Math.round(p.progress));
            if (p.status === 'ready') setModelStatus('Online');
        }
      );
      setTestResult(result);
      setModelStatus('Online');
    } catch (err) {
      console.error("Error running SBERT test:", err);
      setModelStatus('Offline');
    } finally {
      setIsTesting(false);
      setDownloadProgress(0);
    }
  };

  const handlePreload = async () => {
    setModelStatus('Loading');
    setDownloadProgress(0);
    try {
        await initExtractor((p) => {
            if (p.status === 'progress') setDownloadProgress(Math.round(p.progress));
            if (p.status === 'ready') setModelStatus('Online');
        });
        setModelStatus('Online');
    } catch (err) {
        setModelStatus('Offline');
    } finally {
        setDownloadProgress(0);
    }
  };

  return (
    <div className="grid gap-8 p-4">
      {/* Model Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 p-8 rounded-[2rem] border border-white/40 shadow-sm shadow-purple-500/5">
        <div>
          <div className="q-muted text-xs font-black uppercase tracking-widest mb-1 opacity-60">AI Diagnostic Console</div>
          <div className="text-3xl font-black q-text">SBERT Semantic Engine</div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black q-muted uppercase tracking-tighter mb-1">Model Status</div>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                modelStatus === 'Online' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 
                modelStatus === 'Loading' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 
                'bg-slate-300'
              }`} />
              <span className={`text-sm font-black uppercase tracking-widest ${
                modelStatus === 'Online' ? 'text-green-700' : 
                modelStatus === 'Loading' ? 'text-amber-700' : 
                'q-muted'
              }`}>
                {modelStatus === 'Loading' && downloadProgress > 0 ? `Loading ${downloadProgress}%` : modelStatus}
              </span>
            </div>
          </div>
          
          {modelStatus !== 'Online' && (
            <button 
                onClick={handlePreload}
                disabled={modelStatus === 'Loading'}
                className="px-6 py-3 bg-purple-600 text-white text-xs font-black rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
            >
                {modelStatus === 'Loading' ? 'DOWNLOADING...' : 'INITIALIZE MODEL'}
            </button>
          )}
        </div>
      </div>

      {/* Tester Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Side */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
          <div className="liquid-glass p-8 flex flex-col gap-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h3 className="text-xl font-bold q-text">SBERT Direct Tester</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black q-muted uppercase tracking-widest mb-2">Theoretical Question</label>
                <input 
                  type="text" 
                  className="w-full p-4 rounded-2xl q-input border-white text-sm font-medium"
                  placeholder="e.g. What is the role of HTTP?"
                  value={testQuestion}
                  onChange={e => setTestQuestion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black q-muted uppercase tracking-widest mb-2">Reference / Gold Standard Answer</label>
                <textarea 
                  className="w-full p-6 rounded-3xl q-input border-white text-sm font-medium min-h-[120px] resize-none"
                  placeholder="Paste the perfect answer here..."
                  value={testReference}
                  onChange={e => setTestReference(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-black/5">
                <label className="block text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Student Submission to Analyze</label>
                <textarea 
                  className="w-full p-8 rounded-[2.5rem] bg-purple-500/5 q-input border-purple-500/10 focus:border-purple-500/30 text-lg font-medium min-h-[220px] resize-none shadow-inner"
                  placeholder="Type or paste the student's response..."
                  value={testAnswer}
                  onChange={e => setTestAnswer(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleRunTest}
                  disabled={isTesting || !testAnswer}
                  className={`ios-btn ios-btn--primary min-w-[240px] h-16 shadow-2xl shadow-purple-500/30 text-lg flex items-center justify-center gap-3 ${isTesting ? 'opacity-70' : ''}`}
                >
                  {isTesting ? (
                    <>
                      <span className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Mathematical Inference...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Analyze Semantic Match
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Side */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="liquid-glass p-8 h-full min-h-[400px] flex flex-col">
            <div className="text-[10px] font-black q-muted uppercase tracking-widest mb-6">Diagnostic Results</div>
            
            {testResult ? (
              <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-6 mb-10 bg-black/5 p-6 rounded-[2rem]">
                    <div className={`h-24 w-24 rounded-full border-8 flex items-center justify-center bg-white shadow-xl ${
                        testResult.passed ? 'border-green-500/30' : 'border-red-500/30'
                    }`}>
                        <div className="flex flex-col items-center">
                            <span className={`text-2xl font-black ${testResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                                {testResult.similarityScore}%
                            </span>
                            <span className="text-[8px] font-black q-muted uppercase tracking-tighter">Similarity</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${testResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult.passed ? '✓ SUCCESSFUL MATCH' : '✗ WEAK CORRELATION'}
                        </div>
                        <div className="text-sm q-text font-bold leading-tight">
                            The SBERT model detected a {testResult.similarityScore}% semantic alignment with the reference.
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/60 p-4 rounded-2xl border border-black/5">
                        <div className="text-[9px] font-black q-muted uppercase mb-1">Lexical Score</div>
                        <div className="text-xl font-bold q-text">{testResult.lexicalScore}%</div>
                        <div className="text-[8px] q-muted italic font-medium mt-1">Exact keyword matching</div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${testResult.passed ? 'bg-green-500/10 border-green-500/10' : 'bg-red-500/10 border-red-500/10'}`}>
                        <div className="text-[9px] font-black q-muted uppercase mb-1">AI Verdict</div>
                        <div className={`text-xl font-bold ${testResult.passed ? 'text-green-700' : 'text-red-700'}`}>{testResult.passed ? 'Pass' : 'Fail'}</div>
                        <div className="text-[8px] q-muted italic font-medium mt-1">Based on 70% threshold</div>
                    </div>
                </div>

                <div className="flex-1 bg-black/5 p-6 rounded-3xl border border-dashed border-black/10">
                    <div className="text-[10px] font-black q-muted uppercase mb-3">Model Detailed Feedback</div>
                    <div className="q-text text-sm font-medium leading-relaxed italic">
                        "{testResult.feedback}"
                    </div>
                </div>
              </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 q-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div className="text-lg font-bold q-text mb-2">Awaiting Input</div>
                  <p className="text-xs q-muted max-w-[240px]">Enter a student submission and click analyze to see cognitive comparison results.</p>
                </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default EssayGradingPage;
