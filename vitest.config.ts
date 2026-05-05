import { getViteConfig } from 'astro/config';
import type { UserConfig as ViteUserConfig } from 'vite';
import type { ViteUserConfig as VitestUserConfig } from 'vitest/config';

const viteConfigWithVitest: ViteUserConfig & Pick<VitestUserConfig, 'test'> = {
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
};

export default getViteConfig(viteConfigWithVitest);
