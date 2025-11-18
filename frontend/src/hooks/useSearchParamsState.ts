import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useMemo } from "react";

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

interface UseSearchParamsStateOptions<T> {
  serialize?: Serializer<T>;
  deserialize?: Deserializer<T>;
  replace?: boolean;
}

// Smart type detection and auto-serialization
export function getTypeSerializer<T>(defaultValue: T): {
  serialize: Serializer<T>;
  deserialize: Deserializer<T>;
} {
  if (typeof defaultValue === "string") {
    return {
      serialize: (value: T) => String(value),
      deserialize: (value: string) => value as T,
    };
  }

  if (typeof defaultValue === "number") {
    return {
      serialize: (value: T) => String(value),
      deserialize: (value: string) => {
        const num = Number(value);
        return (isNaN(num) ? defaultValue : num) as T;
      },
    };
  }

  if (typeof defaultValue === "boolean") {
    return {
      serialize: (value: T) => String(value),
      deserialize: (value: string) => (value === "true") as T,
    };
  }

  if (Array.isArray(defaultValue)) {
    return {
      serialize: (value: T) => JSON.stringify(value),
      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);
          const out = Array.isArray(parsed) ? parsed : defaultValue;
          return out as T;
        } catch {
          return defaultValue;
        }
      },
    };
  }

  if (typeof defaultValue === "object" && defaultValue !== null) {
    return {
      serialize: (value: T) => JSON.stringify(value),
      deserialize: (value: string) => {
        try {
          return JSON.parse(value) as T;
        } catch {
          return defaultValue;
        }
      },
    };
  }

  // Fallback for unknown types
  return {
    serialize: (value: T) => String(value),
    deserialize: (value: string) => value as T,
  };
}

// Universal hook that handles all types automatically
export function useSearchParamsState<T>(
  key: string,
  defaultValue: T,
  options: UseSearchParamsStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const autoSerializers = getTypeSerializer(defaultValue);

  const {
    serialize = autoSerializers.serialize,
    deserialize = autoSerializers.deserialize,
    replace = true,
  } = options;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize the current value
  const value = useMemo(() => {
    const rawValue = searchParams.get(key);
    if (rawValue === null) return defaultValue;

    try {
      return deserialize(rawValue);
    } catch {
      return defaultValue;
    }
  }, [searchParams, key, defaultValue, deserialize]);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue;

      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Remove param if value equals default or is null/undefined
      if (
        resolvedValue === defaultValue ||
        resolvedValue === null ||
        resolvedValue === undefined
      ) {
        current.delete(key);
      } else {
        try {
          current.set(key, serialize(resolvedValue));
        } catch {
          current.set(key, resolvedValue?.toString?.());
          // return;
        }
      }

      const search = current.toString();
      const query = search ? `?${search}` : "";
      const url = `${location.pathname}${query}`;

      if (replace) {
        navigate(url, { replace: true });
      } else {
        navigate(url);
      }
    },
    [
      key,
      value,
      searchParams,
      location.pathname,
      navigate,
      defaultValue,
      serialize,
      replace,
    ]
  );

  return [value, setValue];
}

// Hook for managing multiple search params as an object
export function useSearchParamsRecord<T extends Record<string, unknown>>(
  defaults: T
): [
  T,
  (updates: Partial<T>) => void,
  (key: keyof T, value: T[keyof T]) => void
] {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current values with automatic type handling
  const values = useMemo(() => {
    const result = {} as T;
    for (const key in defaults) {
      const defaultValue = defaults[key];
      const rawValue = searchParams.get(key);

      if (rawValue === null) {
        result[key] = defaultValue;
      } else {
        // Auto-deserialize based on default value type
        const { deserialize } = getTypeSerializer(defaultValue);
        try {
          result[key] = deserialize(rawValue);
        } catch {
          result[key] = defaultValue;
        }
      }
    }
    return result;
  }, [searchParams, defaults]);

  // Update multiple values at once
  const setValues = useCallback(
    (updates: Partial<T>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(updates).forEach(([key, value]) => {
        const defaultValue = defaults[key as keyof T];

        if (value === undefined || value === null || value === defaultValue) {
          current.delete(key);
        } else {
          const { serialize } = getTypeSerializer(defaultValue);
          try {
            current.set(key, serialize(value));
          } catch {
            current.set(key, value?.toString?.());
          }
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : "";

      navigate(`${location.pathname}${query}`, { replace: true });
    },
    [searchParams, location.pathname, navigate, defaults]
  );

  // Update single value
  const setValue = useCallback(
    (key: keyof T, value: T[keyof T]) => {
      setValues({ [key]: value } as Partial<T>);
    },
    [setValues]
  );

  return [values, setValues, setValue];
}
