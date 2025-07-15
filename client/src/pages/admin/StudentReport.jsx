import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import Card from '../../components/ui/card';
import { default as api } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const STAGE_LABELS = [
  'Not Purchased',
  'Purchased',
  'Returned',
  'Admission Fee Submitted',
  '1st Installment Submitted'
];

const StudentReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [cnicFilter, setCnicFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users?role=Student&limit=1000');
      setStudents(res.data?.data?.users || []);
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesStage = !stageFilter || String(s.prospectusStage || 1) === stageFilter;
    const matchesName = !nameFilter || (`${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.toLowerCase().includes(nameFilter.toLowerCase()));
    const matchesCnic = !cnicFilter || (s.cnic || '').includes(cnicFilter);
    return matchesStage && matchesName && matchesCnic;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Student Report', 14, 16);
    const tableData = filteredStudents.map((s, idx) => [
      idx + 1,
      `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      s.cnic || '',
      s.email || '',
      `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`
    ]);
    doc.autoTable({
      head: [['#', 'Name', 'CNIC', 'Email', 'Stage']],
      body: tableData,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [26, 35, 126] }
    });
    doc.save('student_report.pdf');
  };

  return (
    <Card header={{ title: 'Student Report' }} className='mt-20'>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Student Report</h2>
        <Button onClick={exportPDF} variant="default">Export as PDF</Button>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
          >
            <option value="">All Stages</option>
            {STAGE_LABELS.map((label, idx) => (
              <option key={label} value={String(idx + 1)}>
                Stage {idx + 1}: {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search by name"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">CNIC</label>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search by CNIC"
            value={cnicFilter}
            onChange={e => setCnicFilter(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">CNIC</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <tr key={s._id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{`${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim()}</td>
                  <td className="px-3 py-2">{s.cnic}</td>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2">Stage {s.prospectusStage || 1}: {STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default StudentReport; 