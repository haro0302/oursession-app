"use client";

import { useState } from "react";
import TimelineHeader from "./TimelineHeader";
import TimelineList from "./TimelineList";
import FilterSheet from "./FilterSheet";
import SearchOverlay from "./SearchOverlay";
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
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredSessions = sessions.filter((session) => {
    if (filterState.instrument.length > 0 && !filterState.instrument.includes(session.requested_part)) return false;
    if (filterState.genre.length > 0 && !filterState.genre.includes(session.genre)) return false;
    if (filterState.area.length > 0 && !filterState.area.includes(session.area)) return false;
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
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main style={{ padding: "0 16px" }}>
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
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        sessions={sessions}
        savedIds={savedIds}
        answeredIds={answeredIds}
        currentUserId={currentUserId}
      />
    </>
  );
}
