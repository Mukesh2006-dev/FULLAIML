import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col relative bg-bg-body overflow-y-auto">
      {/* Ambient Background Glows */}
      <div className="fixed -top-[15%] -left-[10%] w-[55%] h-[55%] bg-[radial-gradient(ellipse_80%_60%_at_center,rgba(0,240,255,0.06)_0%,transparent_70%)] z-0 pointer-events-none blur-[40px]"></div>
      <div className="fixed -bottom-[15%] -right-[10%] w-[55%] h-[55%] bg-[radial-gradient(ellipse_60%_50%_at_center,rgba(124,58,237,0.06)_0%,transparent_70%)] z-0 pointer-events-none blur-[40px]"></div>
      <div className="fixed top-[30%] left-[35%] w-[40%] h-[40%] bg-[radial-gradient(ellipse_50%_40%_at_center,rgba(236,72,153,0.03)_0%,transparent_60%)] z-0 pointer-events-none blur-[60px]"></div>
      
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8 pt-20 z-10 relative max-w-[1400px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
