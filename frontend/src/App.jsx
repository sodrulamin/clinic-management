import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { RoleMenus } from './pages/RoleMenus';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { Appointments } from './pages/Appointments';
import { AppointmentRequests } from './pages/AppointmentRequests';
import { Diagnoses } from './pages/Diagnoses';
import { WritePrescription } from './pages/WritePrescription';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Portal Routes */}
            <Route element={<ProtectedRoute pageTitle="Dashboard Overview" />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="User Account Management" />}>
              <Route path="/users" element={<Users />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Role & Menu Permission Config" />}>
              <Route path="/role-menus" element={<RoleMenus />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Patients Medical Records" />}>
              <Route path="/patients" element={<Patients />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Doctor Information & Schedules" />}>
              <Route path="/doctors" element={<Doctors />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Appointment Management" />}>
              <Route path="/appointments" element={<Appointments />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Patient Prescription Form" />}>
              <Route path="/prescriptions/write/:appointmentId" element={<WritePrescription />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Appointment Request Review" />}>
              <Route path="/appointment-requests" element={<AppointmentRequests />} />
            </Route>

            <Route element={<ProtectedRoute pageTitle="Diagnoses Master List" />}>
              <Route path="/diagnoses" element={<Diagnoses />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
