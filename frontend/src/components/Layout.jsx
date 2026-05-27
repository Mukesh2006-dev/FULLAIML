import React from "react";
import Navbar from "./Navbar";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <div className="radial-glow-1"></div>
      <div className="radial-glow-2"></div>
      <div className="radial-glow-3"></div>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
