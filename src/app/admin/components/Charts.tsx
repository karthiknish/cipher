"use client";

// Mini Bar Chart Component
export function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 bg-black/80 rounded-sm transition-all hover:bg-black"
          style={{ height: `${(value / maxValue) * 100}%`, minHeight: value > 0 ? "4px" : "0" }}
        />
      ))}
    </div>
  );
}

// Donut Chart Component
export function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0) {
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + angle) * Math.PI) / 180;
          
          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              className="transition-opacity hover:opacity-80"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-medium">{total}</span>
      </div>
    </div>
  );
}
