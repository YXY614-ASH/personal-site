import { mkdir, readFile, writeFile, access, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const requireTool = createRequire(process.env.TOOL_NODE_MODULES ? path.join(process.env.TOOL_NODE_MODULES, 'tools.cjs') : import.meta.url);
const lucide = requireTool('lucide');
const sharp = requireTool('sharp');
const output = path.join(root, 'public/assets');
await mkdir(output, { recursive: true });
const names = ['arrow-up-right', 'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'github', 'menu', 'brain-circuit', 'blocks', 'book-open', 'code-2', 'git-branch', 'graduation-cap', 'files', 'message-square-text', 'sparkles', 'search', 'rotate-ccw', 'file-user', 'download', 'file-code', 'terminal', 'globe', 'check', 'circle-dashed', 'calculator', 'x'];
const symbols = names.map(name => {
  const exportName = name === 'github' ? 'GitFork' : name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  const nodes = lucide[exportName];
  if (!nodes) throw new Error(`Missing Lucide icon: ${name}`);
  return `<symbol id="icon-${name}" viewBox="0 0 24 24">${nodes.map(([tag, attributes]) => `<${tag} ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')} />`).join('')}</symbol>`;
}).join('\n');
await writeFile(path.join(output, 'icons.svg'), symbols);
await copyFile(requireTool.resolve('lucide/LICENSE'), path.join(output, 'LUCIDE-LICENSE.txt'));

const workspace = path.join(output, 'workspace.webp');
try { await access(workspace); } catch {
  const response = await fetch('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=85');
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await sharp(bytes).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 83 }).toFile(workspace);
}
try { await access(path.join(output, 'site-preview.webp')); } catch {
  // Replaced with an actual rendered site screenshot before release.
  await sharp(await readFile(workspace)).resize(1000, 625).webp({ quality: 80 }).toFile(path.join(output, 'site-preview.webp'));
}
await sharp(workspace).resize(1280).webp({ quality: 80 }).toFile(path.join(output, 'workspace-1280.webp'));
await sharp(workspace).resize(768, 960, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(output, 'workspace-mobile.webp'));
console.log('Prepared local image and Lucide assets. No runtime CDN is required.');
