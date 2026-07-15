"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type PageHeader = {
  title: string;
  breadcrumbs?: string[];
};

type PageHeaderContextValue = {
  header: PageHeader;
  setHeader: (header: PageHeader) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeader>({ title: "Overview" });
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

function usePageHeaderContext(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeaderContext must be used within PageHeaderProvider");
  return ctx;
}

export function usePageHeader(): PageHeader {
  return usePageHeaderContext().header;
}

/**
 * Call from a page to set the top bar title/breadcrumbs while it is mounted.
 * If breadcrumbs is provided, the caller must memoize it (e.g. useMemo) —
 * a fresh array literal on every render would re-trigger this effect forever.
 */
export function useSetPageHeader(title: string, breadcrumbs?: string[]) {
  const { setHeader } = usePageHeaderContext();
  useEffect(() => {
    setHeader({ title, breadcrumbs });
  }, [title, breadcrumbs, setHeader]);
}
