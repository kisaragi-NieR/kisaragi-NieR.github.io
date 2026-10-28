import { createProvider } from './dataProvider.js';

const provider = createProvider();

export async function search(rawInput) {
  return provider.search(rawInput);
}
