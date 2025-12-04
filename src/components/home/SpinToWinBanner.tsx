"use client";
import { ArrowRight, Gift } from "@phosphor-icons/react";
import { useSpinWheel } from "@/context/SpinWheelContext";

export default function SpinToWinBanner() {
  const { canSpinToday, setShowWheel, requiresLogin, result } = useSpinWheel();
  
  return (
    <section className="py-12 bg-black border-y border-white/10">
      <div className="w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 text-white">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold">Spin to Win!</h3>
              <p className="text-white/80">
                {requiresLogin 
                  ? "Sign in and spin the wheel for exclusive discounts" 
                  : canSpinToday 
                    ? "Try your luck for up to 25% off!"
                    : result 
                      ? `Your reward: ${result.segment.label}`
                      : "Come back tomorrow for another spin!"
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWheel(true)}
            className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-all flex items-center gap-2"
          >
            {requiresLogin ? "Sign In to Spin" : canSpinToday ? "SPIN NOW" : "VIEW REWARD"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
