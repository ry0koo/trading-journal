import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";

const CACHE_KEY = "trades_v2";

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

function readCache(): Trade[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Trade[]) : [];
  } catch {
    return [];
  }
}

function writeCache(trades: Trade[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(trades));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

/**
 * Unified hook — single source of truth for all trade data.
 * Initialises instantly from localStorage cache, then fetches fresh data
 * from Supabase and subscribes to realtime changes.
 */
export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(readCache);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    const { data, error: supaErr } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    if (supaErr) {
      setError("Failed to load trades.");
      setLoading(false);
      return;
    }

    const formatted = (data ?? []).map(parseRow);
    setTrades(formatted);
    writeCache(formatted);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    // initial load — called in async IIFE to avoid sync setState in effect
    (async () => { await fetchTrades(); })();

    const channel = supabase
      .channel("trades-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades" },
        () => { void fetchTrades(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrades]);

  return { trades, loading, error, refetch: fetchTrades };
}
