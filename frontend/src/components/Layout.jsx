import Navbar from "./Navbar";
import Silk from "./Silk";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Silk WebGL Background - Moved outside scroll container and forced to screen dimensions */}
      <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-40">
        <Silk
          speed={5.3}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.6}
          rotation={0}
        />
      </div>

      <div id="main-scroll-container" className="h-screen w-full flex flex-col relative overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 left-0 right-0 z-50 w-full pointer-events-none">
          <div className="pointer-events-auto">
            <Navbar />
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 z-10 relative max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default Layout;
