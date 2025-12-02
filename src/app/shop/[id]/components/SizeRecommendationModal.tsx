"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Sparkle } from "@phosphor-icons/react";
import { useSizeRecommendation } from "@/context/SizeRecommendationContext";
import { useToast } from "@/context/ToastContext";

interface SizeRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  availableSizes: string[];
  onSizeSelect: (size: string) => void;
}

export default function SizeRecommendationModal({ 
  isOpen, 
  onClose, 
  category, 
  availableSizes, 
  onSizeSelect 
}: SizeRecommendationModalProps) {
  const { measurements, saveMeasurements, getRecommendation, estimateFromHeightWeight } = useSizeRecommendation();
  const toast = useToast();
  
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [height, setHeight] = useState(measurements?.height || 170);
  const [weight, setWeight] = useState(measurements?.weight || 70);
  const [chest, setChest] = useState(measurements?.chest || 0);
  const [waist, setWaist] = useState(measurements?.waist || 0);
  const [hips, setHips] = useState(measurements?.hips || 0);
  const [fitPreference, setFitPreference] = useState<"slim" | "regular" | "relaxed">(
    measurements?.fitPreference || "regular"
  );
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getRecommendation>>(null);

  useEffect(() => {
    if (measurements) {
      setHeight(measurements.height); 
      setWeight(measurements.weight);
      setChest(measurements.chest); 
      setWaist(measurements.waist);
      setHips(measurements.hips); 
      setFitPreference(measurements.fitPreference);
    }
  }, [measurements]);

  const handleCalculate = () => {
    let newMeasurements;
    if (mode === "quick") {
      const estimated = estimateFromHeightWeight(height, weight);
      newMeasurements = { 
        height, 
        weight, 
        chest: estimated.chest, 
        waist: estimated.waist, 
        hips: estimated.hips, 
        fitPreference 
      };
    } else {
      newMeasurements = { height, weight, chest, waist, hips, fitPreference };
    }
    saveMeasurements(newMeasurements);
    const rec = getRecommendation(category, availableSizes);
    setRecommendation(rec);
    toast.success("Size recommendation calculated!");
  };

  const handleSelectRecommended = () => {
    if (recommendation) { 
      onSizeSelect(recommendation.recommendedSize); 
      onClose(); 
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight flex items-center gap-2">
                <Sparkle className="w-5 h-5" /> SIZE FINDER
              </h2>
              <p className="text-xs text-gray-400 mt-1">AI-powered size recommendation</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setMode("quick")} 
              className={`flex-1 py-3 text-sm tracking-wider transition ${
                mode === "quick" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              QUICK
            </button>
            <button 
              onClick={() => setMode("detailed")} 
              className={`flex-1 py-3 text-sm tracking-wider transition ${
                mode === "detailed" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              DETAILED
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">HEIGHT (CM)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(Number(e.target.value))} 
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">WEIGHT (KG)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(Number(e.target.value))} 
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
                />
              </div>
            </div>
            {mode === "detailed" && (
              <>
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">CHEST (CM)</label>
                  <input 
                    type="number" 
                    value={chest} 
                    onChange={(e) => setChest(Number(e.target.value))} 
                    placeholder="Measure around fullest part" 
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">WAIST (CM)</label>
                  <input 
                    type="number" 
                    value={waist} 
                    onChange={(e) => setWaist(Number(e.target.value))} 
                    placeholder="Measure at natural waistline" 
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">HIPS (CM)</label>
                  <input 
                    type="number" 
                    value={hips} 
                    onChange={(e) => setHips(Number(e.target.value))} 
                    placeholder="Measure around fullest part" 
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-6">
            <label className="block text-xs tracking-wider text-gray-500 mb-3">FIT PREFERENCE</label>
            <div className="flex gap-2">
              {(["slim", "regular", "relaxed"] as const).map((fit) => (
                <button 
                  key={fit} 
                  onClick={() => setFitPreference(fit)} 
                  className={`flex-1 py-3 text-sm tracking-wider capitalize transition ${
                    fitPreference === fit 
                      ? "bg-black text-white" 
                      : "border border-gray-200 hover:border-black"
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleCalculate} 
            className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium mt-6 hover:bg-gray-900 transition"
          >
            FIND MY SIZE
          </button>
          {recommendation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-6 p-6 bg-green-50 border border-green-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-700">{recommendation.recommendedSize}</span>
                </div>
                <div>
                  <p className="font-medium">Recommended Size</p>
                  <p className="text-xs text-gray-500">{recommendation.confidence}% confidence</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{recommendation.notes}</p>
              {recommendation.alternativeSize && (
                <p className="text-xs text-gray-500 mb-4">Alternative: {recommendation.alternativeSize}</p>
              )}
              <button 
                onClick={handleSelectRecommended} 
                className="w-full bg-green-600 text-white py-3 text-sm tracking-wider font-medium hover:bg-green-700 transition"
              >
                SELECT {recommendation.recommendedSize}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
