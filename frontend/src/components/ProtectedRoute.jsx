import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const ProtectedRoute = ({ pageTitle }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <h3>Loading Clinic System...</h3>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title={pageTitle} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
