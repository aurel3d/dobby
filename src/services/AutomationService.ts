import type { Automation } from '@/types/automation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class AutomationService {
  static async getAutomations(): Promise<Automation[]> {
    const response = await fetch(`${API_URL}/automations`);
    if (!response.ok) {
      throw new Error('Failed to fetch automations');
    }
    return response.json();
  }

  static async createAutomation(automation: Omit<Automation, 'id'>): Promise<Automation> {
    const response = await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automation),
    });
    if (!response.ok) {
      throw new Error('Failed to create automation');
    }
    return response.json();
  }

  static async updateAutomation(automation: Automation): Promise<Automation> {
    const response = await fetch(`${API_URL}/automations/${automation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automation),
    });
    if (!response.ok) {
      throw new Error('Failed to update automation');
    }
    return response.json();
  }

  static async deleteAutomation(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/automations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete automation');
    }
  }
} 