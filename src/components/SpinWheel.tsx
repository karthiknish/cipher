"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpinWheel, WheelSegment } from "@/context/SpinWheelContext";
import {
  X,
  Gift,
  Confetti,
  Copy,
  Check,
  SpinnerGap,
  Sparkle,
} from "@phosphor-icons/react";

export default function SpinWheel() {
  const {
    segments,
    showWheel,
    isSpinning,
    hasSpun,
    result,
    spin,
    dismissWheel,
    applyReward,
  } = useSpinWheel();

  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / segments.length;

  const handleSpin = async () => {
    if (isSpinning || hasSpun) return;

    try {
      const winningSegment = await spin();
      
      // Calculate final rotation
      const segmentIndex = segments.findIndex(s => s.id === winningSegment.id);
      const baseRotation = 360 * 5; // 5 full rotations
      const segmentRotation = segmentIndex * segmentAngle + segmentAngle / 2;
      const finalRotation = baseRotation + (360 - segmentRotation) + 90; // +90 to align with pointer at top
      
      setRotation(finalRotation);
      setSelectedSegment(winningSegment);
      
      // Show result after spin animation
      setTimeout(() => {
        setShowResult(true);
      }, 5200);
    } catch (error) {
      console.error("Spin error:", error);
    }
  };

  const handleCopyCode = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    dismissWheel();
    setShowResult(false);
    setSelectedSegment(null);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showWheel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showWheel]);

  if (!showWheel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSpinning) {
            handleClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative bg-white max-w-lg w-full p-6 md:p-8"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isSpinning}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkle className="w-5 h-5" />
              <span className="text-xs tracking-[0.2em] text-gray-500">WELCOME GIFT</span>
              <Sparkle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">
              SPIN TO WIN
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Try your luck for exclusive discounts!
            </p>
          </div>

          {/* Wheel Container */}
          <div className="relative flex justify-center mb-6">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-black" />
            </div>

            {/* Wheel */}
            <div className="relative w-64 h-64 md:w-72 md:h-72">
              <motion.div
                ref={wheelRef}
                className="w-full h-full"
                animate={{ rotate: rotation }}
                transition={{
                  duration: 5,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                  {/* Wheel segments */}
                  {segments.map((segment, index) => {
                    const startAngle = (index / segments.length) * 360 - 90;
                    const endAngle = ((index + 1) / segments.length) * 360 - 90;
                    const midAngle = (startAngle + endAngle) / 2;
                    
                    // Calculate arc path
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 100 + 96 * Math.cos(startRad);
                    const y1 = 100 + 96 * Math.sin(startRad);
                    const x2 = 100 + 96 * Math.cos(endRad);
                    const y2 = 100 + 96 * Math.sin(endRad);
                    
                    // Text position (closer to outer edge)
                    const textRad = (midAngle * Math.PI) / 180;
                    const textX = 100 + 62 * Math.cos(textRad);
                    const textY = 100 + 62 * Math.sin(textRad);
                    
                    return (
                      <g key={segment.id}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 96 96 0 0 1 ${x2} ${y2} Z`}
                          fill={segment.color}
                          stroke="#1a1a1a"
                          strokeWidth="1"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                        >
                          {segment.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Outer ring */}
                  <circle cx="100" cy="100" r="98" fill="none" stroke="black" strokeWidth="4" />
                </svg>
              </motion.div>

              {/* Center Button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning || hasSpun}
                className="absolute inset-0 m-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-black flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 shadow-lg z-10"
              >
                {isSpinning ? (
                  <SpinnerGap className="w-8 h-8 animate-spin" />
                ) : hasSpun ? (
                  <Gift className="w-8 h-8" />
                ) : (
                  <span className="text-xs font-bold tracking-wider">SPIN</span>
                )}
              </button>
            </div>
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                {result.segment.type === "tryAgain" ? (
                  <div>
                    <p className="text-lg font-medium mb-2">Better luck next time!</p>
                    <p className="text-gray-500 text-sm">
                      Sign up for our newsletter for exclusive deals.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Confetti className="w-6 h-6 text-amber-500" />
                      <p className="text-lg font-medium">Congratulations!</p>
                      <Confetti className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      You won <span className="font-bold">{result.segment.label}</span>
                    </p>
                    
                    {/* Promo Code */}
                    <div className="bg-gray-100 p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 tracking-wider">YOUR CODE</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-bold tracking-[0.15em]">
                          {result.code}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 hover:bg-gray-200 transition"
                          title="Copy code"
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Valid for 7 days
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleCopyCode();
                        handleClose();
                      }}
                      className="w-full bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 transition"
                    >
                      COPY & START SHOPPING
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-spin Instructions */}
          {!hasSpun && !showResult && (
            <div className="text-center text-sm text-gray-500">
              <p>Click the wheel or SPIN button to try your luck!</p>
              <p className="text-xs mt-2">One spin per visitor • Rewards expire in 7 days</p>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-black" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-black" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black" />
        </motion.div>

        {/* Floating Trigger (shown when wheel is dismissed but reward not used) */}
      </motion.div>
    </AnimatePresence>
  );
}

// Mini trigger button to re-open wheel
export function SpinWheelTrigger() {
  const { result, hasSpun, showWheel, setShowWheel } = useSpinWheel();

  // Only show if user has a reward and wheel is closed
  if (!result || !hasSpun || showWheel || result.segment.type === "tryAgain") {
    return null;
  }

  // Check if reward is still valid
  if (Date.now() > result.expiresAt) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      onClick={() => setShowWheel(true)}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition"
      title="View your reward"
    >
      <Gift className="w-6 h-6" />
    </motion.button>
  );
}
