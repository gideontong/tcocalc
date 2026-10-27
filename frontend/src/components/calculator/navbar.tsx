"use client";

import * as React from "react";
import Image from "next/image";
import {
  Monitor,
  Sun,
  Moon,
  Share2,
  ChevronDown,
  Check,
  Link as LinkIcon,
  FileCode,
  FileSpreadsheet,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TCOInput, TCOResult, SavedVehicle, calculateTCO } from "@/lib/tco";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import {
  generateShareableUrl,
  exportToJson,
  exportScheduleToCsv,
} from "@/lib/export";

export type ThemeMode = "system" | "light" | "dark";

export interface NavbarProps {
  className?: string;
  vehicles?: SavedVehicle[];
  activeInput?: TCOInput;
  activeResult?: TCOResult;
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

export function Navbar({
  className,
  vehicles = [],
  activeInput = DEFAULT_TCO_INPUT,
  activeResult,
}: NavbarProps) {
  const [theme, setTheme] = React.useState<ThemeMode>("system");
  const [isThemeOpen, setIsThemeOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const themeRef = React.useRef<HTMLDivElement>(null);
  const shareRef = React.useRef<HTMLDivElement>(null);

  const resolvedResult = React.useMemo(() => {
    return activeResult ?? calculateTCO(activeInput);
  }, [activeResult, activeInput]);

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

  // Dismiss dropdowns on outside click or escape key
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themeRef.current && !themeRef.current.contains(target)) {
        setIsThemeOpen(false);
      }
      if (shareRef.current && !shareRef.current.contains(target)) {
        setIsShareOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsThemeOpen(false);
        setIsShareOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    setIsThemeOpen(false);
    try {
      localStorage.setItem("tcocalc_theme", mode);
    } catch {}
    applyTheme(mode);
  };

  const handleCopyShareLink = async () => {
    setIsShareOpen(false);
    const url = generateShareableUrl(activeInput);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Shareable link copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast("Shareable link copied to clipboard!");
      }
    } catch {
      showToast("Failed to copy link to clipboard.");
    }
  };

  const handleExportJson = () => {
    setIsShareOpen(false);
    const slug = (activeInput.vehicleName || "vehicle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const filename = `tcocalc-${slug}-${Date.now()}.json`;
    exportToJson(filename, {
      activeVehicle: { input: activeInput, result: resolvedResult },
      savedVehicles: vehicles.length > 0 ? vehicles : undefined,
    });
    showToast("JSON file downloaded!");
  };

  const handleExportCsv = () => {
    setIsShareOpen(false);
    const slug = (activeInput.vehicleName || "vehicle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const filename = `tcocalc-${slug}-schedule.csv`;
    exportScheduleToCsv(filename, resolvedResult, activeInput.vehicleName);
    showToast("CSV schedule downloaded!");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur transition-colors",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Left: Minimal Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 shadow-xs shrink-0">
            <Image
              src="/icon.svg"
              width={20}
              height={20}
              alt="tcocalc logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            tcocalc
          </span>
        </div>

        {/* Right: Actions, Theme & Repo */}
        <div className="flex items-center gap-2">
          {/* Share & Export Dropdown */}
          <div className="relative" ref={shareRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isShareOpen}
              aria-label="Share and export options"
              onClick={() => {
                setIsShareOpen((prev) => !prev);
                setIsThemeOpen(false);
              }}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 opacity-60 transition-transform duration-200",
                  isShareOpen && "rotate-180"
                )}
              />
            </button>

            {isShareOpen && (
              <div
                role="menu"
                aria-label="Share and export menu"
                className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyShareLink}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Copy Shareable Link
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Encodes active configuration in URL
                    </div>
                  </div>
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportJson}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Download JSON
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Full parameters & calculated schedule
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportCsv}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Download CSV
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Annual cash outflow schedule
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isThemeOpen}
              aria-label="Select theme"
              onClick={() => {
                setIsThemeOpen((prev) => !prev);
                setIsShareOpen(false);
              }}
              className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              {theme === "dark" && <Moon className="w-3.5 h-3.5" />}
              {theme === "light" && <Sun className="w-3.5 h-3.5" />}
              {theme === "system" && <Monitor className="w-3.5 h-3.5" />}
              <ChevronDown
                className={cn(
                  "w-3 h-3 opacity-60 transition-transform duration-200",
                  isThemeOpen && "rotate-180"
                )}
              />
            </button>

            {isThemeOpen && (
              <div
                role="menu"
                aria-label="Theme menu"
                className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  aria-label="System theme"
                  onClick={() => handleSelectTheme("system")}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                    theme === "system"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>System</span>
                  </span>
                  {theme === "system" && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  aria-label="Light theme"
                  onClick={() => handleSelectTheme("light")}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                    theme === "light"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </span>
                  {theme === "light" && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  aria-label="Dark theme"
                  onClick={() => handleSelectTheme("dark")}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                    theme === "dark"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </span>
                  {theme === "dark" && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/gideontong/tcocalc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors shadow-xs"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Floating Feedback Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border border-slate-800 dark:border-slate-200 transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </header>
  );
}
