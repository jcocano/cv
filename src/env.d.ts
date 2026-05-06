/// <reference types="astro/client" />

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

declare global {
  module '*.astro' {
    const Component: AstroComponentFactory;
    export default Component;
  }
}

export {};
