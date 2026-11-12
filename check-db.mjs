import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'safezone.db');
try {
  const db = new DatabaseSync(DB_PATH);
  const row = db.prepare('SELECT data FROM exams WHERE id = ?').get('AZ-204');
  console.log('Exame AZ-204 encontrado:', !!row);
  if (row) console.log('Dados:', row.data.substring(0, 100) + '...');
} catch (e) {
  console.error('Erro ao acessar DB:', e.message);
}
