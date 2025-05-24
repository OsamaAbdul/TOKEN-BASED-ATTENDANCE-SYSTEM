import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import { PiStudent } from "react-icons/pi";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { LuTicketCheck } from "react-icons/lu";
import { CiUser } from "react-icons/ci";
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';

const Home = () => {
  const { user, token, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalStudents: '0',
    tokensIssued: '0',
    attendanceRate: '0%',
    totalUsers: '0',
  });
  const [dataLoading, setDataLoading] = useState(false);

  // Default fallback values
  const defaultData = {
    totalStudents: '0',
    tokensIssued: '0',
    attendanceRate: '0',
    totalUsers: '0',
  };

  // API endpoints for each metric
  const endpoints = {
    totalStudents: 'https://token-based-attendance-system.onrender.com/admin/get-students',
    tokensIssued: 'https://token-based-attendance-system.onrender.com/admin/get-tokenlist',
    attendanceRate: 'https://token-based-attendance-system.onrender.com/admin/get-attendance',
    totalUsers: 'https://token-based-attendance-system.onrender.com/admin/get-all-admins',
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !token) return;
      setDataLoading(true);
      try {
        // Fetch all metrics concurrently
        const [studentsRes, tokensRes, attendanceRes, usersRes] = await Promise.all([
          axios
            .get(endpoints.totalStudents, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            })
            .catch(() => ({ data: { totalStudents: null } })),
          axios
            .get(endpoints.tokensIssued, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            })
            .catch(() => ({ data: { totalRecords: null } })),
          axios
            .get(endpoints.attendanceRate, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            })
            .catch(() => ({ data: { attendanceRate: null } })),
          axios
            .get(endpoints.totalUsers, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            })
            .catch(() => ({ data: { totalUsers: null } })),
        ]);

        // Combine responses, map totalRecords to tokensIssued
        const newData = {
          totalStudents: studentsRes.data.totalStudents?.toString() || defaultData.totalStudents,
          tokensIssued: tokensRes.data.totalRecords?.toString() || defaultData.tokensIssued,
          attendanceRate: attendanceRes.data.attendanceRate || defaultData.attendanceRate,
          totalUsers: usersRes.data.totalUsers?.toString() || defaultData.totalUsers,
        };

        setDashboardData(newData);

        // Notify user of partial failures
        if (
          !studentsRes.data.totalStudents ||
          !tokensRes.data.totalRecords ||
          !attendanceRes.data.attendanceRate ||
          !usersRes.data.totalUsers
        ) {
          toast.warn('Some dashboard data could not be fetched. Showing default values.');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardData(defaultData);
        toast.error('Failed to load dashboard data. Using default values.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black text-center tracking-tight">
           Admin Dashboard Overview
          </h2>
        </header>
        {dataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white/80 p-6 rounded-2xl shadow-md animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <DashboardCard
              title="Total Students"
              value={dashboardData.totalStudents}
              icon={PiStudent}
              color="teal"
              subValue="Updated recently"
            />
            
            <DashboardCard
              title="Tokens Created"
              value={dashboardData.tokensIssued}
              icon={LuTicketCheck}
              color="indigo"
              subValue="All time"
            />
            <DashboardCard
              title="Marked Attendance"
              value={dashboardData.attendanceRate}
              icon={IoIosCheckmarkCircleOutline}
              color="purple"
              subValue="This month"
            />
            <DashboardCard
              title="Total Users"
              value={dashboardData.totalUsers}
              icon={CiUser}
              color="blue"
              subValue="Active admins"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;