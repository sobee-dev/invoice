"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  className?: string;
  iconClassName?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-5 rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] transition-shadow hover:shadow-[0px_4px_8px_rgba(27,46,94,0.08)]",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "p-2 bg-[#f5f3f8] rounded-lg",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#757680] uppercase tracking-widest">
          {title}
        </p>
        <h4 className="text-2xl font-bold text-[#1b1b1f] mt-1 tracking-tight">
          {value}
        </h4>

        {trend && (
          <p className="text-xs text-[#757680] mt-2">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
