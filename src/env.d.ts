/// <reference types="astro/client" />

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

/**
 * Declaración global del módulo wildcard `*.astro` para que el TypeScript
 * Server del editor (tsc standalone) resuelva los imports `import X from
 * '@/.../X.astro'` sin reportar TS2307.
 *
 * `astro check` (CLI) tiene su propio resolver y no necesita esta
 * declaración — pero el editor sí, porque no carga el language server de
 * Astro al ejecutar `tsc --noEmit` directamente.
 *
 * Cero `any`: usamos el tipo oficial `AstroComponentFactory` que es lo
 * que `experimental_AstroContainer.renderToString(Component, ...)` espera
 * en su firma. Un shape manual tipo `(props) => Promise<string>` resuelve
 * TS2307 pero introduce TS2345 al pasar el componente al container.
 *
 * Path: `astro/runtime/server/index.js` está expuesto en el campo
 * `exports` de `astro/package.json` (mapea a `./dist/runtime/*`), por lo
 * que es un entry point soportado y no un import a internals privados.
 *
 * Nota técnica: el `import type` de arriba convierte este archivo en un
 * módulo, así que el `declare module '*.astro'` debe vivir dentro de
 * `declare global { ... }` para seguir siendo una augmentation global.
 */
declare global {
  module '*.astro' {
    const Component: AstroComponentFactory;
    export default Component;
  }
}

export {};
