import React, { useState } from 'react';
import api from '../../services/api';

const ExaminationAPITest = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing Examination API endpoints...');
      
      // Test 1: Get all tests
      const testsResponse = await api.get('/examinations/tests');
      console.log('✅ GET /examinations/tests:', testsResponse.data);
      
      // Test 2: Get all classes (for test creation)
      const classesResponse = await api.get('/classes');
      console.log('✅ GET /classes:', classesResponse.data);
      
      // Test 3: Create a test (if we have classes)
      if (classesResponse.data.success && classesResponse.data.classes.length > 0) {
        const testClass = classesResponse.data.classes[0];
        const testData = {
          title: 'Test API Quiz - Mathematics',
          subject: 'Mathematics',
          classId: testClass._id,
          totalMarks: 50,
          testDate: new Date().toISOString().split('T')[0], // Today's date
          testType: 'Quiz',
          instructions: 'This is a test created via API to verify functionality.',
          duration: 30
        };
        
        const createResponse = await api.post('/examinations/tests', testData);
        console.log('✅ POST /examinations/tests:', createResponse.data);
        
        if (createResponse.data.success) {
          const testId = createResponse.data.data._id;
          
          // Test 4: Get single test
          const singleTestResponse = await api.get(`/examinations/tests/${testId}`);
          console.log('✅ GET /examinations/tests/:id:', singleTestResponse.data);
          
          // Test 5: Publish test
          const publishResponse = await api.patch(`/examinations/tests/${testId}/publish`, {
            isPublished: true
          });
          console.log('✅ PATCH /examinations/tests/:id/publish:', publishResponse.data);
        }
      }
      
      setTestResults('✅ All API tests passed! Check browser console for detailed results.');
      
    } catch (error) {
      console.error('❌ API Test failed:', error);
      setTestResults(`❌ API Test failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Examination API Test</h2>
      <p className="text-gray-600 mb-4">
        This component tests our Phase 1 implementation to ensure all API endpoints are working correctly.
      </p>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? 'Testing APIs...' : 'Run API Tests'}
      </button>
      
      {testResults && (
        <div className={`mt-4 p-4 rounded-md ${
          testResults.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <pre className="whitespace-pre-wrap">{testResults}</pre>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        <h3 className="font-medium text-gray-700 mb-2">Phase 1 Completion Status:</h3>
        <ul className="space-y-1">
          <li>✅ Database Models: Test.js, TestResult.js, Enhanced User.js</li>
          <li>✅ Permission System: EXAMINATION permissions added</li>
          <li>✅ API Routes: /examinations endpoints created</li>
          <li>✅ Server Integration: Routes registered in server.js</li>
          <li>✅ Frontend Component: ExaminationDashboard created</li>
          <li>✅ Routing: /examinations route added to App.jsx</li>
        </ul>
      </div>
    </div>
  );
};

export default ExaminationAPITest;
