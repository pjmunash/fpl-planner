import type { FPLBootstrapData, ManagerData, ManagerPicks, Fixture } from '../types/fpl';

const BASE_URL = '/api';

class FPLApi {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for static data
  private readonly LIVE_CACHE_DURATION = 30 * 1000; // 30 seconds for live data (updates faster)

  private async fetchWithCache<T>(url: string, useCache = true, cacheDuration = this.CACHE_DURATION): Promise<T> {
    if (useCache && this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      if (Date.now() - cached.timestamp < cacheDuration) {
        return cached.data as T;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (useCache) {
        this.cache.set(url, { data, timestamp: Date.now() });
      }
      
      return data as T;
    } catch (error) {
      console.error('FPL API Error:', error);
      throw error;
    }
  }

  async getBootstrapData(): Promise<FPLBootstrapData> {
    return this.fetchWithCache(`${BASE_URL}/bootstrap-static/`);
  }

  async getFixtures(): Promise<Fixture[]> {
    return this.fetchWithCache(`${BASE_URL}/fixtures/`);
  }

  async getManagerData(teamId: number): Promise<ManagerData> {
    return this.fetchWithCache(`${BASE_URL}/entry/${teamId}/`, false);
  }

  async getManagerPicks(teamId: number, gameweek: number): Promise<ManagerPicks> {
    return this.fetchWithCache(`${BASE_URL}/entry/${teamId}/event/${gameweek}/picks/`, false);
  }

  async getManagerHistory(teamId: number): Promise<any> {
    return this.fetchWithCache(`${BASE_URL}/entry/${teamId}/history/`, false);
  }

  async getLiveGameweek(gameweek: number): Promise<any> {
    return this.fetchWithCache(`${BASE_URL}/event/${gameweek}/live/`, true, this.LIVE_CACHE_DURATION);
  }

  async getManagerLeagues(teamId: number): Promise<any> {
    return this.fetchWithCache(`${BASE_URL}/entry/${teamId}/leagues/`, false);
  }

  async getLeagueStandings(leagueId: number, pageNumber = 1): Promise<any> {
    return this.fetchWithCache(`${BASE_URL}/leagues-classic/${leagueId}/standings/?page_standings=${pageNumber}`, false);
  }

  async getHeadToHeadLeagueStandings(leagueId: number, pageNumber = 1): Promise<any> {
    return this.fetchWithCache(`${BASE_URL}/leagues-h2h/${leagueId}/standings/?page_standings=${pageNumber}`, false);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const fplApi = new FPLApi();
