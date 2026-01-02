// src/routes/PublicRoutes.js - FIXED VERSION
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load components
const Home = lazy(() => import('../pages/Home'));
const Signin = lazy(() => import('../pages/Signin'));
const Register = lazy(() => import('../pages/Register'));
const AllBooks = lazy(() => import('../pages/AllBooks'));
const Events = lazy(() => import('../pages/Events'));
const News = lazy(() => import('../components/News'));
const AdminLogin = lazy(() => import('../components/AdminLogin'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));
const NotFound = lazy(() => import('../pages/NotFound'));

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/books" element={<AllBooks />} />
      <Route path="/events" element={<Events />} />
      <Route path="/news" element={<News />} />
      {/* ✅ FIXED: Admin login route */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default PublicRoutes;