import { useState, useEffect } from 'react';

export function useMyList() {
  const [myList, setMyList] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('aios_my_list');
    if (saved) setMyList(JSON.parse(saved));
  }, []);

  const toggleMyList = (movie) => {
    setMyList(prev => {
      const exists = prev.find(m => m.id === movie.id);
      const newList = exists ? prev.filter(m => m.id !== movie.id) : [...prev, movie];
      localStorage.setItem('aios_my_list', JSON.stringify(newList));
      return newList;
    });
  };

  const isInList = (id) => myList.some(m => m.id === id);

  return { myList, toggleMyList, isInList };
}

export function useContinueWatching() {
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('aios_continue_watching');
    if (saved) setContinueWatching(JSON.parse(saved));
  }, []);

  const updateProgress = (movie, season = null, episode = null) => {
    setContinueWatching(prev => {
      const filtered = prev.filter(m => m.id !== movie.id);
      const newItem = { ...movie, lastWatched: Date.now(), savedSeason: season, savedEpisode: episode };
      const newList = [newItem, ...filtered].slice(0, 20); // Keep last 20
      localStorage.setItem('aios_continue_watching', JSON.stringify(newList));
      return newList;
    });
  };

  return { continueWatching, updateProgress };
}
