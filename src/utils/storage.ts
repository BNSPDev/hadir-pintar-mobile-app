/**
 * Safe localStorage utilities with error handling and fallbacks
 */

interface StorageOptions {
  defaultValue?: any;
  serialize?: boolean;
}

/**
 * Safely get item from localStorage
 */
export function getStorageItem<T = string>(
  key: string,
  options: StorageOptions = {},
): T | null {
  const { defaultValue = null, serialize = false } = options;

  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return defaultValue;
    }

    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    if (serialize) {
      return JSON.parse(item);
    }

    return item as T;
  } catch (error) {
    console.warn(`Error reading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 */
export function setStorageItem(
  key: string,
  value: any,
  serialize: boolean = false,
): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    const serializedValue = serialize ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage (key: ${key}):`, error);

    // Handle quota exceeded error
    if (error instanceof DOMException && error.code === 22) {
      console.warn(
        "localStorage quota exceeded. Attempting to clear old data...",
      );
      clearOldStorageData();

      // Try again after clearing
      try {
        const serializedValue = serialize
          ? JSON.stringify(value)
          : String(value);
        localStorage.setItem(key, serializedValue);
        return true;
      } catch (retryError) {
        console.error(
          "Failed to write to localStorage even after clearing:",
          retryError,
        );
      }
    }

    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get localStorage usage info
 */
export function getStorageInfo(): {
  used: number;
  available: number;
  quota: number;
} {
  let used = 0;
  let quota = 0;
  let available = 0;

  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { used, available, quota };
    }

    // Calculate used space
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // Estimate quota (usually 5MB for localStorage)
    if ("storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        quota = estimate.quota || 5 * 1024 * 1024; // 5MB fallback
        available = quota - used;
      });
    } else {
      quota = 5 * 1024 * 1024; // 5MB fallback
      available = quota - used;
    }
  } catch (error) {
    console.warn("Error getting storage info:", error);
  }

  return { used, available, quota };
}

/**
 * Clear old/unnecessary data from localStorage
 */
export function clearOldStorageData(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    const keysToRemove: string[] = [];

    // Remove expired items (if they have expiry metadata)
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // Remove old temp data
        if (key.startsWith("temp_") || key.startsWith("cache_")) {
          keysToRemove.push(key);
        }

        // Remove items with expiry date
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.expiry && parsed.expiry < Date.now()) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Not JSON, skip
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`Cleared ${keysToRemove.length} old items from localStorage`);
  } catch (error) {
    console.warn("Error clearing old storage data:", error);
  }
}

/**
 * Create an item with expiry date
 */
export function setStorageItemWithExpiry(
  key: string,
  value: any,
  expiryMs: number,
): boolean {
  const item = {
    value,
    expiry: Date.now() + expiryMs,
  };

  return setStorageItem(key, item, true);
}

/**
 * Get item and check if it's expired
 */
export function getStorageItemWithExpiry<T = any>(key: string): T | null {
  try {
    const item = getStorageItem(key, { serialize: true });

    if (!item || typeof item !== "object") {
      return null;
    }

    // Type assertion after null check
    const typedItem = item as { expiry?: number; value: T };

    if (typedItem.expiry && typedItem.expiry < Date.now()) {
      removeStorageItem(key);
      return null;
    }

    return typedItem.value;
  } catch (error) {
    console.warn(`Error getting item with expiry (key: ${key}):`, error);
    return null;
  }
}
