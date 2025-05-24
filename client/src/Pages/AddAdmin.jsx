import React, { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AddAdmin = () => {
  const { user, loading, token } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  // Modal state for registering admins
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    adminType: '',
    role: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      if (user && token) {
        try {
          setFetchLoading(true);
          setFetchError(null);
          const response = await axios.get('https://token-based-attendance-system.onrender.com/get-all-admins', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
            params: {
              email: searchTerm.length >= 3 ? searchTerm : undefined,
              page: currentPage,
              limit: itemsPerPage,
            },
          });

          const { admins, pagination } = response.data.data || {};
          if (!Array.isArray(admins)) {
            throw new Error('Invalid response format');
          }
          setAdmins(admins);
          setTotalPages(pagination?.totalPages || 1);
          setTotalItems(pagination?.totalItems || admins.length);
        } catch (error) {
          setFetchError(error.response?.data?.message || 'Failed to fetch admins');
          toast.error(error.response?.data?.message || 'Failed to fetch admins');
          console.error('Fetch error:', error);
        } finally {
          setFetchLoading(false);
        }
      }
    };

    fetchAdmins();
  }, [user, token, searchTerm, currentPage]);

  // Filtering function
  const filteredRecords = admins.filter((admin) =>
    ['email', 'adminType', 'role'].some((key) => {
      const value = admin[key];
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
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle modal open/close
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ adminType: '', role: '', email: '', password: '' });
    setFormErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.adminType.trim()) {
      errors.adminType = 'Admin type is required';
    }
    if (!formData.role.trim()) {
      errors.role = 'Role is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  // Handle form submission
  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await axios.post(
        'https://token-based-attendance-system.onrender.com/admin/register-user',
        {
          adminType: formData.adminType.trim(),
          role: formData.role.trim(),
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message || 'Admin registered successfully');
      closeModal();
      // Refresh admin list
      setCurrentPage(1);
      const fetchResponse = await axios.get('https://token-based-attendance-system.onrender.com/admin/get-all-admins', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: itemsPerPage },
      });
      const { admins, pagination } = fetchResponse.data.data || {};
      setAdmins(admins || []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.totalItems || admins.length);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register admin');
      console.error('Register admin error:', error);
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await axios.delete(`https://token-based-attendance-system.onrender.com/admin/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Admin deleted successfully');
      // Refresh admin list
      const fetchResponse = await axios.get('https://token-based-attendance-system.onrender.com/admin/get-all-admins', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: itemsPerPage },
      });
      const { admins, pagination } = fetchResponse.data.data || {};
      setAdmins(admins || []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.totalItems || admins.length);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
      console.error('Delete admin error:', error);
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

      doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Admin Records', 14, 20);

      const columns = [
        { header: 'Admin Type', dataKey: 'adminType' },
        { header: 'Role', dataKey: 'role' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Created At', dataKey: 'createdAt' },
      ];

      const data = sortedRecords.map((admin, index) => {
        if (!admin || !admin._id) {
          console.warn(`Invalid admin at index ${index}:`, admin);
          return { adminType: 'N/A', role: 'N/A', email: 'N/A', createdAt: 'N/A' };
        }
        return {
          adminType: admin.adminType || 'N/A',
          role: admin.role || 'N/A',
          email: admin.email || 'N/A',
          createdAt: admin.createdAt
            ? new Date(admin.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
            : 'N/A',
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

      const filename = `admin_records_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
      if (doc) {
        try {
          const pdfBlob = doc.output('blob');
          window.open(URL.createObjectURL(pdfBlob));
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
      <h2 className="text-2xl font-bold mb-4">MANAGE USERS</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Action Buttons */}
        <div className="px-6 py-4 flex justify-end space-x-2">
          <button
            onClick={openModal}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            Add New Admin
          </button>
        </div>

        {/* Modal for Register Admin */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Register New Admin</h3>
              <form onSubmit={handleRegisterAdmin}>
                <div className="mb-4">
                  <label htmlFor="adminType" className="block text-sm font-medium text-gray-700">
                    Admin Type
                  </label>
                  <input
                    type="text"
                    id="adminType"
                    name="adminType"
                    value={formData.adminType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Super Admin"
                  />
                  {formErrors.adminType && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.adminType}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., admin"
                  />
                  {formErrors.role && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., admin@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter password"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
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
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Admin List</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email, type, or role..."
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
        ) : admins.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('adminType')}
                    >
                      Admin Type
                      {sortConfig.key === 'adminType' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('role')}
                    >
                      Role
                      {sortConfig.key === 'role' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortConfig.key === 'email' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created At
                      {sortConfig.key === 'createdAt' && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRecords.map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.adminType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.role || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${
                        currentPage === number ? 'bg-blue-500 text-white' : 'text-gray-700 bg-white hover:bg-gray-50'
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
            {searchTerm ? 'No admin records match your search.' : 'No admin records found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAdmin;