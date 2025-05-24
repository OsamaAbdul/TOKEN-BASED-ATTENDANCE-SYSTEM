import React from 'react';
import styled from 'styled-components';
import { IoHome, IoPerson, IoBook, IoStatsChart, IoSettings, IoLogOut, IoCheckmarkCircle } from 'react-icons/io5';
import { useAuth } from '../Context/AuthContext';
import { FiLogOut } from "react-icons/fi";


const SideBar = ({ sidebarOpen, setSidebarOpen, handleLogout, setActivePage, activePage }) => {

   const { logout} = useAuth();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IoHome className="text-lg sm:text-xl" /> },
    { id: 'attendance', label: 'Submit Attendance', icon: <IoCheckmarkCircle className="text-lg sm:text-xl" /> },
  ];

   // handle logout
  const handleLogout = () => {
    logout(); // Call logout function
    if (toggleSidebar) toggleSidebar(); // Close sidebar on mobile after logout
  };


  return (
    <StyledSidebar>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20 max-h-screen overflow-y-auto`}
      >
        <div className="p-4 sm:p-6">
          <img
            src="https://th.bing.com/th/id/R.b0944892ce57fc6f80f05386dae9647c?rik=oimvHP2vyPrfXQ&pid=ImgRaw&r=0"
            alt="Logo"
            className="mx-auto mb-4 sm:mb-6 w-20 sm:w-24"
          />
          <nav className="space-y-3 sm:space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false); // Close sidebar on mobile
                }}
                className={`flex items-center gap-2 w-full text-left text-gray-700 hover:text-teal-500 text-base sm:text-lg rounded-lg p-2 transition-colors ${
                  activePage === item.id ? 'bg-teal-100 text-teal-500 font-semibold' : ''
                }`}
                aria-current={activePage === item.id ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-4 sm:bottom-6 px-4 sm:px-6">
            <div
                      onClick={handleLogout}
                      className="text-200 flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-red-600 hover:text-white cursor-pointer"
                      aria-label="Logout"
                      > {' '}
                      <FiLogOut />
                      <span>LogOut</span>
                    </div>
        </div>
      </aside>
    </StyledSidebar>
  );
};

const StyledSidebar = styled.div`
  aside {
    max-height: 100vh;
  }
`;

export default SideBar;