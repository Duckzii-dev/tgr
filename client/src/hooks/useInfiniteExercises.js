import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const PAGE_SIZE = 50;

export function useInfiniteExercises({ q, muscleSlug }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    const offset = offsetRef.current;
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (muscleSlug) p.set('muscleSlug', muscleSlug);
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));

    try {
      const res = await api.get(`/anatome/exercises?${p}`);
      const list = res.exercises || [];
      const tot = res.total || 0;

      setItems((prev) => (offset === 0 ? list : [...prev, ...list]));
      setTotal(tot);
      offsetRef.current = offset + list.length;
      setHasMore(offset + list.length < tot);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, muscleSlug, loading, hasMore]);

  // Reset khi filter đổi
  useEffect(() => {
    reset();
  }, [q, muscleSlug, reset]);

  // Load lần đầu
  useEffect(() => {
    if (offsetRef.current === 0 && items.length === 0) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, muscleSlug]);

  return { items, total, loading, error, hasMore, loadMore };
}
