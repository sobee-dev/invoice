import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fbf8fd] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-[0px_8px_16px_rgba(27,46,94,0.10)] border border-[#c5c6d0] p-8">
        {children}
      </div>
    </div>
  );
}
