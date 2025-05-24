import { useAuth } from "../Context/AuthContext";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

const NavBar = ({ toggleSidebar, openSidebar }) => {
  const { user, logout } = useAuth();

   // handle logout
  const handleLogout = () => {
    logout(); // Call logout function
    if (toggleSidebar) toggleSidebar(); // Close sidebar on mobile after logout
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md h-16 flex items-center px-4 z-10">
      <button
        onClick={toggleSidebar}
        className="text-gray-600 text-2xl focus:outline-none lg:hidden"
        aria-label={openSidebar ? "Close sidebar" : "Open sidebar"}
      >
        {openSidebar ? <FaTimes /> : <FaBars />}
        {''}
      </button>
      <div className="ml-auto">
        <button className="text-gray-600 bold">User: {' '} {user?.role}</button> 
       
      </div>
     
        <div
            onClick={handleLogout}
            className="text-200 flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-red-600 hover:text-white cursor-pointer"
            aria-label="Logout"
            > {' '}
            <FiLogOut />
            <span>LogOut</span>
          </div>
    </div>
  );
};

export default NavBar;