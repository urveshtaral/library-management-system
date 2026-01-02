// src/routes/AdminRoutes.js - FIXED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load admin components
const AdminDashboard = lazy(() => import('../dashboard/AdminDashboard/AdminDashboard'));
const AdminLogin = lazy(() => import('../components/AdminLogin')); // Added this

const AdminRoutes = () => {
  return (
    <Routes>
      {/* ✅ FIXED: Admin dashboard route */}
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      {/* ✅ FIXED: Admin login route inside admin section */}
      <Route path="/login" element={<AdminLogin />} />
      {/* Add more admin routes here */}
    </Routes>
  );
};

export default AdminRoutes;