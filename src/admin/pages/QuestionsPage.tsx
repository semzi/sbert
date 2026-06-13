import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Question, QuestionType, Assessment } from '../../types';

function QuestionsPage() {
  const { 
    questions, addQuestion, updateQuestion, removeQuestion, 
    courses, assessments, addAssessment, removeAssessment, updateAssessment 
  } = useApp();
  
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  
  const [newAssessment, setNewAssessment] = useState<Partial<Assessment>>({ 
    title: '', 
    status: 'Draft',
    calculatorType: 'None',
    durationMinutes: 60,
    defaultMark: 1
  });

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'Essay',
    questionText: '',
    threshold: 70,
    referenceAnswer: '',
    options: ['', '', '', ''],
    correctOption: 0,
    gapAnswer: '',
    mark: 1
  });

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);
  const courseAssessments = assessments.filter(a => a.courseId === selectedCourseId);
  const assessmentQuestions = questions.filter(q => q.assessmentId === selectedAssessmentId);

  const handleCreateAssessment = () => {
    if (newAssessment.title && selectedCourseId) {
      addAssessment({
        ...newAssessment as Assessment,
        id: Math.random().toString(36).substr(2, 9),
        courseId: selectedCourseId,
        status: 'Draft' // Always default to Draft
      });
      setShowAssessmentModal(false);
      setNewAssessment({ title: '', status: 'Draft', calculatorType: 'None', durationMinutes: 60, defaultMark: 1 });
    }
  };

  const handleRemoveAssessment = () => {
    if (assessmentToDelete) {
      removeAssessment(assessmentToDelete);
      setAssessmentToDelete(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingQuestionId(null);
    setNewQuestion({
      type: 'Essay',
      questionText: '',
      threshold: 70,
      referenceAnswer: '',
      options: ['', '', '', ''],
      correctOption: 0,
      gapAnswer: '',
      mark: selectedAssessment?.defaultMark || 1
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    
    // Ensure options is an array if it's an MCQ
    const cleanQuestion = { ...q };
    if (q.type === 'MCQ' && !Array.isArray(q.options)) {
      cleanQuestion.options = ['', '', '', ''];
    }
    
    setNewQuestion(cleanQuestion);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = () => {
    if (newQuestion.questionText && selectedAssessmentId && selectedCourseId) {
      const type = newQuestion.type;
      const questionData: any = {
        type: newQuestion.type,
        questionText: newQuestion.questionText,
        mark: newQuestion.mark,
        courseId: selectedCourseId,
        assessmentId: selectedAssessmentId,
        id: editingQuestionId || Math.random().toString(36).substr(2, 9)
      };

      if (type === 'MCQ') {
        questionData.options = newQuestion.options;
        questionData.correctOption = newQuestion.correctOption;
      } else if (type === 'Fill-in-gap') {
        questionData.gapAnswer = newQuestion.gapAnswer;
      } else if (type === 'Essay') {
        questionData.referenceAnswer = newQuestion.referenceAnswer;
        questionData.threshold = newQuestion.threshold;
        questionData.minCharacters = newQuestion.minCharacters;
        questionData.maxCharacters = newQuestion.maxCharacters;
      }

      if (editingQuestionId) {
        updateQuestion(questionData);
      } else {
        addQuestion(questionData);
      }
      setShowQuestionModal(false);
      setEditingQuestionId(null);
    }
  };

  // LEVEL 1: Select Course
  if (!selectedCourseId) {
    return (
      <div className="grid gap-6 animate-in fade-in duration-500">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-black tracking-[0.2em] text-[#2B1A66] mb-1">Assessment Bank</div>
            <div className="text-3xl font-black q-text">Select a Course</div>
          </div>
          <div className="flex bg-white/40 p-1 rounded-2xl border border-black/5">
            {['grid', 'list'].map(m => (
              <button 
                key={m} onClick={() => setViewMode(m as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${viewMode === m ? 'bg-[#2B1A66] text-white shadow-lg' : 'q-muted hover:bg-white/50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'liquid-glass'}>
            {viewMode === 'list' ? (
                <table className="w-full text-left">
                    <thead className="bg-white/30 text-[10px] font-black uppercase tracking-widest q-muted">
                        <tr><th className="p-6">Code</th><th className="p-6">Course Title</th><th className="p-6 text-center">Instances</th><th className="p-6 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {courses.map(course => (
                        <tr key={course.id} className="hover:bg-white/40 transition-colors group">
                            <td className="p-6 font-black q-text">{course.code}</td>
                            <td className="p-6 font-bold q-text">{course.title}</td>
                            <td className="p-6 text-center"><span className="bg-purple-500/10 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{assessments.filter(a => a.courseId === course.id).length}</span></td>
                            <td className="p-6 text-right"><button onClick={() => setSelectedCourseId(course.id)} className="ios-btn ios-btn--primary">Manage Bank</button></td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                courses.map(course => (
                <button key={course.id} onClick={() => setSelectedCourseId(course.id)} className="liquid-glass p-8 text-left group hover:scale-[1.02] transition-all bg-white/40 border-transparent hover:border-purple-500/30">
                    <div className="text-xs font-black text-purple-600 mb-2 uppercase tracking-widest">{course.code}</div>
                    <div className="text-xl font-black q-text mb-4 group-hover:text-purple-700 transition-colors">{course.title}</div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                        <div className="text-xs q-muted font-bold">{assessments.filter(a => a.courseId === course.id).length} Instances</div>
                        <div className="text-[10px] font-black uppercase bg-purple-500/10 text-purple-700 px-3 py-1 rounded-lg">Enter Studio</div>
                    </div>
                </button>
                ))
            )}
        </div>
      </div>
    );
  }

  // LEVEL 2: Select Assessment Instance (CA 1, CA 2, etc.)
  if (!selectedAssessmentId) {
    return (
      <div className="grid gap-6 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-end justify-between gap-4">
          <div>
            <button onClick={() => setSelectedCourseId(null)} className="text-[10px] uppercase font-black tracking-widest text-purple-600 mb-2 hover:gap-2 transition-all">← Back to Courses</button>
            <div className="text-3xl font-black q-text">{selectedCourse?.title} Instances</div>
          </div>
          <button onClick={() => setShowAssessmentModal(true)} className="ios-btn ios-btn--primary h-12 px-8">New Instance</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseAssessments.map(a => (
            <div key={a.id} className="liquid-glass p-8 bg-white/40 flex flex-col group relative overflow-visible">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${a.status === 'Active' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'}`}>{a.status}</span>
                    {a.calculatorType !== 'None' && <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700">{a.calculatorType} Calc</span>}
                  </div>
                  <button onClick={() => setAssessmentToDelete(a.id)} className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all">✕</button>
                </div>
                <div className="text-2xl font-black q-text mb-2">{a.title}</div>
                <div className="text-sm q-muted font-bold mb-6 flex items-center gap-2">
                    <span>{questions.filter(q => q.assessmentId === a.id).length} Items</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-black/10"></span>
                    <span>{a.durationMinutes} Minutes</span>
                </div>
                <button onClick={() => { setSelectedAssessmentId(a.id); setActiveTab('questions'); }} className="mt-auto ios-btn ios-btn--primary w-full py-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/10 hover:shadow-purple-900/20 transition-all">Configure Questions</button>
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {assessmentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
             <div className="liquid-glass max-w-sm w-full p-8 bg-white shadow-2xl text-center">
                <div className="text-4xl mb-4 text-red-500">⚠️</div>
                <h3 className="text-xl font-black q-text mb-2">Confirm Delete</h3>
                <p className="text-sm q-muted mb-8">This will permanently remove the assessment instance and all of its question sets.</p>
                <div className="flex gap-4">
                   <button onClick={() => setAssessmentToDelete(null)} className="flex-1 ios-btn ios-btn--light font-black uppercase text-[10px]">Cancel</button>
                   <button onClick={handleRemoveAssessment} className="flex-1 ios-btn bg-red-500 text-white font-black uppercase text-[10px] shadow-lg shadow-red-500/20">Delete All</button>
                </div>
             </div>
          </div>
        )}

        {showAssessmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
            <div className="liquid-glass max-w-lg w-full p-10 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-black q-text mb-8">Author New Instance</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase q-muted mb-2 tracking-widest text-[#2B1A66]">Assessment Title</label>
                        <input className="w-full p-5 rounded-2xl q-input border-white bg-gray-50 text-md font-bold" placeholder="e.g., Week 4 Quiz" value={newAssessment.title} onChange={e => setNewAssessment({...newAssessment, title: e.target.value})} />
                        <div className="mt-2 text-[9px] q-muted font-bold uppercase">Defaults to <span className="text-amber-600">Draft</span> status until deployed</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 opacity-50 pointer-events-none">
                        <div>
                            <label className="block text-[10px] font-black uppercase q-muted mb-2 tracking-widest">Initial Mins</label>
                            <div className="w-full p-4 rounded-2xl bg-gray-100 font-bold border border-black/5">60</div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase q-muted mb-2 tracking-widest">Calc Status</label>
                            <div className="w-full p-4 rounded-2xl bg-gray-100 font-bold border border-black/5 text-[10px]">LOCKED</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 mt-10">
                    <button onClick={() => setShowAssessmentModal(false)} className="flex-1 ios-btn ios-btn--light h-14">Cancel</button>
                    <button onClick={handleCreateAssessment} className="flex-1 ios-btn ios-btn--primary h-14 shadow-xl shadow-purple-900/20">Create Draft</button>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LEVEL 3: Manage Questions or Settings for Assessment
  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-end justify-between shrink-0">
        <div className="flex-1">
          <button onClick={() => setSelectedAssessmentId(null)} className="text-[10px] uppercase font-black tracking-widest text-purple-600 mb-2 hover:gap-2 transition-all flex items-center gap-1">← Return to Instances</button>
          <div className="flex items-center gap-4">
             <div className="text-3xl font-black q-text">{selectedAssessment?.title}</div>
             <div className="flex bg-white/40 p-1 rounded-2xl border border-black/5">
                <button onClick={() => setActiveTab('questions')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'questions' ? 'bg-[#2B1A66] text-white shadow-lg' : 'q-muted hover:bg-white/50'}`}>Questions</button>
                <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[#2B1A66] text-white shadow-lg' : 'q-muted hover:bg-white/50'}`}>Settings ⚙️</button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'questions' ? (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-xs q-muted font-bold uppercase tracking-widest">{assessmentQuestions.length} Items Configured</div>
                    <button onClick={handleOpenAdd} className="ios-btn ios-btn--primary px-8 h-12 shadow-xl shadow-purple-900/10 transition-all hover:scale-[1.02]">Add New Item</button>
                </div>
                {assessmentQuestions.length === 0 ? (
                    <div className="h-full liquid-glass flex flex-col items-center justify-center p-10 text-center">
                        <div className="text-6xl mb-6 grayscale opacity-50">📂</div>
                        <div className="text-2xl font-black q-text mb-2">No question sets established</div>
                        <div className="q-muted max-w-xs mb-8">Deploy assessment items for {selectedAssessment?.title} to begin academic evaluation.</div>
                        <button onClick={handleOpenAdd} className="ios-btn ios-btn--primary px-10 h-14">Begin Studio Build</button>
                    </div>
                ) : (
                    <div className="grid gap-4 pb-20">
                        {assessmentQuestions.map((q, idx) => (
                            <div key={q.id} className="liquid-glass p-6 bg-white/60 flex items-start justify-between gap-6 hover:shadow-xl transition-all border-none relative group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-purple-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${q.type === 'Essay' ? 'bg-indigo-500/10 text-indigo-700' : q.type === 'MCQ' ? 'bg-sky-500/10 text-sky-700' : 'bg-emerald-500/10 text-emerald-700'}`}>{q.type}</span>
                                    </div>
                                    <div className="font-bold q-text text-lg leading-tight mb-4 pr-12">{q.questionText}</div>
                                    {q.type === 'Essay' && <div className="text-[10px] q-muted font-bold line-clamp-1 italic px-4 py-2 bg-white/40 rounded-xl max-w-[500px]">Reference: {q.referenceAnswer?.substring(0, 80)}...</div>}
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all absolute right-6 top-6">
                                    <button onClick={() => handleEditQuestion(q)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg transition-all">✎</button>
                                    <button onClick={() => removeQuestion(q.id)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-red-500 border border-red-100 shadow-md">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
          ) : (
              <div className="max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
                  <div className="liquid-glass p-10 bg-white shadow-xl space-y-10">
                      <div className="flex justify-between items-start border-b border-black/5 pb-8">
                          <div><h3 className="text-xl font-black q-text mb-1">Configuration Studio</h3><p className="text-xs q-muted font-bold">Manage instance settings for students.</p></div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${selectedAssessment?.status === 'Active' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'}`}>{selectedAssessment?.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <label className="block text-[10px] font-black uppercase q-muted mb-3 tracking-widest text-[#2B1A66]">Assessment Title</label>
                              <input className="w-full p-4 rounded-2xl q-input border-gray-100 bg-gray-50 text-md font-bold" value={selectedAssessment?.title} onChange={e => updateAssessment({...selectedAssessment!, title: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black uppercase q-muted mb-3 tracking-widest text-[#2B1A66]">Deployment Status</label>
                              <select className="w-full p-4 rounded-2xl q-input border-gray-100 bg-gray-50 font-bold" value={selectedAssessment?.status} onChange={e => updateAssessment({...selectedAssessment!, status: e.target.value as any})}>
                                  <option value="Draft">Draft (Private)</option>
                                  <option value="Active">Active (Publish)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black uppercase q-muted mb-3 tracking-widest text-[#2B1A66]">Duration (Minutes)</label>
                              <input type="number" className="w-full p-4 rounded-2xl q-input border-gray-100 bg-gray-50 font-bold" value={selectedAssessment?.durationMinutes} onChange={e => updateAssessment({...selectedAssessment!, durationMinutes: parseInt(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black uppercase q-muted mb-3 tracking-widest text-[#2B1A66]">Calculator Type</label>
                              <select className="w-full p-4 rounded-2xl q-input border-gray-100 bg-gray-50 font-bold" value={selectedAssessment?.calculatorType} onChange={e => updateAssessment({...selectedAssessment!, calculatorType: e.target.value as any})}>
                                  <option value="None">Disabled</option>
                                  <option value="Basic">Basic Arithmetic</option>
                                  <option value="Scientific">Advanced Scientific</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black uppercase q-muted mb-3 tracking-widest text-[#2B1A66]">Default Mark/Item</label>
                              <input type="number" min="0" step="1" className="w-full p-4 rounded-2xl q-input border-gray-100 bg-gray-50 font-bold" value={selectedAssessment?.defaultMark || 1} onChange={e => updateAssessment({...selectedAssessment!, defaultMark: parseFloat(e.target.value)})} />
                          </div>
                      </div>

                      <div className="pt-8 border-t border-black/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase q-muted">Settings auto-save on change</span>
                          </div>
                          <button onClick={() => setSelectedAssessmentId(null)} className="ios-btn ios-btn--light px-8">Instance Dashboard</button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Item Builder Modal (Full VH Content) */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="liquid-glass max-w-4xl w-full h-[90vh] bg-white flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto">
                <div className="p-8 border-b border-black/5 flex items-center justify-between shrink-0 bg-gray-50/50">
                    <div>
                        <div className="text-2xl font-black q-text">{editingQuestionId ? 'Update Assessment Item' : 'Create Assessment Item'}</div>
                        <div className="text-[10px] uppercase font-black text-purple-600 tracking-widest">Target: {selectedAssessment?.title}</div>
                    </div>
                    <button onClick={() => setShowQuestionModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 q-muted hover:bg-gray-200 transition-all">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-4">Question Type</label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
                                    {(['MCQ', 'Fill-in-gap', 'Essay'] as QuestionType[]).map(t => (
                                        <button key={t} onClick={() => setNewQuestion({...newQuestion, type: t, options: t === 'MCQ' && !newQuestion.options ? ['', '', '', ''] : newQuestion.options})} className={`py-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${newQuestion.type === t ? 'bg-[#2B1A66] text-white shadow-xl' : 'q-muted hover:bg-white'}`}>
                                            {t === 'Fill-in-gap' ? 'Gap Fill' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-3">Item Prompt</label>
                                <textarea className="w-full p-6 rounded-3xl q-textarea bg-gray-50 border-white shadow-inner text-lg leading-relaxed italic" rows={5} placeholder="Write your question prompt here..." value={newQuestion.questionText} onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-8 border-l border-black/5 pl-10">
                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-3">Item Mark</label>
                                <input type="number" min="0" step="0.5" className="w-full p-4 rounded-2xl q-input bg-gray-50 border-white text-md font-bold" value={newQuestion.mark ?? (selectedAssessment?.defaultMark || 1)} onChange={e => setNewQuestion({...newQuestion, mark: parseFloat(e.target.value)})} />
                                {newQuestion.type === 'Fill-in-gap' && newQuestion.questionText?.includes('[GAP]') && (
                                    <div className="mt-2 text-[9px] uppercase font-bold text-purple-600 bg-purple-500/10 inline-block px-3 py-1 rounded-lg">
                                        Will allocate {( (newQuestion.mark ?? (selectedAssessment?.defaultMark || 1)) / Math.max(1, newQuestion.questionText.split('[GAP]').length - 1) ).toFixed(1)} marks per gap
                                    </div>
                                )}
                            </div>
                            <label className="block text-[10px] uppercase font-black tracking-widest q-muted -mb-4">Grading & References</label>
                            {newQuestion.type === 'MCQ' && (
                                <div className="space-y-4">
                                    {Array.isArray(newQuestion.options) && newQuestion.options.map((opt, idx) => (
                                        <div key={idx} className="relative group">
                                            <input className={`w-full p-5 pl-14 rounded-2xl q-input bg-gray-50 border-white text-md font-bold ${newQuestion.correctOption === idx ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`} value={opt} placeholder={`Option ${String.fromCharCode(65+idx)}`} onChange={e => { const opts = [...(newQuestion.options || [])]; opts[idx] = e.target.value; setNewQuestion({...newQuestion, options: opts}); }} />
                                            <button onClick={() => setNewQuestion({...newQuestion, correctOption: idx})} className={`absolute left-3 top-3 bottom-3 w-10 rounded-xl font-black text-sm transition-all shadow-sm ${newQuestion.correctOption === idx ? 'bg-green-500 text-white' : 'bg-white q-muted border border-black/5'}`}>{String.fromCharCode(65+idx)}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {newQuestion.type === 'Fill-in-gap' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center"><label className="text-[10px] uppercase font-black tracking-widest q-muted">Gap Mapping</label><button onClick={() => { const tx = document.getElementById('modal-edit-gap-tx') as any; if(!tx) return; const s = tx.selectionStart, e = tx.selectionEnd, t = newQuestion.questionText || '', nt = t.substring(0,s)+'[GAP]'+t.substring(e); setNewQuestion({...newQuestion, questionText: nt}); setTimeout(() => { tx.focus(); tx.setSelectionRange(s+5, s+5); }, 0); }} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-purple-900/10">+ Insert Gap Block</button></div>
                                    <textarea id="modal-edit-gap-tx" className="w-full p-6 rounded-3xl q-textarea bg-gray-50 border-white text-md min-h-[160px]" placeholder="Type text and insert [GAP]..." value={newQuestion.questionText} onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})} />
                                    {newQuestion.questionText?.includes('[GAP]') && (
                                        <div className="grid gap-3 pt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {newQuestion.questionText.split('[GAP]').slice(0, -1).map((_, idx) => { const keys = (newQuestion.gapAnswer || '').split('|'); return (
                                                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-white"><div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-lg font-black text-xs">{idx+1}</div><input type="text" className="flex-1 bg-transparent text-md font-bold q-text outline-none" placeholder="Enter target key..." value={keys[idx] || ''} onChange={e => { const k = [...keys]; k[idx] = e.target.value; setNewQuestion({...newQuestion, gapAnswer: k.join('|')}); }} /></div>
                                            );})}
                                        </div>
                                    )}
                                </div>
                            )}
                            {newQuestion.type === 'Essay' && (
                                <div className="space-y-8">
                                    <div><label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-3">Ideal Academic Model (SBERT Base)</label><textarea className="w-full p-6 rounded-3xl q-textarea bg-gray-50 border-white text-md leading-relaxed" rows={8} placeholder="Input the ideal response..." value={newQuestion.referenceAnswer} onChange={e => setNewQuestion({...newQuestion, referenceAnswer: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-3">Min Characters</label><input type="number" min="0" className="w-full p-4 rounded-2xl q-input bg-gray-50 border-white font-bold" placeholder="Optional" value={newQuestion.minCharacters || ''} onChange={e => setNewQuestion({...newQuestion, minCharacters: e.target.value ? parseInt(e.target.value) : undefined})} /></div>
                                        <div><label className="block text-[10px] uppercase font-black tracking-widest q-muted mb-3">Max Characters</label><input type="number" min="0" className="w-full p-4 rounded-2xl q-input bg-gray-50 border-white font-bold" placeholder="Optional" value={newQuestion.maxCharacters || ''} onChange={e => setNewQuestion({...newQuestion, maxCharacters: e.target.value ? parseInt(e.target.value) : undefined})} /></div>
                                    </div>
                                    <div className="bg-gray-50 p-7 rounded-3xl border border-white shadow-inner">
                                        <div className="flex justify-between items-center mb-4"><label className="text-[10px] uppercase font-black tracking-widest q-muted">Semantic Confidence Pool</label><span className="text-sm font-black q-text px-4 py-1.5 bg-white rounded-xl shadow-sm">{newQuestion.threshold}% Accuracy</span></div>
                                        <input type="range" min="0" max="100" className="w-full h-2 bg-black/5 rounded-lg appearance-none cursor-pointer accent-[#2B1A66]" value={newQuestion.threshold} onChange={e => setNewQuestion({...newQuestion, threshold: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-10 border-t border-black/5 bg-gray-50/50 flex gap-6 shrink-0">
                    <button onClick={() => setShowQuestionModal(false)} className="flex-1 ios-btn ios-btn--light h-16 text-xs uppercase tracking-widest font-black">Cancel Studio</button>
                    <button onClick={handleSaveQuestion} disabled={!newQuestion.questionText} className="flex-1 ios-btn ios-btn--primary h-16 text-xs uppercase tracking-widest font-black shadow-2xl shadow-purple-900/20">{editingQuestionId ? 'Commit Update' : 'Deploy Assessment Item'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default QuestionsPage;
