"use client";

import { useState } from "react";
import TimelineHeader from "./TimelineHeader";
import TimelineList from "./TimelineList";
import FilterSheet from "./FilterSheet";
import WelcomeToast from "@/components/ui/WelcomeToast";
import type { SessionWithAuthor } from "@/lib/db";

type FilterKey = "instrument" | "genre" | "area";
type FilterState = Record<FilterKey, string[]>;

interface Props {
  sessions: SessionWithAuthor[];
  savedIds: string[];
  answeredIds: string[];
  currentUserId: string | null;
  welcomeType?: string;
}

export default function TimelineClient({ sessions, savedIds, answeredIds, currentUserId, welcomeType }: Props) {
  const [filterState, setFilterState] = useState<FilterState>({ instrument: [], genre: [], area: [] });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filterKey, setFilterKey] = useState<FilterKey | null>(null);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();

  const filteredSessions = sessions.filter((session) => {
    if (filterState.instrument.length > 0 && !filterState.instrument.some((i) => session.tags.includes(i))) return false;
    if (filterState.genre.length > 0 && !filterState.genre.some((g) => session.tags.includes(g))) return false;
    if (filterState.area.length > 0 && !filterState.area.some((a) => session.author.area === a)) return false;
    if (trimmedQuery) {
      const artists = session.author.favorite_artists ?? [];
      const tracks = session.author.favorite_tracks ?? [];
      const matches = [...artists, ...tracks].some((v) => v.toLowerCase().includes(trimmedQuery));
      if (!matches) return false;
    }
    return true;
  });

  function handleOpenFilter(key: FilterKey) {
    setFilterKey(key);
    setFilterSheetOpen(true);
  }

  function handleToggle(opt: string) {
    if (!filterKey) return;
    setFilterState((prev) => {
      const arr = prev[filterKey];
      return {
        ...prev,
        [filterKey]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt],
      };
    });
  }

  function handleClear() {
    if (!filterKey) return;
    setFilterState((prev) => ({ ...prev, [filterKey]: [] }));
  }

  return (
    <>
      {welcomeType && <WelcomeToast type={welcomeType} />}
      <TimelineHeader
        currentUserId={currentUserId}
        filterState={filterState}
        onOpenFilter={handleOpenFilter}
        query={query}
        onQueryChange={setQuery}
      />
      <main style={{ padding: "0 20px" }}>
        <TimelineList
          sessions={filteredSessions}
          savedIds={savedIds}
          answeredIds={answeredIds}
          currentUserId={currentUserId}
        />
      </main>
      <FilterSheet
        open={filterSheetOpen}
        filterKey={filterKey}
        selected={filterKey ? filterState[filterKey] : []}
        onToggle={handleToggle}
        onClear={handleClear}
        onClose={() => setFilterSheetOpen(false)}
      />
    </>
  );
}
