import React from 'react';

const StudentProfileCard = ({ studentData }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md w-full sm:w-1/2">
      <h3 className="text-xl font-bold text-black mb-4">{studentData?.department || 'N/A'}</h3>
      <hr className="mb-4" />
      <p className="text-gray-700 mb-2">
        <strong>Name:</strong> {studentData?.fullname || 'N/A'}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Matric:</strong> {studentData?.matric || 'N/A'}
      </p>
      <p className="text-gray-700 mb-4">
        <strong>Email:</strong> {studentData?.email || 'N/A'}
      </p>
      <button className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition">
        Edit Profile
      </button>
    </div>
  );
};

export default StudentProfileCard;