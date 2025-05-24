// src/Components/Attendance.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Attendance = () => {
  const { user, loading, token } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      if (user && token) {
        try {
          setFetchLoading(true);
          setFetchError(null);
          const response = await axios.get('https://token-based-attendance-system.onrender.com/admin/get-attendance', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
            params: {
              courseCode: searchTerm.length >= 3 ? searchTerm : undefined,
            },
          });

          const records = response.data.records || [];
          console.log("Attendance records:", records);
          if (!Array.isArray(records)) {
            throw new Error('Invalid response format');
          }
          setAttendanceRecords(records);
        } catch (error) {
          setFetchError(error.response?.data?.message || 'Failed to fetch attendance');
          toast.error(error.response?.data?.message || 'Failed to fetch attendance');
          console.error('Fetch error:', error);
        } finally {
          setFetchLoading(false);
        }
      }
    };

    fetchAttendance();
  }, [user, token, searchTerm]);

  // Filtering function
  const filteredRecords = attendanceRecords.filter((record) =>
    ['user.matric', 'courseCode', 'token'].some((key) => {
      const value = key === 'user.matric' ? record.user?.matric : record[key];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Sorting function
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = sortConfig.key === 'user.matric' ? a.user?.matric || '' : a[sortConfig.key] || '';
    const bValue = sortConfig.key === 'user.matric' ? b.user?.matric || '' : b[sortConfig.key] || '';
    if (sortConfig.direction === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    }
    return bValue.toString().localeCompare(aValue.toString());
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Print table as PDF
  const handlePrintPDF = () => {
    let doc;
    try {
      if (sortedRecords.length === 0) {
        toast.warn('No records to print');
        return;
      }

      console.log('Generating PDF with records:', sortedRecords); // Debug log
      doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text('Attendance Records', 14, 20);

      // Define table columns
      const columns = [
        { header: 'Matric', dataKey: 'matric' },
        { header: 'Course Code', dataKey: 'courseCode' },
        { header: 'Token', dataKey: 'token' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Present', dataKey: 'attendancePresent' },
      ];

      // Prepare table data
      const data = sortedRecords.map((record, index) => {
        if (!record || !record._id) {
          console.warn(`Invalid record at index ${index}:`, record);
          return { matric: 'N/A', courseCode: 'N/A', token: 'N/A', date: 'N/A', attendancePresent: 'N/A' };
        }
        return {
          matric: record.user?.matric || 'N/A',
          courseCode: record.courseCode || 'N/A',
          token: record.token || 'N/A',
          date: record.date ? new Date(record.date).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) : 'N/A',
          attendancePresent: record.attendancePresent ? 'Yes' : 'No',
        };
      });

      // Generate table
      autoTable(doc, {
        startY: 30,
        columns,
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      // Save the PDF
      const filename = `attendance_records_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      console.log('PDF generated successfully:', filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
      // Fallback: Open PDF in new tab if doc exists
      if (doc) {
        try {
          const pdfBlob = doc.output('blob');
          window.open(URL.createObjectURL(pdfBlob));
          console.log('PDF opened in new tab');
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          toast.error('Failed to open PDF');
        }
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="w-full h-full p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">ATTENDANCE RECORDS</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Attendance List</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by matric, course code, or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={handlePrintPDF}
              disabled={sortedRecords.length === 0 || fetchLoading || fetchError}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm ${
                sortedRecords.length === 0 || fetchLoading || fetchError ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Print as PDF
            </button>
          </div>
        </div>
        {fetchLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : fetchError ? (
          <div className="p-6 text-red-500 text-center">{fetchError}</div>
        ) : filteredRecords.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('user.matric')}
                    >
                      Matric
                      {sortConfig.key === 'user.matric' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('courseCode')}
                    >
                      Course Code
                      {sortConfig.key === 'courseCode' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('token')}
                    >
                      Token
                      {sortConfig.key === 'token' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortConfig.key === 'date' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.user?.matric || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.courseCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.token || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date ? new Date(record.date).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.attendancePresent ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedRecords.length)} of{' '}
                  {sortedRecords.length} records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {pageNumbers.map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${
                        currentPage === number
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'No attendance records match your search.' : 'No attendance records found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;