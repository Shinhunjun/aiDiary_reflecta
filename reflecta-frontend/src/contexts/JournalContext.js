import React, { createContext, useContext, useState } from "react";

const JournalContext = createContext();

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournal must be used within a JournalProvider");
  }
  return context;
};

export const JournalProvider = ({ children }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const addJournalEntry = (entry) => {
    setJournalEntries((prev) => [entry, ...prev]);
  };

  const updateJournalEntries = (entries) => {
    setJournalEntries(entries);
  };

  return (
    <JournalContext.Provider
      value={{
        journalEntries,
        refreshTrigger,
        triggerRefresh,
        addJournalEntry,
        updateJournalEntries,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};
