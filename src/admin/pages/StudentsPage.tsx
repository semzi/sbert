import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Student } from '../../types';

function StudentsPage() {
  const { students, addStudent, addStudents, removeStudent } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    matricNo: '',
    email: '',
    courses: []
  });

  // Import state
  const [importedStudents, setImportedStudents] = useState<Partial<Student>[]>([]);
  const [importError, setImportError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddStudent = () => {
    if (newStudent.firstName && newStudent.lastName && newStudent.email && newStudent.matricNo) {
      addStudent({
        ...newStudent as Student,
        id: Math.random().toString(36).substring(2, 9),
        name: `${newStudent.firstName} ${newStudent.lastName}`,
        courses: []
      });
      setShowModal(false);
      setNewStudent({ firstName: '', lastName: '', matricNo: '', email: '', courses: [] });
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setImportError('File must have a header row and at least one data row.');
      return;
    }

    // Detect separator (comma or tab)
    const separator = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Map headers to expected fields
    const firstNameIdx = headers.findIndex(h => ['firstname', 'first_name', 'first name'].includes(h));
    const lastNameIdx = headers.findIndex(h => ['lastname', 'last_name', 'last name', 'surname'].includes(h));
    const matricIdx = headers.findIndex(h => ['matricno', 'matric_no', 'matric no', 'matric', 'matric number', 'reg_no', 'reg no', 'registration number'].includes(h));
    const emailIdx = headers.findIndex(h => ['email', 'email address', 'e-mail'].includes(h));

    if (firstNameIdx === -1 || lastNameIdx === -1 || matricIdx === -1 || emailIdx === -1) {
      setImportError(`Missing required columns. Found: [${headers.join(', ')}]. Need: firstName, lastName, matricNo, email`);
      return;
    }

    const parsed: Partial<Student>[] = [];
    const existingMatrics = new Set(students.map(s => s.matricNo.toLowerCase()));
    let skippedDuplicates = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
      if (cols.length < Math.max(firstNameIdx, lastNameIdx, matricIdx, emailIdx) + 1) continue;

      const firstName = cols[firstNameIdx];
      const lastName = cols[lastNameIdx];
      const matricNo = cols[matricIdx];
      const email = cols[emailIdx];

      if (!firstName || !lastName || !matricNo || !email) continue;

      if (existingMatrics.has(matricNo.toLowerCase())) {
        skippedDuplicates++;
        continue;
      }

      parsed.push({ firstName, lastName, matricNo, email, courses: [] });
    }

    if (parsed.length === 0) {
      setImportError(skippedDuplicates > 0 
        ? `All ${skippedDuplicates} students already exist in the system.` 
        : 'No valid student records found in file.');
      return;
    }

    setImportError(skippedDuplicates > 0 ? `${skippedDuplicates} duplicate(s) skipped.` : '');
    setImportedStudents(parsed);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      setImportError('Please upload a .csv, .tsv, or .txt file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    const newStudents: Student[] = importedStudents.map(s => ({
      ...s as Student,
      id: Math.random().toString(36).substring(2, 9),
      name: `${s.firstName} ${s.lastName}`,
      courses: []
    }));
    addStudents(newStudents);
    setShowImportModal(false);
    setImportedStudents([]);
    setImportError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="q-muted text-sm font-semibold">Manage</div>
          <div className="text-2xl font-bold q-text">Students</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setShowImportModal(true);
              setImportedStudents([]);
              setImportError('');
            }}
            type="button" 
            className="ios-btn ios-btn--light flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Import from Sheet
          </button>
          <button 
            onClick={() => setShowModal(true)}
            type="button" 
            className="ios-btn ios-btn--primary"
          >
            Add Student
          </button>
        </div>
      </div>

      <div className="liquid-glass p-6">
        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="q-muted text-sm">
                <th className="py-3 pr-4 uppercase tracking-widest text-[10px] font-black">Matric No</th>
                <th className="py-3 pr-4 uppercase tracking-widest text-[10px] font-black">Full Name</th>
                <th className="py-3 pr-4 uppercase tracking-widest text-[10px] font-black">Email</th>
                <th className="py-3 pr-4 uppercase tracking-widest text-[10px] font-black">Courses</th>
                <th className="py-3 uppercase tracking-widest text-[10px] font-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-black/5 hover:bg-black/5 transition-colors">
                  <td className="py-4 pr-4 font-black text-purple-700 text-xs">{s.matricNo}</td>
                  <td className="py-4 pr-4 font-semibold q-text">{s.firstName} {s.lastName}</td>
                  <td className="py-4 pr-4 q-text opacity-70">{s.email}</td>
                  <td className="py-4 pr-4 q-text">{s.courses.length}</td>
                  <td className="py-4">
                    <button 
                      onClick={() => removeStudent(s.id)}
                      className="ios-btn ios-btn--light text-red-500 text-xs px-4 py-2"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="liquid-glass max-w-lg w-full p-8 bg-white/90 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold q-text mb-6">Enroll New Student</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black q-muted uppercase tracking-widest mb-1">First Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl q-input border-white"
                  placeholder="e.g. Azeez"
                  value={newStudent.firstName}
                  onChange={e => setNewStudent({...newStudent, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black q-muted uppercase tracking-widest mb-1">Last Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl q-input border-white"
                  placeholder="e.g. Olatunji"
                  value={newStudent.lastName}
                  onChange={e => setNewStudent({...newStudent, lastName: e.target.value})}
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs font-black q-muted uppercase tracking-widest mb-1">Matric Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl q-input border-white"
                  placeholder="e.g. 20/52CT042"
                  value={newStudent.matricNo}
                  onChange={e => setNewStudent({...newStudent, matricNo: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-black q-muted uppercase tracking-widest mb-1">Student Email</label>
                <input 
                  type="email" 
                  className="w-full p-3 rounded-xl q-input border-white"
                  placeholder="e.g. student@unilorin.edu.ng"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 ios-btn ios-btn--light font-bold">Cancel</button>
              <button 
                onClick={handleAddStudent} 
                disabled={!newStudent.firstName || !newStudent.lastName || !newStudent.email || !newStudent.matricNo}
                className="flex-1 ios-btn ios-btn--primary font-bold disabled:opacity-50"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Sheet Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="liquid-glass max-w-2xl w-full p-8 bg-white/90 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold q-text">Import Students from Spreadsheet</h3>
                <p className="text-xs q-muted mt-0.5">Upload a CSV or TSV file with student data</p>
              </div>
            </div>

            {importedStudents.length === 0 ? (
              <>
                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/5 scale-[1.01]'
                      : 'border-black/10 hover:border-purple-500/40 hover:bg-purple-500/3'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold q-text mb-1">
                    Drop your spreadsheet here, or <span className="text-purple-600">browse</span>
                  </div>
                  <div className="text-xs q-muted">Supports .csv and .tsv files</div>
                </div>

                {/* Expected Format */}
                <div className="mt-4 p-4 bg-black/3 rounded-2xl">
                  <div className="text-[10px] font-black q-muted uppercase tracking-widest mb-2">Expected Columns</div>
                  <div className="flex flex-wrap gap-2">
                    {['firstName', 'lastName', 'matricNo', 'email'].map(col => (
                      <span key={col} className="text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-black/5 q-text">
                        {col}
                      </span>
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
                {/* Preview */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold q-text">{importedStudents.length} student{importedStudents.length !== 1 ? 's' : ''} ready to import</div>
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
                  <button 
                    onClick={() => { setImportedStudents([]); setImportError(''); }}
                    className="flex-1 ios-btn ios-btn--light font-bold"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleImportConfirm}
                    className="flex-1 ios-btn ios-btn--primary font-bold"
                  >
                    Import {importedStudents.length} Student{importedStudents.length !== 1 ? 's' : ''}
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

export default StudentsPage;
