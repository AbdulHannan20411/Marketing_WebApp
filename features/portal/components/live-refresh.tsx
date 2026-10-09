"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** `filter` is a Realtime row filter such as `id=eq.<uuid>`; omit it for every row. */
type Subscription = { table: "queries" | "query_messages"; filter?: string };

/**
 * Refreshes the page's server data when matching rows change (Supabase Realtime,
 * which applies the same RLS as normal reads). Renders nothing.
 */
export function LiveRefresh({
  channel,
  subscriptions,
}: {
  channel: string;
  subscriptions: Subscription[];
}) {
  const router = useRouter();
  const key = JSON.stringify(subscriptions);

  useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return; // Supabase not configured.
    }
    let timer: number | undefined;
    const refresh = () => {
      // Coalesce bursts (a reply also updates its query row).
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 250);
    };

    let cancelled = false;
    let realtime: ReturnType<typeof supabase.channel> | null = null;

    // Subscribe with the user's token, or RLS would (rightly) hide every change.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      realtime = supabase.channel(channel);
      for (const { table, filter } of JSON.parse(key) as Subscription[]) {
        realtime.on(
          "postgres_changes",
          { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
          refresh,
        );
      }
      realtime.subscribe();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (realtime) void supabase.removeChannel(realtime);
    };
  }, [channel, key, router]);

  return null;
}
