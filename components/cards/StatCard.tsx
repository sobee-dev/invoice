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
  iconClassName 
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-2 bg-slate-50 dark:bg-slate-800 rounded-xl",
          iconClassName
        )}>
          {icon}
        </div>
      </div>
      
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {title}
        </p>
        <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {value}
        </h4>
        
        {trend && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}