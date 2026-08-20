import { useState, useEffect } from 'react';

function safeJsonParse(str, fallback = []) {
  try { return JSON.parse(str) ?? fallback; } catch { return fallback; }
}

export function useMyList() {
  const [myList, setMyList] = useState(() => safeJsonParse(localStorage.getItem('aios_my_list'), []));

  useEffect(() => {
    const handleSync = () => {
      setMyList(safeJsonParse(localStorage.getItem('aios_my_list'), []));
    };
    window.addEventListener('aios_sync_mylist', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('aios_sync_mylist', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const toggleMyList = (movie) => {
    setMyList(prev => {
      const exists = prev.find(m => m.id === movie.id);
      const newList = exists ? prev.filter(m => m.id !== movie.id) : [...prev, movie];
      try { 
        localStorage.setItem('aios_my_list', JSON.stringify(newList)); 
        window.dispatchEvent(new Event('aios_sync_mylist'));
      } catch {}
      return newList;
    });
  };

  const isInList = (id) => myList.some(m => m.id === id);

  return { myList, toggleMyList, isInList };
}

export function useContinueWatching() {
  const [continueWatching, setContinueWatching] = useState(() => safeJsonParse(localStorage.getItem('aios_continue_watching'), []));

  useEffect(() => {
    const handleSync = () => {
      setContinueWatching(safeJsonParse(localStorage.getItem('aios_continue_watching'), []));
    };
    window.addEventListener('aios_sync_cw', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('aios_sync_cw', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updateProgress = (movie, season = null, episode = null) => {
    setContinueWatching(prev => {
      const filtered = prev.filter(m => m.id !== movie.id);
      const newItem = { ...movie, lastWatched: Date.now(), savedSeason: season, savedEpisode: episode };
      const newList = [newItem, ...filtered].slice(0, 20);
      try { 
        localStorage.setItem('aios_continue_watching', JSON.stringify(newList)); 
        window.dispatchEvent(new Event('aios_sync_cw'));
      } catch {}
      return newList;
    });
  };

  const removeFromContinueWatching = (movieId) => {
    setContinueWatching(prev => {
      const newList = prev.filter(m => m.id !== movieId);
      try { 
        localStorage.setItem('aios_continue_watching', JSON.stringify(newList)); 
        window.dispatchEvent(new Event('aios_sync_cw'));
      } catch {}
      return newList;
    });
  };

  return { continueWatching, updateProgress, removeFromContinueWatching };
}


