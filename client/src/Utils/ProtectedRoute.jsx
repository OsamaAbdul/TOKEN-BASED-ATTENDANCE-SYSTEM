import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"


const ProtectedRoutes = ({ children }) => {

    // import user, token and loading from the authContext ( useAuth);

    const { user, token, loading, isAdmin } = useAuth();

   

    
    // if authenticating is going on, show loading state
    if(loading) {
        return (
            <div className="w-full h-full p-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    };

    // if not user or admin, redirect to login
    if(!user || !isAdmin) {
         return <Navigate to="/admin/login" replace />;
    }
    // if true

    return <Outlet /> 
};

export default ProtectedRoutes;