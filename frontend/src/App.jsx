import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Preprocessing from "./pages/Preprocessing";
import Eda from "./pages/EDA";
import Visualizations from "./pages/Visualizations";
import ModelTraining from "./pages/ModelTraining";
import Layout from "./components/Layout";
import "./App.css";

// Simple route protector
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/preprocessing"
          element={
            <ProtectedRoute>
              <Preprocessing />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/eda"
          element={
            <ProtectedRoute>
              <Eda />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/visualizations"
          element={
            <ProtectedRoute>
              <Visualizations />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ml-model"
          element={
            <ProtectedRoute>
              <ModelTraining />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
