import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const CosmicCursor = () => {
  const [cursorVariant, setCursorVariant] = useState("default");
  const [cursorText, setCursorText] = useState("");
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // For the pulsing effect
  const pulseScale = useMotionValue(1);
  const pulseOpacity = useMotionValue(0.7);

  // For the trail effect
  const trailCount = 5;
  const trailElements = Array(trailCount).fill(0);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);

      // Trigger pulse effect on mouse move
      pulseScale.set(1.3);
      pulseOpacity.set(0.9);
      setTimeout(() => {
        pulseScale.set(1);
        pulseOpacity.set(0.7);
      }, 100);
    };

    window.addEventListener('mousemove', moveCursor);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY, pulseScale, pulseOpacity]);

  const variants = {
    default: {
      width: 32,
      height: 32,
      backgroundColor: "transparent",
      border: "2px solid #7e22ce",
      mixBlendMode: "difference",
      transition: { type: "spring", damping: 20, stiffness: 300 }
    },
    hover: {
      width: 64,
      height: 64,
      backgroundColor: "rgba(165, 180, 252, 0.2)",
      border: "1px solid #a5b4fc",
      transition: { type: "spring", damping: 20, stiffness: 300 }
    },
    click: {
      width: 40,
      height: 40,
      backgroundColor: "rgba(236, 72, 153, 0.3)",
      border: "1px solid #ec4899",
      transition: { type: "spring", damping: 20, stiffness: 500 }
    },
    text: {
      width: 120,
      height: 120,
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      border: "1px solid #10b981",
      transition: { type: "spring", damping: 20, stiffness: 300 }
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const spring = {
    type: "spring",
    damping: 20,
    stiffness: 300,
    restDelta: 0.001
  };

  return (
    <>
      {/* Main Cursor */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        variants={variants}
        animate={cursorVariant}
        transition={spring}
      >
        {/* Pulsing orb effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
          style={{
            scale: pulseScale,
            opacity: pulseOpacity,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        />

        {/* Glowing center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white blur-[1px]"></div>
        </div>

        {/* Text label */}
        {cursorText && (
          <motion.div
            className="absolute top-full mt-2 text-xs text-white whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {cursorText}
          </motion.div>
        )}
      </motion.div>

      {/* Cursor Trail */}
      {trailElements.map((_, i) => (
        <motion.div
          key={i}
          className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998] bg-gradient-to-br from-purple-400 to-pink-400 opacity-0"
          style={{
            x: cursorX,
            y: cursorY,
            scale: 1 - (i * 0.15),
            opacity: 0.5 - (i * 0.1),
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            delay: i * 0.01
          }}
        />
      ))}
    </>
  );
};

// Add this to your _app.js or main layout component
const AppWithCosmicCursor = ({ children }) => {
  const [cursorVariant, setCursorVariant] = useState("default");
  const [cursorText, setCursorText] = useState("");

  return (
    <div
      className="min-h-screen"
      onMouseEnter={() => setCursorVariant("default")}
      onMouseLeave={() => setCursorVariant("hidden")}
    >
      <CosmicCursor
        variant={cursorVariant}
        text={cursorText}
      />

      {/* Add hover effects to interactive elements */}
      {React.Children.map(children, child => {
        return React.cloneElement(child, {
          onMouseEnter: () => {
            if (child.props?.href || child.props?.onClick) {
              setCursorVariant("hover");
              setCursorText(child.props?.title || "Click me");
            }
          },
          onMouseLeave: () => {
            setCursorVariant("default");
            setCursorText("");
          },
          onMouseDown: () => setCursorVariant("click"),
          onMouseUp: () => setCursorVariant("hover"),
        });
      })}
    </div>
  );
};

export default CosmicCursor