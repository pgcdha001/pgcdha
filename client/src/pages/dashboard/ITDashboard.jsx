import React, { useState, useEffect } from 'react';
import { default as api } from '../../services/api';
import Card from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Trash2 } from 'lucide-react';

const STAGE_LABELS = [
  'Not Purchased',
  'Purchased',
  'Returned',
  'Admission Fee Submitted',
  '1st Installment Submitted'
];
const STAGE_COLORS = [
  'bg-gray-300',
  'bg-blue-400',
  'bg-yellow-400',
  'bg-green-400',
  'bg-indigo-400'
];

const ITDashboard = () => {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dob: '',
    cnic: ''
  });
  const [fetching, setFetching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stageModal, setStageModal] = useState({ open: false, student: null });
  const [stageUpdating, setStageUpdating] = useState(false);
  const [tab, setTab] = useState('overview');
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await api.get('/users?role=Student&limit=100');
      console.log('Fetched students:', res.data?.data?.users);
      setStudents(res.data?.data?.users || []);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        fullName: { firstName: form.firstName, lastName: form.lastName },
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        dob: form.dob,
        cnic: form.cnic
      };
      const res = await api.post('/students/register', payload);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', phoneNumber: '', gender: '', dob: '', cnic: '' });
      setSuccess(res.data?.message || 'Student registered successfully');
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleStageChange = (student) => {
    setStageModal({ open: true, student });
  };

  const handleStageSelect = async (newStage) => {
    if (!stageModal.student) return;
    setStageUpdating(true);
    try {
      await api.patch(`/students/${stageModal.student._id}/progress`, { prospectusStage: newStage });
      setStageModal({ open: false, student: null });
      setSuccess('Stage updated successfully');
      fetchStudents();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update stage');
    } finally {
      setStageUpdating(false);
    }
  };

  const handleDeleteClick = (student) => {
    setDeleteModal({ open: true, student });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.student) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteModal.student._id}`);
      setDeleteModal({ open: false, student: null });
      setSuccess('Student deleted successfully');
      fetchStudents();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">IT Dashboard</h2>
            <p className="text-muted-foreground font-medium">Student registration and progression management</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <div className="flex gap-4 border-b border-border/30 pb-4">
          <button
            className={`px-6 py-3 font-bold rounded-xl transition-all duration-200 ${tab === 'overview' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-primary hover:bg-primary/10'}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 font-bold rounded-xl transition-all duration-200 ${tab === 'student' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-primary hover:bg-primary/10'}`}
            onClick={() => setTab('student')}
          >
            Student Management
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Student Statistics
          </h3>
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">{students.length}</div>
              <div className="text-muted-foreground font-medium">Registered Students</div>
            </div>
          </div>
        </div>
      )}

      {/* Student Management Tab */}
      {tab === 'student' && (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary font-[Sora,Inter,sans-serif] flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Student Management
            </h3>
            <Button 
              variant="default" 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
            >
              Register New Student
            </Button>
          </div>
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/60 text-green-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {success}
              </div>
            </div>
          )}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full h-full bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border/50 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-accent text-white p-6 shadow-lg flex justify-between items-center">
                  <h3 className="text-2xl font-bold font-[Sora,Inter,sans-serif]">Register Student</h3>
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <form onSubmit={handleRegister} autoComplete="off" className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <input name="firstName" value={form.firstName} onChange={handleInputChange} placeholder="First Name" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" required />
                    <input name="lastName" value={form.lastName} onChange={handleInputChange} placeholder="Last Name" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" required />
                    <input name="email" value={form.email} onChange={handleInputChange} placeholder="Email (optional)" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" />
                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" />
                    <input name="gender" value={form.gender} onChange={handleInputChange} placeholder="Gender" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" />
                    <input name="dob" value={form.dob} onChange={handleInputChange} placeholder="Date of Birth" type="date" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm" />
                    <input name="cnic" value={form.cnic} onChange={handleInputChange} placeholder="CNIC" className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm col-span-full" />
                    {error && (
                      <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl col-span-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          {error}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border-t border-border/50 p-6 shadow-lg">
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
                      variant="outline"
                      className="px-8 py-3 text-lg font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleRegister}
                      disabled={registering}
                      className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
                    >
                      {registering ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Registered Students
            </h3>
            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-primary font-medium">Loading students...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student._id} className="bg-white/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 transition-all duration-200 hover:bg-white/70 hover:shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-lg text-primary">{student.fullName?.firstName} {student.fullName?.lastName}</div>
                        <div className="text-sm text-muted-foreground font-medium">{student.email} | {student.phoneNumber}</div>
                        <div className="text-xs text-muted-foreground">CNIC: {student.cnic}</div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-white font-semibold text-sm shadow-lg ${STAGE_COLORS[(student.prospectusStage || 1) - 1]}`}>
                          Stage {(student.prospectusStage || 1)}: {STAGE_LABELS[(student.prospectusStage || 1) - 1] || 'Unknown'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleStageChange(student)}
                          className="border-border/50 hover:bg-white/50"
                        >
                          Change Stage
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteClick(student)}
                          className="hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {stageModal.open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <Card className="w-full max-w-xs p-0">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 text-primary">Change Stage</h3>
                  <div className="space-y-2">
                    {STAGE_LABELS.map((label, idx) => (
                      <Button
                        key={label}
                        variant={stageModal.student.prospectusStage === idx + 1 ? 'default' : 'outline'}
                        className={`w-full flex items-center justify-between ${STAGE_COLORS[idx]} ${stageModal.student.prospectusStage === idx + 1 ? 'text-white' : ''}`}
                        onClick={() => handleStageSelect(idx + 1)}
                        disabled={stageUpdating || stageModal.student.prospectusStage === idx + 1}
                      >
                        <span>{label}</span>
                        {stageModal.student.prospectusStage === idx + 1 && <span>&#10003;</span>}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setStageModal({ open: false, student: null })} disabled={stageUpdating}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <Card className="w-full max-w-xs p-0">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 text-primary">Confirm Delete</h3>
                  <p className="mb-4 text-gray-700">Are you sure you want to delete <span className="font-semibold">{deleteModal.student?.fullName?.firstName} {deleteModal.student?.fullName?.lastName}</span>? This action cannot be undone.</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setDeleteModal({ open: false, student: null })} disabled={deleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ITDashboard; 