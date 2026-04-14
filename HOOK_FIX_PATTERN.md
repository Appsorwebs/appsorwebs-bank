# Hook Fix Pattern - Async/Await for Supabase Migration

## Problem
After migrating all 8 services to async Supabase API calls, hooks were calling these services WITHOUT `await`, causing them to receive Promise objects instead of actual data.

## Solution Pattern

### Old (BROKEN):
```typescript
const loadItems = useCallback(async () => {
  const items = SomeService.getItems(userId); // ❌ Returns Promise, not data
  const stats = SomeService.getStats(userId); // ❌ Returns Promise, not data

  setItemsState(prev => ({
    ...prev,
    items,    // Sets state to Promise = broken
    stats,    // Sets state to Promise = broken
    loading: false
  }));
}, [user]);
```

### New (CORRECT):
```typescript
const loadItems = useCallback(async () => {
  const itemsResult = await SomeService.getItems(userId); // ✓ Returns APIResponse<T>
  const statsResult = await SomeService.getStats(userId); // ✓ Returns APIResponse<T>

  if (!itemsResult.success || !statsResult.success) {
    throw new Error(itemsResult.error || statsResult.error);
  }

  setItemsState(prev => ({
    ...prev,
    items: itemsResult.data || [],    // ✓ Sets actual data
    stats: statsResult.data || prev.stats,  // ✓ Sets actual data
    loading: false
  }));
}, [user]);
```

## Apply to Every Method:

1. **Add `async`** to useCallback signature
2. **Add `await`** to every Service method call
3. **Destructure APIResponse**: `const result = await Service.method(...)`
4. **Check `.success`**: `if (!result.success) throw new Error(result.error)`
5. **Extract `.data`**: Use `result.data || defaultValue`

## Method Patterns

### Load Methods (Initial Data)
```typescript
// useContacts: loadContacts ✅
// useCards: loadCards ✅
// useSavings: loadAccounts (TODO)
// useQRCode: loadQRPayments (TODO)
// useAnalytics: loadAnalytics (TODO)
// useDocuments: loadDocuments (TODO)

const load = useCallback(async () => {
  if (!user) return;
  try {
    setItemsState(prev => ({ ...prev, loading: true }));
    const itemsResult = await ItemService.get(user.id);
    const statsResult = await ItemService.getStats(user.id);

    if (!itemsResult.success || !statsResult.success) {
      throw new Error(itemsResult.error || statsResult.error);
    }

    setItemsState(prev => ({
      ...prev,
      items: itemsResult.data || [],
      stats: statsResult.data || prev.stats,
      loading: false
    }));
  } catch (error) { ... }
}, [user]);
```

### Selection Methods
```typescript
// useContacts: selectContact ✅
// useCards: selectCard ✅
// useSavings: selectAccount (TODO)
// useQRCode: (similar pattern) (TODO)

const selectItem = useCallback(async (itemId: string) => {
  try {
    const result = await ItemService.getById(itemId);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Item not found');
    }

    const item = result.data;
    setItemsState(prev => ({
      ...prev,
      selectedItem: item
    }));

    return item;
  } catch (error) { ... }
}, []);
```

### CRUD Methods (Create/Update/Delete)
```typescript
// useContacts: createContact, updateContact, deleteContact ✅
// useCards: setDailyLimit, updateControls, etc. ✅
// useSavings, useQRCode, useAnalytics: (TODO - same pattern)

const createItem = useCallback(async (data: DataType) => {
  try {
    const result = await ItemService.create(user.id, data);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create');
    }

    const newItem = result.data;
    const statsResult = user ? await ItemService.getStats(user.id) : null;

    setItemsState(prev => ({
      ...prev,
      items: [newItem, ...prev.items],
      stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
    }));

    toast.success('Created successfully');
    return newItem;
  } catch (error) { ... }
}, [user]);
```

### Update Methods
```typescript
const updateItem = useCallback(async (itemId: string, updates: Partial<Item>) => {
  try {
    const result = await ItemService.update(itemId, updates);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Item not found');
    }

    const updated = result.data;
    setItemsState(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? updated : item),
      selectedItem: prev.selectedItem?.id === itemId ? updated : prev.selectedItem
    }));

    toast.success('Updated successfully');
    return updated;
  } catch (error) { ... }
}, []);
```

### Delete Methods
```typescript
const deleteItem = useCallback(async (itemId: string) => {
  try {
    const result = await ItemService.delete(itemId);
    if (!result.success) {
      throw new Error(result.error || 'Item not found');
    }

    const statsResult = user ? await ItemService.getStats(user.id) : null;

    setItemsState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      selectedItem: prev.selectedItem?.id === itemId ? undefined : prev.selectedItem,
      stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
    }));

    toast.success('Deleted successfully');
    return true;
  } catch (error) { ... }
}, [user]);
```

### Return-Value Methods
```typescript
const getLimit = useCallback(async (cardId: string) => {
  const result = await CardService.getRemainingLimit(cardId);
  return result.success ? result.data : null;
}, []);
```

## Files To Fix

### ✅ ALREADY FIXED:
- useContacts.ts - All 13 methods fixed
- useCards.ts - All 18 methods fixed

### 🚀 REMAINING (SAME PATTERN):
- useSavings.ts - Apply pattern to all 17 methods
- useQRCode.ts - Apply pattern to all 18 methods
- useAnalytics.ts - Apply pattern to all 10 methods
- useDocuments.ts - Apply pattern to all 15 methods

### ✓ NO CHANGES NEEDED:
- useAuth.ts (no async service calls)
- useSearch.ts (no async service calls)
- useEscrow.ts (no async service calls)
- useTransfer.ts (no async service calls)
- usePayment.ts (no async service calls)

## Checklist

- [x] useContacts: All methods converted to async/await
- [x] useCards: All methods converted to async/await
- [ ] useSavings: TODO - Convert all methods
- [ ] useQRCode: TODO - Convert all methods
- [ ] useAnalytics: TODO - Convert all methods
- [ ] useDocuments: TODO - Convert all methods
- [ ] Test all 10 banking features end-to-end
- [ ] Deploy to production
