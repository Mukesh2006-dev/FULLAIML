import { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Layout from "./components/Layout";
import { lazyWithPreload } from "./utils/lazyWithPreload";
import "./App.css";

// Lazy load the pages for code splitting
const Login = lazyWithPreload(() => import("./pages/Login"));
const Register = lazyWithPreload(() => import("./pages/Register"));
const Dashboard = lazyWithPreload(() => import("./pages/Dashboard"));
const Preprocessing = lazyWithPreload(() => import("./pages/Preprocessing"));
const Eda = lazyWithPreload(() => import("./pages/EDA"));
const Visualizations = lazyWithPreload(() => import("./pages/Visualizations"));
const ModelTraining = lazyWithPreload(() => import("./pages/ModelTraining"));
const ModelComparison = lazyWithPreload(() => import("./pages/ModelComparison"));
const Profile = lazyWithPreload(() => import("./pages/Profile"));
const Predictions = lazyWithPreload(() => import("./pages/Predictions"));
const ModelManagement = lazyWithPreload(() => import("./pages/ModelManagement"));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Simple route protector that renders Layout and Outlet with its own Suspense
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Suspense fallback={<SkeletonLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
};

// Skeleton loading fallback for protected pages
const SkeletonLoader = () => (
  <div className="w-full h-full p-4 md:p-8 flex flex-col gap-8 animate-pulse">
    <div className="h-12 w-1/3 max-w-[300px] bg-white/10 rounded-md"></div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[400px] bg-bg-card backdrop-blur-md rounded-xl border border-white/5 shadow-md"></div>
      <div className="h-[400px] bg-bg-card backdrop-blur-md rounded-xl border border-white/5 shadow-md hidden lg:block"></div>
    </div>
  </div>
);

// Global loader for initial page load (Login/Register)
const GlobalLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-bg-root">
    <div className="size-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
  </div>
);

function App() {
  useEffect(() => {
    // Preload critical routes after initial render
    Dashboard.preload();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/preprocessing" element={<Preprocessing />} />
              <Route path="/eda" element={<Eda />} />
              <Route path="/visualizations" element={<Visualizations />} />
              <Route path="/ml-model" element={<ModelTraining />} />
              <Route path="/ml-comparison" element={<ModelComparison />} />
              <Route path="/models" element={<ModelManagement />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
