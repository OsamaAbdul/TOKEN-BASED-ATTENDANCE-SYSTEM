// src/Components/TokenList.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TokenList = () => {
  const { user, loading, token } = useAuth();
  const [tokenRecords, setTokenRecords] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  // Modal state for Generate Tokens (updated field names)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    numberOfStudents: '',
    expiresAt: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: 'expiresAt', direction: 'desc' });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  // Fetch token records (updated endpoint)
  useEffect(() => {
    const fetchTokens = async () => {
      if (user && token) {
        try {
          setFetchLoading(true);
          setFetchError(null);
          const response = await axios.get('https://token-based-attendance-system.onrender.com/admin/get-tokenlist', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
            params: {
              courseCode: searchTerm.length >= 3 ? searchTerm : undefined,
              page: currentPage,
              limit: itemsPerPage,
            },
          });

          const records = response.data.tokens || [];
          if (!Array.isArray(records)) {
            throw new Error('Invalid response format');
          }
         
          setTokenRecords(records);
        } catch (error) {
          setFetchError(error.response?.data?.message || 'Failed to fetch tokens');
          toast.error(error.response?.data?.message || 'Failed to fetch tokens');
          console.error('Fetch error:', error);
        } finally {
          setFetchLoading(false);
        }
      }
    };

    fetchTokens();
  }, [user, token, searchTerm, currentPage]);

  // Filtering function
  const filteredRecords = tokenRecords.filter((record) =>
    ['courseCode', 'token'].some((key) => {
      const value = record[key];
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
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
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

  // Handle modal open/close
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ courseCode: '', numberOfStudents: '', expiresAt: '' });
    setFormErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form (updated to match backend)
  const validateForm = () => {
    const errors = {};
    if (!formData.courseCode.trim()) {
      errors.courseCode = 'Course code is required';
    } else if (formData.courseCode.length < 4) {
      errors.courseCode = 'Course code must be at least 4 characters';
    }
    if (!formData.numberOfStudents || formData.numberOfStudents <= 0) {
      errors.numberOfStudents = 'Number of students must be a positive number';
    } else if (formData.numberOfStudents > 1000) {
      errors.numberOfStudents = 'Number of students must be between 1 and 1000';
    }
    if (!formData.expiresAt) {
      errors.expiresAt = 'Expiration date is required';
    } else {
      const selectedDate = new Date(formData.expiresAt);
      const now = new Date();
      if (selectedDate <= now) {
        errors.expiresAt = 'Expiration date must be in the future';
      }
    }
    return errors;
  };

  // Handle form submission (updated to match backend)
  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await axios.post(
        'https://token-based-attendance-system.onrender.com/admin/generate-tokens',
        {
          courseCode: formData.courseCode.trim(),
          numberOfStudents: parseInt(formData.numberOfStudents, 10),
          expiresAt: new Date(formData.expiresAt).toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message || 'Tokens generated successfully');
      closeModal();
      // Refresh token list
      setCurrentPage(1);
      const fetchResponse = await axios.get('https://token-based-attendance-system.onrender.com/admin/get-tokenlist', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: itemsPerPage },
      });
      setTokenRecords(fetchResponse.data.tokens || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate tokens');
      console.error('Generate tokens error:', error);
    }
  };

  // Handle delete all tokens
  const handleDeleteAllTokens = async () => {
    if (!window.confirm('Are you sure you want to delete all tokens? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete('https://token-based-attendance-system.onrender.com/admin/delete-all-tokens', {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(response.data.message || 'All tokens deleted successfully');
      setTokenRecords([]);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete all tokens');
      console.error('Delete all tokens error:', error);
    }
  };

  // Print table as PDF
  const handlePrintPDF = () => {
    let doc;
    try {
      if (sortedRecords.length === 0) {
        toast.warn('No records to print');
        return;
      }

      console.log('Generating PDF with records:', sortedRecords);
      doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Token Records', 14, 20);

      const columns = [
        { header: 'Course Code', dataKey: 'courseCode' },
        { header: 'Token', dataKey: 'token' },
        { header: 'Expires At', dataKey: 'expiresAt' },
        { header: 'Used', dataKey: 'isUsed' },
      ];

      const data = sortedRecords.map((record, index) => {
        if (!record || !record._id) {
          console.warn(`Invalid record at index ${index}:`, record);
          return { courseCode: 'N/A', token: 'N/A', expiresAt: 'N/A', isUsed: 'N/A' };
        }
        return {
          courseCode: record.courseCode || 'N/A',
          token: record.token || 'N/A',
          expiresAt: record.expiresAt ? new Date(record.expiresAt).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) : 'N/A',
          isUsed: record.isUsed ? 'Yes' : 'No',
        };
      });

      autoTable(doc, {
        startY: 30,
        columns,
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      const filename = `token_records_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      console.log('PDF generated successfully:', filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
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
      <h2 className="text-2xl font-bold mb-4">TOKEN RECORDS</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Action Buttons */}
        <div className="px-6 py-4 flex justify-end space-x-2">
          <button
            onClick={openModal}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            Generate Tokens
          </button>
          <button
            onClick={handleDeleteAllTokens}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            disabled={sortedRecords.length === 0 || fetchLoading || fetchError}
          >
            Delete All Tokens
          </button>
        </div>

        {/* Modal for Generate Tokens (updated labels and field names) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Generate Tokens</h3>
              <form onSubmit={handleGenerateTokens}>
                <div className="mb-4">
                  <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                    Course Code
                  </label>
                  <input
                    type="text"
                    id="courseCode"
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., CSC101"
                  />
                  {formErrors.courseCode && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.courseCode}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="numberOfStudents" className="block text-sm font-medium text-gray-700">
                    Number of Students
                  </label>
                  <input
                    type="number"
                    id="numberOfStudents"
                    name="numberOfStudents"
                    value={formData.numberOfStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., 10"
                  />
                  {formErrors.numberOfStudents && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.numberOfStudents}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    id="expiresAt"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {formErrors.expiresAt && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.expiresAt}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Token List</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by course code or token..."
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
                      onClick={() => handleSort('expiresAt')}
                    >
                      Expires At
                      {sortConfig.key === 'expiresAt' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('isUsed')}
                    >
                      Used
                      {sortConfig.key === 'isUsed' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.courseCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.token || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.expiresAt ? new Date(record.expiresAt).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.isUsed ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            {searchTerm ? 'No token records match your search.' : 'No token records found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenList;