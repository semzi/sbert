import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Student } from '../../types';

function AssignStudentsPage() {
  const { students, courses, assignStudentToCourse, addStudents } = useApp();

  // Which course is currently open (null = course grid)
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Add-students modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Import-from-sheet modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState<Partial<Student>[]>([]);
  const [importError, setImportError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCourse = courses.find(c => c.id === activeCourseId);

  // Students already enrolled in the active course
  const enrolledStudents = activeCourseId
    ? students.filter(s => s.courses.includes(activeCourseId))
    : [];

  // Students NOT yet in the active course (candidates for adding)
  const unenrolledStudents = activeCourseId
    ? students.filter(s => !s.courses.includes(activeCourseId))
    : [];

  const filteredCandidates = unenrolledStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.matricNo.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // ── Add modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setSearchQuery('');
    setSelectedIds(new Set());
    setShowAddModal(true);
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map(s => s.id)));
    }
  };

  const handleConfirmAdd = () => {
    if (!activeCourseId) return;
    selectedIds.forEach(id => assignStudentToCourse(id, activeCourseId));
    setShowAddModal(false);
    setSelectedIds(new Set());
  };

  // ── Import helpers ────────────────────────────────────────────────────────────

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setImportError('File must have a header row and at least one data row.');
      return;
    }
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    const firstNameIdx = headers.findIndex(h => ['firstname', 'first_name', 'first name'].includes(h));
    const lastNameIdx  = headers.findIndex(h => ['lastname', 'last_name', 'last name', 'surname'].includes(h));
    const matricIdx    = headers.findIndex(h => ['matricno', 'matric_no', 'matric', 'matric number', 'reg_no'].includes(h));
    const emailIdx     = headers.findIndex(h => ['email', 'e-mail', 'email address'].includes(h));

    if ([firstNameIdx, lastNameIdx, matricIdx, emailIdx].includes(-1)) {
      setImportError(`Missing columns. Found: [${headers.join(', ')}]. Need: firstName, lastName, matricNo, email`);
      return;
    }

    const existingMatrics = new Set(students.map(s => s.matricNo.toLowerCase()));
    const parsed: Partial<Student>[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
      const firstName = cols[firstNameIdx];
      const lastName  = cols[lastNameIdx];
      const matricNo  = cols[matricIdx];
      const email     = cols[emailIdx];
      if (!firstName || !lastName || !matricNo || !email) continue;
      if (existingMatrics.has(matricNo.toLowerCase())) { skipped++; continue; }
      parsed.push({ firstName, lastName, matricNo, email, courses: [] });
    }

    if (parsed.length === 0) {
      setImportError(skipped > 0 ? `All ${skipped} records already exist.` : 'No valid records found.');
      return;
    }
    setImportError(skipped > 0 ? `${skipped} duplicate(s) skipped.` : '');
    setImportedStudents(parsed);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      setImportError('Please upload a .csv or .tsv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (!activeCourseId) return;
    const newStudents: Student[] = importedStudents.map(s => ({
      ...s as Student,
      id: Math.random().toString(36).substring(2, 9),
      name: `${s.firstName} ${s.lastName}`,
      courses: [activeCourseId],
    }));
    addStudents(newStudents);
    // Also assign existing students that were freshly imported
    setShowImportModal(false);
    setImportedStudents([]);
    setImportError('');
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {activeCourseId && (
            <button
              type="button"
              onClick={() => setActiveCourseId(null)}
              className="ios-icon-btn"
              aria-label="Back to courses"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <div className="q-muted text-sm font-semibold">
              {activeCourse ? `${activeCourse.code} · ${enrolledStudents.length} enrolled` : 'Deployment'}
            </div>
            <div className="text-2xl font-bold q-text">
              {activeCourse ? activeCourse.title : 'Assign Students'}
            </div>
          </div>
        </div>

        {activeCourseId && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowImportModal(true); setImportedStudents([]); setImportError(''); }}
              className="ios-btn ios-btn--light flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import from Sheet
            </button>
            <button
              type="button"
              onClick={openAddModal}
              disabled={unenrolledStudents.length === 0}
              className="ios-btn ios-btn--primary disabled:opacity-40"
            >
              Add Students
            </button>
          </div>
        )}
      </div>

      {/* ── Course Grid ──────────────────────────────────────────────────────── */}
      {!activeCourseId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(course => {
            const count = students.filter(s => s.courses.includes(course.id)).length;
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                <div className="text-lg font-bold q-text leading-tight mb-3">{course.title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(3, count) }).map((_, i) => (
                      <div key={i} className="h-6 w-6 rounded-full bg-purple-500/20 border-2 border-white flex items-center justify-center text-[9px] font-black text-purple-700">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-semibold q-muted">
                    {count} student{count !== 1 ? 's' : ''} enrolled
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-purple-600 text-xs font-black uppercase tracking-widest">
                  <span>Manage enrolments</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Enrolled Students List ────────────────────────────────────────────── */}
      {activeCourseId && (
        <div className="liquid-glass p-6">
          {enrolledStudents.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 q-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-lg font-bold q-text mb-1">No students enrolled yet</div>
              <p className="text-sm q-muted">Click "Add Students" to assign students to this course.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="q-muted">
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Matric No</th>
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Full Name</th>
                    <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest">Email</th>
                    <th className="py-3 text-[10px] font-black uppercase tracking-widest">Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(s => (
                    <tr key={s.id} className="border-t border-black/5 hover:bg-black/3 transition-colors">
                      <td className="py-3.5 pr-4 font-black text-purple-700 text-xs">{s.matricNo}</td>
                      <td className="py-3.5 pr-4 font-semibold q-text">{s.firstName} {s.lastName}</td>
                      <td className="py-3.5 pr-4 q-text opacity-70 text-sm">{s.email}</td>
                      <td className="py-3.5 q-muted text-sm">{s.courses.length} course{s.courses.length !== 1 ? 's' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Add Students Modal ───────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="liquid-glass max-w-2xl w-full bg-white/95 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
            style={{ overflow: 'hidden' }}>

            {/* Modal Header */}
            <div className="p-6 pb-0 flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold q-text">Add Students to {activeCourse?.code}</h3>
                  <p className="text-xs q-muted">{selectedIds.size} selected</p>
                </div>
              </div>

              {/* Search + Select All */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 q-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, matric, email…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl q-input border-white text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="ios-btn ios-btn--light text-xs font-bold px-4 py-2.5 whitespace-nowrap"
                >
                  {selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-auto px-6 pb-2">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-10 opacity-40">
                  <div className="text-sm font-semibold q-text">
                    {unenrolledStudents.length === 0 ? 'All students are already enrolled.' : 'No students match your search.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCandidates.map(s => {
                    const checked = selectedIds.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all duration-150 border ${
                          checked
                            ? 'bg-purple-50 border-purple-200 shadow-sm'
                            : 'bg-white/60 border-transparent hover:bg-white/90 hover:border-black/5'
                        }`}
                      >
                        {/* Custom checkbox */}
                        <div
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                            checked ? 'bg-purple-600 border-purple-600' : 'border-black/20 bg-white'
                          }`}
                          onClick={() => toggleStudent(s.id)}
                        >
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleStudent(s.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold q-text text-sm">{s.firstName} {s.lastName}</div>
                          <div className="text-xs q-muted truncate">{s.matricNo} · {s.email}</div>
                        </div>
                        <div className="text-[10px] font-black q-muted uppercase tracking-wider">
                          {s.courses.length} course{s.courses.length !== 1 ? 's' : ''}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 flex-shrink-0 border-t border-black/5">
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 ios-btn ios-btn--light font-bold">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={selectedIds.size === 0}
                  className="flex-1 ios-btn ios-btn--primary font-bold disabled:opacity-40"
                >
                  Add {selectedIds.size > 0 ? selectedIds.size : ''} Student{selectedIds.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import from Sheet Modal ──────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="liquid-glass max-w-2xl w-full p-8 bg-white/95 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold q-text">Import & Enrol from Spreadsheet</h3>
                <p className="text-xs q-muted mt-0.5">{activeCourse?.code} — students will be created and enrolled</p>
              </div>
            </div>

            {importedStudents.length === 0 ? (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragging ? 'border-purple-500 bg-purple-500/5 scale-[1.01]' : 'border-black/10 hover:border-purple-400/50 hover:bg-purple-500/3'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold q-text mb-1">
                    Drop your spreadsheet here, or <span className="text-purple-600">browse</span>
                  </div>
                  <div className="text-xs q-muted">Supports .csv and .tsv</div>
                </div>

                <div className="mt-4 p-4 bg-black/3 rounded-2xl">
                  <div className="text-[10px] font-black q-muted uppercase tracking-widest mb-2">Expected Columns</div>
                  <div className="flex flex-wrap gap-2">
                    {['firstName', 'lastName', 'matricNo', 'email'].map(col => (
                      <span key={col} className="text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-black/5 q-text">{col}</span>
                    ))}
                  </div>
                </div>

                {importError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-700 font-medium">
                    {importError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowImportModal(false)} className="flex-1 ios-btn ios-btn--light font-bold">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold q-text">{importedStudents.length} student{importedStudents.length !== 1 ? 's' : ''} ready to import & enrol</div>
                    {importError && <div className="text-xs text-amber-600 font-medium">{importError}</div>}
                  </div>
                </div>
                <div className="max-h-64 overflow-auto rounded-2xl border border-black/5">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-black/3 text-[10px] font-black q-muted uppercase tracking-widest">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Matric No</th>
                        <th className="py-2 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedStudents.map((s, i) => (
                        <tr key={i} className="border-t border-black/5">
                          <td className="py-2 px-3 q-muted">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold q-text">{s.firstName} {s.lastName}</td>
                          <td className="py-2 px-3 font-mono text-purple-700 font-bold text-xs">{s.matricNo}</td>
                          <td className="py-2 px-3 q-text opacity-70">{s.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setImportedStudents([]); setImportError(''); }} className="flex-1 ios-btn ios-btn--light font-bold">Back</button>
                  <button onClick={handleImportConfirm} className="flex-1 ios-btn ios-btn--primary font-bold">
                    Import {importedStudents.length} & Enrol
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignStudentsPage;
