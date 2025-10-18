import { useMemo, useEffect, useState } from "react";

import debounce from "lodash.debounce";

/**
 * useDebouncedValue — Debounces a value change with a given delay.
 * @param value The value to debounce
 * @param delay The debounce delay in ms (default: 500)
 */
export function useDebouncedValue<T>(value: T, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const debouncedSetter = useMemo(
    () =>
      debounce((newValue: T) => {
        setDebouncedValue(newValue);
      }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetter(value);
    return () => debouncedSetter.cancel();
  }, [value, debouncedSetter]);

  return debouncedValue;
}
