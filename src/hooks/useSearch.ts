import { useState, useCallback, useMemo } from 'react';

export interface Searchable {
  id: string;
  [key: string]: any;
}

interface UseSearchOptions {
  minChars?: number;
  debounceDelay?: number;
  caseSensitive?: boolean;
}

export const useSearch = <T extends Searchable>(
  items: T[],
  searchFields: (keyof T)[],
  options: UseSearchOptions = {}
) => {
  const [query, setQuery] = useState('');
  const {
    minChars = 1,
    caseSensitive = false,
  } = options;

  const results = useMemo(() => {
    if (query.length < minChars) {
      return items;
    }

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string' || typeof value === 'number') {
          const normalizedValue = caseSensitive
            ? String(value)
            : String(value).toLowerCase();
          return normalizedValue.includes(normalizedQuery);
        }
        return false;
      })
    );
  }, [items, query, searchFields, minChars, caseSensitive]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    results,
    handleSearch,
    clearSearch,
    hasQuery: query.length >= minChars,
    resultCount: results.length,
  };
};
