"use client";

import { motion } from "framer-motion";

const sizeCharts = {
  tops: {
    title: "Tops & Hoodies",
    headers: ["Size", "Chest (in)", "Length (in)", "Sleeve (in)"],
    rows: [
      ["XS", "34-36", "26", "32"],
      ["S", "36-38", "27", "33"],
      ["M", "38-40", "28", "34"],
      ["L", "40-42", "29", "35"],
      ["XL", "42-44", "30", "36"],
      ["XXL", "44-46", "31", "37"],
    ],
  },
  bottoms: {
    title: "Bottoms",
    headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
    rows: [
      ["XS", "26-28", "34-36", "30"],
      ["S", "28-30", "36-38", "31"],
      ["M", "30-32", "38-40", "32"],
      ["L", "32-34", "40-42", "32"],
      ["XL", "34-36", "42-44", "33"],
      ["XXL", "36-38", "44-46", "33"],
    ],
  },
  outerwear: {
    title: "Outerwear",
    headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)"],
    rows: [
      ["XS", "36-38", "27", "16"],
      ["S", "38-40", "28", "17"],
      ["M", "40-42", "29", "18"],
      ["L", "42-44", "30", "19"],
      ["XL", "44-46", "31", "20"],
      ["XXL", "46-48", "32", "21"],
    ],
  },
};

const measurementGuide = [
  {
    title: "Chest",
    description: "Measure around the fullest part of your chest, keeping the tape horizontal.",
  },
  {
    title: "Waist",
    description: "Measure around your natural waistline, keeping the tape comfortably loose.",
  },
  {
    title: "Hip",
    description: "Measure around the fullest part of your hips, approximately 8 inches below your waist.",
  },
  {
    title: "Inseam",
    description: "Measure from the crotch seam to the bottom of the leg along the inside seam.",
  },
  {
    title: "Sleeve",
    description: "Measure from the center back of your neck, across the shoulder, and down to the wrist.",
  },
  {
    title: "Shoulder",
    description: "Measure from the edge of one shoulder to the other across the back.",
  },
];

export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">Size Guide</h1>
          <p className="text-gray-500 mb-12 max-w-2xl">
            Find your perfect fit. Our garments are designed with a relaxed, contemporary silhouette. 
            If you prefer a more fitted look, we recommend sizing down.
          </p>
        </motion.div>

        {/* Fit Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gray-50 p-6 mb-12"
        >
          <h3 className="text-sm tracking-[0.2em] text-gray-400 mb-3">FIT GUIDE</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="font-medium mb-1">Relaxed Fit</p>
              <p className="text-sm text-gray-500">Hoodies, Oversized Tees — Room for layering, dropped shoulders</p>
            </div>
            <div>
              <p className="font-medium mb-1">Regular Fit</p>
              <p className="text-sm text-gray-500">Classic Tees, Pants — True to size, comfortable movement</p>
            </div>
            <div>
              <p className="font-medium mb-1">Slim Fit</p>
              <p className="text-sm text-gray-500">Base Layers — Closer to body, minimal ease</p>
            </div>
          </div>
        </motion.div>

        {/* Size Charts */}
        <div className="space-y-12 mb-16">
          {Object.entries(sizeCharts).map(([key, chart], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <h2 className="text-xl font-medium mb-4 pb-2 border-b border-gray-200">
                {chart.title}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {chart.headers.map((header) => (
                        <th
                          key={header}
                          className="py-4 pr-8 text-xs tracking-[0.15em] text-gray-400 font-normal"
                        >
                          {header.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`py-4 pr-8 ${cellIndex === 0 ? "font-medium" : "text-gray-600"}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How to Measure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-gray-200">
            How to Measure
          </h2>
          <p className="text-gray-500 mb-8">
            For the most accurate measurements, use a flexible measuring tape and measure over 
            lightweight clothing or underwear. Keep the tape snug but not tight.
          </p>
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-7 grid gap-6">
              {measurementGuide.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-xs tracking-[0.15em] text-gray-400 w-12 flex-shrink-0 pt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:col-span-5 flex items-center justify-center bg-gray-50 p-8">
              <svg viewBox="0 0 300 400" className="w-full h-auto max-w-[300px] text-gray-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Body Outline */}
                <path d="M150 20 L180 30 L230 40 L240 150 L220 160 L200 60 L200 200 L220 380 L150 380 L80 380 L100 200 L100 60 L80 160 L60 150 L70 40 L120 30 Z" 
                      className="text-gray-200" fill="#f9fafb" stroke="none" />
                <path d="M150 20 L180 30 L230 40 L240 150 L220 160 L200 60 L200 200 L220 380 M150 380 L80 380 L100 200 L100 60 L80 160 L60 150 L70 40 L120 30 Z" 
                      strokeLinecap="round" strokeLinejoin="round" className="text-gray-300" />
                
                {/* 1. Chest */}
                <line x1="100" y1="80" x2="200" y2="80" className="text-black" strokeDasharray="4 2" />
                <text x="210" y="85" className="text-[10px] fill-black font-mono">01</text>

                {/* 2. Waist */}
                <line x1="100" y1="130" x2="200" y2="130" className="text-black" strokeDasharray="4 2" />
                <text x="210" y="135" className="text-[10px] fill-black font-mono">02</text>

                {/* 3. Hip */}
                <line x1="100" y1="170" x2="200" y2="170" className="text-black" strokeDasharray="4 2" />
                <text x="210" y="175" className="text-[10px] fill-black font-mono">03</text>

                {/* 4. Inseam */}
                <line x1="150" y1="200" x2="150" y2="380" className="text-black" strokeDasharray="4 2" />
                <text x="155" y="290" className="text-[10px] fill-black font-mono">04</text>

                {/* 5. Sleeve */}
                <path d="M150 30 L230 40 L240 150" className="text-black" strokeDasharray="4 2" />
                <text x="250" y="100" className="text-[10px] fill-black font-mono">05</text>

                {/* 6. Shoulder */}
                <line x1="70" y1="40" x2="230" y2="40" className="text-black" strokeDasharray="4 2" />
                <text x="150" y="35" className="text-[10px] fill-black font-mono text-center" textAnchor="middle">06</text>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 pt-12 border-t border-gray-200 text-center"
        >
          <h3 className="text-lg font-medium mb-2">Still unsure about your size?</h3>
          <p className="text-gray-500 mb-6">
            Our team is here to help. Contact us with your measurements and we will recommend the best fit.
          </p>
          <a
            href="/contact"
            className="inline-block bg-black text-white px-8 py-3 text-sm tracking-[0.1em] hover:bg-gray-900 transition"
          >
            CONTACT US
          </a>
        </motion.div>
      </div>
    </main>
  );
}
