import { useEffect, useState } from 'react';
import NavBar from './Navbar';
import AdminSideBar from './SideBar';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';

const Dashboard = () => {
  const [openSidebar, setOpenSidebar] = useState(window.innerWidth >= 768);

  const toggleNav = () => {
    setOpenSidebar(!openSidebar);
  };

  useEffect(() => {
    const handleResize = () => {
      setOpenSidebar(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <AdminSideBar isOpen={openSidebar} toggleSidebar={toggleNav} />
        <div
          className={`flex-1 flex flex-col bg-white-200 transition-all duration-300 w-full ${
            openSidebar ? 'ml-64' : 'ml-0'
          }`}
        >
          <NavBar toggleSidebar={toggleNav} openSidebar={openSidebar} />
          <div className="flex-1 pt-16 overflow-y-auto w-full bg-custom-teal">
            <div className="min-h-[calc(100vh-8rem)]">
              <Outlet />
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;