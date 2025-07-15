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
    <div className="bg-white rounded-lg shadow p-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'student' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
          onClick={() => setTab('student')}
        >
          Student Management
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card header={{ title: 'Student Stats' }}>
            <div className="flex flex-col gap-2">
              <div className="text-3xl font-bold text-primary">{students.length}</div>
              <div className="text-gray-600 text-sm">Registered Students</div>
            </div>
          </Card>
        </div>
      )}

      {/* Student Management Tab */}
      {tab === 'student' && (
        <Card header={{ title: 'Student Management' }}>
          <div className="mb-6">
            <Button variant="default" size="lg" onClick={() => setShowModal(true)}>
              Register New Student
            </Button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2 font-semibold">{success}</div>}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <Card className="w-full max-w-md p-0">
                <form className="p-6" onSubmit={handleRegister} autoComplete="off">
                  <h3 className="text-xl font-bold mb-4 text-primary font-[Sora,Inter,sans-serif]">Register Student</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <input name="firstName" value={form.firstName} onChange={handleInputChange} placeholder="First Name" className="border p-2 rounded-xl bg-white/80" required />
                    <input name="lastName" value={form.lastName} onChange={handleInputChange} placeholder="Last Name" className="border p-2 rounded-xl bg-white/80" required />
                    <input name="email" value={form.email} onChange={handleInputChange} placeholder="Email (optional)" className="border p-2 rounded-xl bg-white/80" />
                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" className="border p-2 rounded-xl bg-white/80" />
                    <input name="gender" value={form.gender} onChange={handleInputChange} placeholder="Gender" className="border p-2 rounded-xl bg-white/80" />
                    <input name="dob" value={form.dob} onChange={handleInputChange} placeholder="Date of Birth" type="date" className="border p-2 rounded-xl bg-white/80" />
                    <input name="cnic" value={form.cnic} onChange={handleInputChange} placeholder="CNIC" className="border p-2 rounded-xl bg-white/80" />
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" disabled={registering}>
                      {registering ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                  {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
                </form>
              </Card>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Registered Students</h3>
            {fetching ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50">
                    <div>
                      <div className="font-bold text-lg">{student.fullName?.firstName} {student.fullName?.lastName}</div>
                      <div className="text-sm text-gray-600">{student.email} | {student.phoneNumber}</div>
                      <div className="text-xs text-gray-500">CNIC: {student.cnic}</div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-white font-semibold text-sm ${STAGE_COLORS[(student.prospectusStage || 1) - 1]}`}>
                        Stage {(student.prospectusStage || 1)}: {STAGE_LABELS[(student.prospectusStage || 1) - 1] || 'Unknown'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleStageChange(student)}>
                        Change Stage
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(student)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
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
        </Card>
      )}
    </div>
  );
};

export default ITDashboard; 