"use client";

import * as React from "react";
import Image from "next/image";
import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeMode = "system" | "light" | "dark";

export interface NavbarProps {
  className?: string;
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (getSystemTheme() === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export function Navbar({ className }: NavbarProps) {
  const [theme, setTheme] = React.useState<ThemeMode>("system");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("tcocalc_theme") as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setTheme(saved);
        applyTheme(saved);
      } else {
        applyTheme("system");
      }
    } catch {
      applyTheme("system");
    }

    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        try {
          const current = localStorage.getItem("tcocalc_theme") as ThemeMode | null;
          if (!current || current === "system") {
            applyTheme("system");
          }
        } catch {
          applyTheme("system");
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
    }
  }, []);

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    try {
      localStorage.setItem("tcocalc_theme", mode);
    } catch {}
    applyTheme(mode);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur transition-colors",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 shadow-sm shrink-0">
            <Image src="/icon.svg" width={28} height={28} alt="tcocalc logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                tcocalc
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                TCO Calculator
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Vehicle Total Cost of Ownership Calculator across Cash, Loan, and Lease
            </p>
          </div>
        </div>

        {/* Right: 3-State Theme Toggle Group */}
        <div
          role="radiogroup"
          aria-label="Theme selection"
          className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-300/50 dark:border-slate-800 rounded-lg shrink-0"
        >
          <button
            type="button"
            role="radio"
            aria-checked={theme === "system"}
            aria-label="System theme"
            onClick={() => handleSelectTheme("system")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              theme === "system"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">System</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === "light"}
            aria-label="Light theme"
            onClick={() => handleSelectTheme("light")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              theme === "light"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Light</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === "dark"}
            aria-label="Dark theme"
            onClick={() => handleSelectTheme("dark")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              theme === "dark"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dark</span>
          </button>
        </div>
      </div>
    </header>
  );
}
