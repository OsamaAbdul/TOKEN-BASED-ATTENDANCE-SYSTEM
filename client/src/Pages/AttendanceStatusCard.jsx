import React from 'react';

const AttendanceStatusCard = ({ studentData }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md w-full sm:w-1/2">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black">ATTENDANCE STATUS</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${
            studentData?.attendance?.[0]?.status === 'present' ? 'text-green-500' : 'text-red-500'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={studentData?.attendance?.[0]?.status === 'present' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
          />
        </svg>
      </div>
      <p className="text-gray-700 mt-2">
        {studentData?.attendance?.[0]
          ? `${
              studentData.attendance[0].status.charAt(0).toUpperCase() +
              studentData.attendance[0].status.slice(1)
            } - ${studentData.attendance[0].courseCode}`
          : 'No attendance recorded'}
      </p>
    </div>
  );
};

export default AttendanceStatusCard;