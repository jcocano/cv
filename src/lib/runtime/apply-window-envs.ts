export interface EnvsWindow extends Window {
  envs?: string;
}

export function applyWindowEnvs(targetWindow: EnvsWindow, payload: string): void {
  targetWindow.envs = payload;
}
