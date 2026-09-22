// src/features/comments/lib/ownCommentsStorage.ts
const STORAGE_KEY = "own_comment_ids";

export function rememberOwnComment(id: number): void {
  const ids = getOwnCommentIds();
  if (!ids.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
  }
}

export function getOwnCommentIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isOwnComment(id: number): boolean {
  return getOwnCommentIds().includes(id);
}