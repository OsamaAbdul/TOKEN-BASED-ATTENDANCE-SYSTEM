import { NavLink } from "react-router-dom";
import { FaCode, FaTachometerAlt, FaCogs } from "react-icons/fa";
import { MdPlaylistAddCheckCircle } from "react-icons/md";
import { RiUserAddLine } from "react-icons/ri";
import { useAuth } from "../Context/AuthContext";
import { PiStudent} from "react-icons/pi";


const AdminSideBar = ({ isOpen, toggleSidebar }) => {

  const { logout } = useAuth();

  // handle logout
  const handleLogout = () => {
    logout(); // Call logout function
    if (toggleSidebar) toggleSidebar(); // Close sidebar on mobile after logout
  };


  return (
    <>
       <div
        className={`text-white h-screen fixed left-0 top-0 bottom-0 space-y-2 transition-all duration-300 z-20 ${
          isOpen ? "w-64" : "w-0 -left-64"
        } overflow-hidden lg:w-64 lg:left-0`}
        style={{ backgroundColor: "#00a774" }}
      >
      <div className="h-12 flex items-center justify-around px-10" style={{ backgroundColor: "#00a774" }}>
            <img
                src="https://myexamcode.net/wp-content/uploads/2022/09/NSUK-1024x1024.jpg"
                alt="NSUK Logo"
                className="h-10 w-10 object-contain rounded-full"
            />
            <h3 className="text-2xl font-Roboto text-white">NSUK</h3>
            
    </div>
    <hr />
        <div className="px-4">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            end
            aria-label="Dashboard"
          >
            <FaTachometerAlt />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/admin/dashboard/students"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            aria-label="Students"
          >
            <PiStudent />
            <span>Students</span>
          </NavLink>

          <NavLink
            to="/admin/dashboard/tokens"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            aria-label="token"
          >
            <FaCode />
            <span>Tokens</span>
          </NavLink>

          <NavLink
            to="/admin/dashboard/attendance"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            aria-label="attendance"
          >
            <MdPlaylistAddCheckCircle />
            <span>Attendance</span>
          </NavLink>

          <NavLink
            to="/admin/dashboard/add-admin"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            aria-label="add-admin"
          >
            <RiUserAddLine />
            <span>Add User</span>
          </NavLink>

          <NavLink
            to="/admin/dashboard/settings"
            className={({ isActive }) =>
              `${isActive ? "bg-teal-500 text-white" : "text-gray-200"} flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white`
            }
            aria-label="Settings"
          >
            <FaCogs />
            <span>Settings</span>
          </NavLink>
          
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default AdminSideBar;