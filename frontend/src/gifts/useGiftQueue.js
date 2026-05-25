import { useState, useRef, useCallback } from "react";

/*
  useGiftQueue
  FIFO queue for gift spectacle events. Plays one gift at a time; queues
  subsequent gifts (up to maxSize) so rapid sending never drops events.

  Returns:
    current  - active gift item {giftId, sender, recipient} or null
    enqueue  - add a gift item; plays immediately if idle, queues if busy
    advance  - call in onDone to dismiss current and play next queued gift
*/
export default function useGiftQueue(maxSize = 4) {
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);

  const enqueue = useCallback(
    (item) => {
      setCurrent((prev) => {
        if (!prev) return item;
        if (queueRef.current.length < maxSize) {
          queueRef.current.push(item);
        }
        return prev;
      });
    },
    [maxSize]
  );

  const advance = useCallback(() => {
    const next = queueRef.current.shift() || null;
    setCurrent(next);
  }, []);

  return { current, enqueue, advance };
}
