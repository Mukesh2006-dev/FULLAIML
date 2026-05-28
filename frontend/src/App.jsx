import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import "./App.css";

// Lazy load the pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Preprocessing = lazy(() => import("./pages/Preprocessing"));
const Eda = lazy(() => import("./pages/EDA"));
const Visualizations = lazy(() => import("./pages/Visualizations"));
const ModelTraining = lazy(() => import("./pages/ModelTraining"));

// Simple route protector that renders Layout and Outlet
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      <p className="text-lg font-medium text-indigo-400">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/preprocessing" element={<Preprocessing />} />
            <Route path="/eda" element={<Eda />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/ml-model" element={<ModelTraining />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
