"use client";

import React, { createContext, useContext, useState } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

interface TabsContextValue {
  value: string;
  onChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs sub-components must be used inside <Tabs>");
  return ctx;
}

// ─── Tabs (root) ──────────────────────────────────────────────────────────────

interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className = "" }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Use as uncontrolled if you don't pass value/onValueChange
interface TabsUncontrolledProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsUncontrolled({ defaultValue, children, className = "" }: TabsUncontrolledProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── TabsList ─────────────────────────────────────────────────────────────────

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-xl bg-secondary/60 p-1 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── TabsTrigger ──────────────────────────────────────────────────────────────

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className = "", disabled }: TabsTriggerProps) {
  const ctx = useTabsContext();
  const isActive = ctx.value === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => ctx.onChange(value)}
      className={`
        relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isActive
          ? "bg-white text-indigo-700 shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-white/50"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── TabsContent ──────────────────────────────────────────────────────────────

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const ctx = useTabsContext();
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
