import { useState, useCallback } from "react";

/*
  useGiftQueue
  FIFO queue for gift spectacle events. Plays one gift at a time; queues
  subsequent gifts (up to maxSize) so rapid sending never drops events.

  Returns:
    current     - active gift item {giftId, sender, recipient} or null
    enqueue     - add a gift item; plays immediately if idle, queues if busy
    advance     - call in onDone to dismiss current and play next queued gift
    queueLength - number of gifts waiting behind the current one
*/
export default function useGiftQueue(maxSize = 4) {
  const [state, setState] = useState({ current: null, queue: [] });

  const enqueue = useCallback(
    (item) => {
      setState((prev) => {
        if (!prev.current) return { current: item, queue: prev.queue };
        if (prev.queue.length < maxSize) {
          return { current: prev.current, queue: [...prev.queue, item] };
        }
        return prev;
      });
    },
    [maxSize]
  );

  const advance = useCallback(() => {
    setState((prev) => {
      const [next = null, ...rest] = prev.queue;
      return { current: next, queue: rest };
    });
  }, []);

  return { current: state.current, enqueue, advance, queueLength: state.queue.length };
}
