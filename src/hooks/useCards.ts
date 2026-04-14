/**
 * useCards Hook
 * Custom hook for managing debit cards and card operations
 */

import { useState, useCallback, useEffect } from 'react';
import { CardService, Card } from '../services/cardService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface CardsState {
  cards: Card[];
  selectedCard?: Card;
  loading: boolean;
  error?: string;
  stats: {
    totalCards: number;
    activeCards: number;
    inactiveCards: number;
    blockedCards: number;
    totalMonthlySpent: number;
    totalMonthlyLimit: number;
  };
}

export const useCards = () => {
  const { user } = useAuth();
  const [cardsState, setCardsState] = useState<CardsState>({
    cards: [],
    loading: false,
    stats: {
      totalCards: 0,
      activeCards: 0,
      inactiveCards: 0,
      blockedCards: 0,
      totalMonthlySpent: 0,
      totalMonthlyLimit: 0
    }
  });

  /**
   * Load all cards
   */
  const loadCards = useCallback(async () => {
    if (!user) return;

    try {
      setCardsState((prev) => ({ ...prev, loading: true }));
      const cardsResult = await CardService.getCards(user.id);
      const statsResult = await CardService.getCardStats(user.id);

      if (!cardsResult.success || !statsResult.success) {
        throw new Error(cardsResult.error || statsResult.error || 'Failed to load cards');
      }

      setCardsState((prev) => ({
        ...prev,
        cards: cardsResult.data || [],
        stats: statsResult.data || prev.stats,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load cards';
      setCardsState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Select card
   */
  const selectCard = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.getCardById(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const card = result.data;
      setCardsState((prev) => ({
        ...prev,
        selectedCard: card
      }));

      return card;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select card';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Enable card
   */
  const enableCard = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.enableCard(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      const statsResult = user ? await CardService.getCardStats(user.id) : null;

      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard,
        stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
      }));

      toast.success('Card enabled successfully');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable card';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Disable card
   */
  const disableCard = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.disableCard(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      const statsResult = user ? await CardService.getCardStats(user.id) : null;

      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard,
        stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
      }));

      toast.success('Card disabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable card';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Lock card
   */
  const lockCard = useCallback(async (cardId: string, reason?: string) => {
    try {
      const result = await CardService.lockCard(cardId, reason);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      const statsResult = user ? await CardService.getCardStats(user.id) : null;

      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard,
        stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
      }));

      toast.success('Card locked');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to lock card';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Unlock card
   */
  const unlockCard = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.unlockCard(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      const statsResult = user ? await CardService.getCardStats(user.id) : null;

      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard,
        stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
      }));

      toast.success('Card unlocked');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlock card';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Set daily limit
   */
  const setDailyLimit = useCallback(async (cardId: string, limit: number) => {
    try {
      if (limit < 0) {
        throw new Error('Limit must be positive');
      }

      const result = await CardService.setDailyLimit(cardId, limit);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success(`Daily limit set to ₦${limit.toLocaleString()}`);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set limit';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Set monthly limit
   */
  const setMonthlyLimit = useCallback(async (cardId: string, limit: number) => {
    try {
      if (limit < 0) {
        throw new Error('Limit must be positive');
      }

      const result = await CardService.setMonthlyLimit(cardId, limit);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success(`Monthly limit set to ₦${limit.toLocaleString()}`);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set limit';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Update controls
   */
  const updateControls = useCallback(
    async (cardId: string, controls: Partial<Card['controls']>) => {
      try {
        const result = await CardService.updateControls(cardId, controls);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Card not found');
        }

        const updated = result.data;
        setCardsState((prev) => ({
          ...prev,
          cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
          selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
        }));

        toast.success('Card controls updated');
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update controls';
        toast.error(message);
        return null;
      }
    },
    []
  );

  /**
   * Enable online transactions
   */
  const enableOnline = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.enableOnlineTransactions(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('Online transactions enabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Disable online transactions
   */
  const disableOnline = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.disableOnlineTransactions(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('Online transactions disabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Enable international
   */
  const enableInternational = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.enableInternational(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('International transactions enabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Disable international
   */
  const disableInternational = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.disableInternational(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('International transactions disabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Enable contactless
   */
  const enableContactless = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.enableContactless(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('Contactless payments enabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Disable contactless
   */
  const disableContactless = useCallback(async (cardId: string) => {
    try {
      const result = await CardService.disableContactless(cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard
      }));

      toast.success('Contactless payments disabled');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Set as default
   */
  const setAsDefault = useCallback(async (cardId: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return null;
    }

    try {
      const result = await CardService.setAsDefault(user.id, cardId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Card not found');
      }

      const updated = result.data;
      const statsResult = await CardService.getCardStats(user.id);

      setCardsState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        selectedCard: prev.selectedCard?.id === cardId ? updated : prev.selectedCard,
        stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
      }));

      toast.success('Default card updated');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Get remaining daily limit
   */
  const getRemainingDailyLimit = useCallback(async (cardId: string) => {
    const result = await CardService.getRemainingDailyLimit(cardId);
    return result.success ? result.data : null;
  }, []);

  /**
   * Get remaining monthly limit
   */
  const getRemainingMonthlyLimit = useCallback(async (cardId: string) => {
    const result = await CardService.getRemainingMonthlyLimit(cardId);
    return result.success ? result.data : null;
  }, []);

  /**
   * Initialize - load cards on mount
   */
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    // State
    cards: cardsState.cards,
    selectedCard: cardsState.selectedCard,
    loading: cardsState.loading,
    error: cardsState.error,
    stats: cardsState.stats,

    // Methods
    loadCards,
    selectCard,
    enableCard,
    disableCard,
    lockCard,
    unlockCard,
    setDailyLimit,
    setMonthlyLimit,
    updateControls,
    enableOnline,
    disableOnline,
    enableInternational,
    disableInternational,
    enableContactless,
    disableContactless,
    setAsDefault,
    getRemainingDailyLimit,
    getRemainingMonthlyLimit
  };
};
