import React from 'react';

export const BrandLogo: React.FC<{ compact?: boolean; light?: boolean }> = ({ compact = false, light = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2D52] via-[#0E4A7B] to-[#0D9488] flex items-center justify-center shadow-md shrink-0">
        {/* Medical Cross + AI Circuit Nodes + Human Pulse */}
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 7H23V17H33V23H23V33H17V23H7V17H17V7Z" fill="white" fillOpacity="0.92" />
          <circle cx="11" cy="11" r="2.2" fill="#34D399" />
          <circle cx="29" cy="11" r="2.2" fill="#38BDF8" />
          <path d="M9 20H14L16.5 16L19.5 24L22 18L24.5 20H31" stroke="#0B2D52" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className={`font-display font-bold text-base tracking-tight ${light ? 'text-white' : 'text-[#0B2D52]'}`}>
            AI vs Human Doctor
          </div>
          <div className={`text-[11px] font-medium ${light ? 'text-sky-200' : 'text-teal-700'}`}>
            Smart Healthcare Comparison
          </div>
        </div>
      )}
    </div>
  );
};
