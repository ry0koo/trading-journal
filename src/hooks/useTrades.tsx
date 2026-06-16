import { useEffect, useState, useCallback, useRef, createContext, useContext, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";

const CACHE_KEY = "trades_v2";

// Global cache to persist across component remounts during session
let globalCache: Trade[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function parseRow(row: Record<string, unknown>): Trade {
  return {
    id: String(row.id),
    instrument: String(row.instrument ?? ""),
    direction: (row.direction as "LONG" | "SHORT") ?? "LONG",
    result: Number(row.result ?? 0),
    comment: String(row.comment ?? ""),
    beforeImage: String(row.before_image ?? ""),
    afterImage: String(row.after_image ?? ""),
    tradeDate: String(row.trade_date ?? ""),
    session: String(row.session ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

function readPersistentCache(): Trade[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Trade[]) : [];
  } catch {
    return [];
  }
}

function writePersistentCache(trades: Trade[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(trades));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

interface TradesContextType {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

/**
 * TradesProvider manages the global state for all trade data.
 * It preloads data immediately on mount and handles realtime updates.
 */
export function TradesProvider({ children }: { children: ReactNode }) {
  const initialTrades = globalCache || readPersistentCache();
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [loading, setLoading] = useState(!initialTrades.length);
  const [error, setError] = useState<string | null>(null);
  
  const isFetchingRef = useRef(false);

  const fetchTrades = useCallback(async (force = false) => {
    // Deduplicate requests
    if (isFetchingRef.current) return;
    
    // Check cache freshness
    const now = Date.now();
    if (!force && globalCache && (now - lastFetchTime < CACHE_TTL)) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    
    // Only show loading if we have no data at all
    if (!globalCache && readPersistentCache().length === 0) {
      setLoading(true);
    }

    const { data, error: supaErr } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    isFetchingRef.current = false;

    if (supaErr) {
      setError("Failed to load trades.");
      setLoading(false);
      return;
    }

    const formatted = (data ?? []).map(parseRow);
    
    // Update caches
    globalCache = formatted;
    lastFetchTime = now;
    writePersistentCache(formatted);
    
    setTrades(formatted);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    // Initial preload — happens immediately when app starts
    void fetchTrades();

    const channel = supabase
      .channel("trades-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades" },
        () => { 
          // Realtime updates always force a re-fetch to stay in sync
          void fetchTrades(true); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrades]);

  const contextValue = {
    trades,
    loading,
    error,
    refetch: () => fetchTrades(true)
  };

  return (
    <TradesContext.Provider value={contextValue}>
      {children}
    </TradesContext.Provider>
  );
}

/**
 * Unified hook — consumes the global TradesProvider.
 * Provides instant access to preloaded and cached trade data.
 */
export function useTrades() {
  const context = useContext(TradesContext);
  if (context === undefined) {
    throw new Error("useTrades must be used within a TradesProvider");
  }
  return context;
}

