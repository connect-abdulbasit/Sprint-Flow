import React from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-fg font-sans relative flex items-center justify-center p-4 sm:p-8">
      {/* Background gradients/blobs for SaaS look */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent2 rounded-full blur-[150px] opacity-10"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Subtle top branding or back action could go here if needed, but keeping clean for now */}
        {children}
      </div>
    </div>
  );
}
