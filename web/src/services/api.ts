import type { Plant, UserHistoryItem, UserFavoriteItem, FieldObservation, SubscriptionRecord } from '../types';
import fallbackPlants from '../data/plants.json';

const API_BASE = '/api';

export const api = {
  // Check backend & MySQL health
  async checkHealth(): Promise<{ status: string; database: string; totalPlants: number }> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', database: 'Embedded JSON Fallback', totalPlants: fallbackPlants.length };
    }
  },

  // Fetch plants from MySQL
  async getPlants(params?: { search?: string; family?: string; activity?: string; region?: string; limit?: number }): Promise<Plant[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.family) query.append('family', params.family);
      if (params?.activity) query.append('activity', params.activity);
      if (params?.region) query.append('region', params.region);
      if (params?.limit) query.append('limit', params.limit.toString());

      const url = `${API_BASE}/plants${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Failed to fetch from MySQL');
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : (fallbackPlants as Plant[]);
    } catch {
      // Graceful offline fallback
      return fallbackPlants as Plant[];
    }
  },

  // Create plant in MySQL
  async createPlant(plant: Partial<Plant>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plant)
    });
    if (!res.ok) throw new Error('Failed to create plant in MySQL');
    return await res.json();
  },

  // Update plant in MySQL
  async updatePlant(id: number, plant: Partial<Plant>): Promise<void> {
    const res = await fetch(`${API_BASE}/plants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plant)
    });
    if (!res.ok) throw new Error('Failed to update plant in MySQL');
  },

  // Delete plant in MySQL
  async deletePlant(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/plants/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete plant in MySQL');
  },

  // Record user history into MySQL
  async recordHistory(item: {
    userId: string;
    type: 'search' | 'view' | 'scan' | 'assistant';
    title: string;
    queryText?: string;
    plantId?: number | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        signal: AbortSignal.timeout(3000)
      });
    } catch (e) {
      console.warn('Could not persist history to MySQL:', e);
    }
  },

  // Get user history from MySQL
  async getHistory(userId: string, type?: string, limit = 50): Promise<UserHistoryItem[]> {
    try {
      const q = new URLSearchParams({ userId, limit: limit.toString() });
      if (type) q.append('type', type);
      const res = await fetch(`${API_BASE}/history?${q.toString()}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Failed to fetch history');
      return await res.json();
    } catch {
      return [];
    }
  },

  // Clear user history in MySQL
  async clearHistory(userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  },

  // Favorites & Herbarium in MySQL
  async getFavorites(userId: string): Promise<UserFavoriteItem[]> {
    try {
      const res = await fetch(`${API_BASE}/favorites?userId=${encodeURIComponent(userId)}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return await res.json();
    } catch {
      return [];
    }
  },

  async toggleFavorite(userId: string, plantId: number, personalNotes = ''): Promise<{ isFavorite: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plantId, personalNotes })
      });
      return await res.json();
    } catch {
      return { isFavorite: false };
    }
  },

  // Field Observations in MySQL
  async getObservations(status?: string): Promise<FieldObservation[]> {
    try {
      const url = status ? `${API_BASE}/observations?status=${status}` : `${API_BASE}/observations`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Failed to fetch observations');
      return await res.json();
    } catch {
      return [];
    }
  },

  async submitObservation(obs: {
    userId: string;
    userName: string;
    plantName: string;
    wilaya: string;
    locality?: string;
    notes?: string;
    photoUrl?: string;
  }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obs)
    });
    if (!res.ok) throw new Error('Failed to submit observation to MySQL');
    return await res.json();
  },

  async updateObservationStatus(id: number, status: 'approved' | 'rejected'): Promise<void> {
    await fetch(`${API_BASE}/observations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Subscriptions in MySQL
  async getSubscriptions(): Promise<SubscriptionRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return await res.json();
    } catch {
      return [];
    }
  },

  async createSubscription(data: {
    userId: string;
    userName: string;
    userEmail: string;
    organization?: string;
    plan: string;
    amountDZD: number;
    paymentMethod: string;
  }): Promise<{ id: string; transactionRef: string }> {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Live Stats
  async getLiveStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(3000) });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Upload multiple images for a plant
  async uploadPlantImages(plantId: number, files: File[]): Promise<{ message: string; images: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const res = await fetch(`${API_BASE}/plants/${plantId}/images`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Échec du téléversement des images');
    return await res.json();
  },

  // Delete an image for a plant
  async deletePlantImage(plantId: number, imageUrl: string): Promise<{ message: string; images: string[] }> {
    const res = await fetch(`${API_BASE}/plants/${plantId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    if (!res.ok) throw new Error("Échec de la suppression de l'image");
    return await res.json();
  },

  // Computer Vision Identification
  async identifyPlant(fileOrBase64: File | string): Promise<{
    isPlant?: boolean;
    accuracy?: number;
    reason?: string;
    message?: string;
    predictions: Array<{ plant: Plant; confidence: number; similarity: number }>;
    timestamp: string;
  }> {
    let res: Response;
    if (typeof fileOrBase64 === 'string') {
      res = await fetch(`${API_BASE}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: fileOrBase64 })
      });
    } else {
      const formData = new FormData();
      formData.append('image', fileOrBase64);
      res = await fetch(`${API_BASE}/identify`, {
        method: 'POST',
        body: formData
      });
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || "Erreur lors de l'identification par vision IA");
    }
    return await res.json();
  },

  // Botanical LLM Assistant
  async askBotanicalAssistant(message: string, history?: any[]): Promise<{
    response: string;
    plants: Plant[];
    language: string;
  }> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    if (!res.ok) throw new Error("Erreur de communication avec l'assistant LLM");
    return await res.json();
  },

  // Retrain / Re-index Vision AI Model
  async retrainVisionModel(): Promise<{ success: boolean; count: number; speciesCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/vision/retrain`, { method: 'POST' });
    if (!res.ok) throw new Error("Erreur lors du réentraînement du modèle IA Vision");
    return await res.json();
  }
};
