import Navbar from "./Navbar";
import Silk from "./Silk";

const Layout = ({ children }) => {
  return (
    <div id="main-scroll-container" className="h-screen w-full flex flex-col relative bg-bg-body overflow-y-auto overflow-x-hidden">
      {/* Silk WebGL Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Silk
          speed={5.3}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.6}
          rotation={0}
        />
      </div>
      
      <div className="sticky top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="pointer-events-auto">
          <Navbar />
        </div>
      </div>
      
      <main className="flex-1 p-4 md:p-8 z-10 relative max-w-[1400px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
