// Lets plain `node` run the TypeScript in lib/ (Node strips the types itself),
// whose relative imports have no extension: "./groceryCategories" → ".ts".
import { register } from 'node:module'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) return next(specifier + '.ts', context)
    throw error
  }
}`)
)
