import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPS_DIR = path.join(__dirname, '..', '..', 'public', 'muscle-maps');

function slugifyId(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * GET /api/muscle-maps
 * Trả về danh sách các file SVG đã có.
 */
export async function listMaps(_req, res) {
  try {
    const files = await fs.readdir(MAPS_DIR);
    const svgs = files.filter((f) => f.endsWith('.svg'));
    res.json({
      total: svgs.length,
      ids: svgs.map((f) => f.replace('.svg', '')),
    });
  } catch {
    res.json({ total: 0, ids: [] });
  }
}

/**
 * GET /api/muscle-maps/:id/exists
 * Kiểm tra 1 exercise đã có SVG chưa.
 */
export async function hasMap(req, res) {
  const { id } = req.params;
  const slug = slugifyId(id);
  const file = path.join(MAPS_DIR, `${slug}.svg`);
  try {
    await fs.access(file);
    res.json({ exists: true, url: `/static/muscle-maps/${slug}.svg` });
  } catch {
    res.json({ exists: false, url: null });
  }
}
