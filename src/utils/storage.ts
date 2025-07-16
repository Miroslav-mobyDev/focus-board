

import type { BoardData } from '../data/types';

const STORAGE_KEY = 'focusboard-data';

export function saveBoard(data: BoardData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadBoard(): BoardData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { tasks: [] };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { tasks: [] };
  }
}
