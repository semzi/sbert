import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Course } from '../../types';

function CoursesPage() {
  const { courses, addCourse, removeCourse } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    code: '',
    title: '',
    status: 'Draft',
    students: 0
  });

  const handleAddCourse = () => {
    if (newCourse.code && newCourse.title) {
      addCourse({
        ...newCourse as Course,
        id: Math.random().toString(36).substr(2, 9),
        students: 0
      });
      setShowModal(false);
      setNewCourse({ code: '', title: '', status: 'Draft', students: 0 });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="q-muted text-sm font-semibold">Manage</div>
          <div className="text-2xl font-bold q-text">Courses</div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          type="button" 
          className="ios-btn ios-btn--primary"
        >
          New course
        </button>
      </div>

      <div className="liquid-glass p-6">
        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="q-muted text-sm">
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Students</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="py-4 pr-4 font-semibold q-text">{c.code}</td>
                  <td className="py-4 pr-4 q-text">{c.title}</td>
                  <td className="py-4 pr-4 q-text">{c.students}</td>
                  <td className="py-4 pr-4">
                    <span className={c.status === 'Active' ? 'px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-700' : 'px-3 py-1 rounded-full text-xs font-semibold bg-[#F2C94C]/20 text-[#2B1A66]'}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => removeCourse(c.id)}
                        type="button" 
                        className="ios-btn ios-btn--light text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="liquid-glass max-w-md w-full p-8 bg-white/90">
            <h3 className="text-xl font-bold q-text mb-6">Create New Course</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold q-muted mb-1">Course Code</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl q-input"
                  placeholder="e.g. CSC 401"
                  value={newCourse.code}
                  onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold q-muted mb-1">Course Title</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl q-input"
                  placeholder="e.g. Advanced Web Architecture"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold q-muted mb-1">Initial Status</label>
                <select 
                  className="w-full p-3 rounded-xl q-input"
                  value={newCourse.status}
                  onChange={e => setNewCourse({...newCourse, status: e.target.value as any})}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 ios-btn ios-btn--light"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCourse}
                className="flex-1 ios-btn ios-btn--primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesPage;
