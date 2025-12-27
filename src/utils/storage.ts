const STORAGE_KEYS = {
  TEAM_ID: 'fpl_team_id',
  MANAGER_DATA: 'fpl_manager_data',
  TRANSFER_PLANS: 'fpl_transfer_plans',
  CHIP_PLANS: 'fpl_chip_plans',
  LAST_FETCH: 'fpl_last_fetch',
  SELECTED_GW: 'fpl_selected_gw',
} as const;

export const storage = {
  setTeamId(teamId: number): void {
    sessionStorage.setItem(STORAGE_KEYS.TEAM_ID, teamId.toString());
  },

  getTeamId(): number | null {
    const id = sessionStorage.getItem(STORAGE_KEYS.TEAM_ID);
    return id ? parseInt(id, 10) : null;
  },

  setManagerData(data: any): void {
    sessionStorage.setItem(STORAGE_KEYS.MANAGER_DATA, JSON.stringify(data));
    sessionStorage.setItem(STORAGE_KEYS.LAST_FETCH, Date.now().toString());
  },

  getManagerData(): any | null {
    const data = sessionStorage.getItem(STORAGE_KEYS.MANAGER_DATA);
    return data ? JSON.parse(data) : null;
  },

  setTransferPlans(plans: any[]): void {
    sessionStorage.setItem(STORAGE_KEYS.TRANSFER_PLANS, JSON.stringify(plans));
  },

  getTransferPlans(): any[] {
    const plans = sessionStorage.getItem(STORAGE_KEYS.TRANSFER_PLANS);
    return plans ? JSON.parse(plans) : [];
  },

  setChipPlans(plans: any[]): void {
    sessionStorage.setItem(STORAGE_KEYS.CHIP_PLANS, JSON.stringify(plans));
  },

  getChipPlans(): any[] {
    const plans = sessionStorage.getItem(STORAGE_KEYS.CHIP_PLANS);
    return plans ? JSON.parse(plans) : [];
  },

  getLastFetch(): number | null {
    const time = sessionStorage.getItem(STORAGE_KEYS.LAST_FETCH);
    return time ? parseInt(time, 10) : null;
  },

  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  },

  isExpired(maxAge: number = 30 * 60 * 1000): boolean {
    const lastFetch = this.getLastFetch();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > maxAge;
  },

  getSelectedGW(): number | null {
    const v = sessionStorage.getItem(STORAGE_KEYS.SELECTED_GW);
    return v ? parseInt(v, 10) : null;
  },
  setSelectedGW(gw: number): void {
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_GW, gw.toString());
  }
};
