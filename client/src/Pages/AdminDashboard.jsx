import React, { useEffect, useState } from "react"
import { useAuth } from "../Context/AuthContext"
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const AdminDashboard = () => {

    const { user, token, logout} = useAuth();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(''); // setting error to empty


    const navigate = useNavigate();


    // What happend whenever the sites loads

    useEffect(()=> {
        // checking for token and user
        if(user && token) {
            if(user.role !== "admin") {
                toast.error("Only admin can access this page!")
                navigate('/auth/admin/login');
                return;
            };

            setUserData(user); // if user is "admin" assign the user to the setuserdata
        } else {
            toast.error("Please go back and login to access the admin dashboard");
            navigate('/auth/admin/login'); // redirect to login
        }
    }, [navigate, user, token]) // re-run whenever one of these changes


    // Handle submit

    return (
        <>

        </>
    )
}