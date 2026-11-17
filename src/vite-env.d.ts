/// <reference types="svelte" />
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component<Record<string, unknown>>;
  export default component;
}
declare module '*.css';
declare module '*?worker' {
  const workerConstructor: { new (): Worker };
  export default workerConstructor;
}
