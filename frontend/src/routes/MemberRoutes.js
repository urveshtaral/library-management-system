import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const MemberDashboard = lazy(() => import('../dashboard/MemberDashboard/MemberDashboard'));
const Profile = lazy(() => import('../pages/Profile'));

const MemberRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MemberDashboard />} />
      <Route path="/profile" element={<Profile />} />
      {/* Add more member routes here */}
    </Routes>
  );
};

export default MemberRoutes;