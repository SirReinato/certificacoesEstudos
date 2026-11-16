/**
 * Script de Migração: SQLite local (data/safezone.db) -> Supabase
 * Executa a leitura das tabelas locais e importa no projeto Supabase ativo.
 * Uso: node scripts/migrate-sqlite-to-supabase.mjs <SUPABASE_URL> <SUPABASE_ANON_OR_SERVICE_KEY> <USER_EMAIL> <USER_PASSWORD>
 */

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const dbPath = process.env.DB_PATH || 'data/safezone.db';
const supabaseUrl = process.argv[2] || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.argv[3] || process.env.VITE_SUPABASE_ANON_KEY;
const userEmail = process.argv[4];
const userPassword = process.argv[5];

if (!existsSync(dbPath)) {
  console.log(`Banco SQLite local não encontrado em ${dbPath}. Nada a migrar.`);
  process.exit(0);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Parâmetros SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios.');
  console.log('Uso: node scripts/migrate-sqlite-to-supabase.mjs <SUPABASE_URL> <SUPABASE_KEY> <USER_EMAIL> <USER_PASSWORD>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log(`Iniciando conexão com SQLite em ${dbPath}...`);
  const sqlite = new DatabaseSync(dbPath);

  let userId = null;
  if (userEmail && userPassword) {
    console.log(`Autenticando usuário ${userEmail} no Supabase...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });
    if (authError) {
      console.error('Falha ao autenticar no Supabase:', authError.message);
      process.exit(1);
    }
    userId = authData.user.id;
    console.log(`Autenticado com sucesso! User ID: ${userId}`);
  } else {
    console.error('Atenção: Credenciais de usuário (email/senha) são necessárias para associar os dados sob RLS.');
    process.exit(1);
  }

  // Migrar contents
  try {
    const contentsStmt = sqlite.prepare('SELECT * FROM contents');
    const contents = contentsStmt.all();
    console.log(`Migrando ${contents.length} registros de contents...`);

    for (const c of contents) {
      const row = {
        id: c.id,
        user_id: userId,
        title: c.title,
        type: c.type || 'text',
        source: c.source ? JSON.parse(c.source) : { type: 'text' },
        tags: c.tags ? JSON.parse(c.tags) : [],
        flashcards_count: c.flashcards_count || 0,
        reviewed_count: c.reviewed_count || 0,
        mastery: c.mastery || 0,
        extracted_text: c.extracted_text || null,
        chunks: c.chunks ? JSON.parse(c.chunks) : null,
        study_guide: c.study_guide ? JSON.parse(c.study_guide) : null,
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      };

      const { error } = await supabase.from('contents').upsert(row);
      if (error) console.error(`Erro ao inserir content ${c.id}:`, error.message);
    }
  } catch (err) {
    console.warn('Aviso ao ler contents do SQLite:', err.message);
  }

  // Migrar flashcards
  try {
    const flashcardsStmt = sqlite.prepare('SELECT * FROM flashcards');
    const flashcards = flashcardsStmt.all();
    console.log(`Migrando ${flashcards.length} registros de flashcards...`);

    for (const fc of flashcards) {
      const row = {
        id: fc.id,
        user_id: userId,
        content_id: fc.content_id,
        front: fc.front,
        back: fc.back,
        format: fc.format || 'flip',
        options: fc.options ? JSON.parse(fc.options) : null,
        explanation: fc.explanation || null,
        tags: fc.tags ? JSON.parse(fc.tags) : [],
        difficulty: fc.difficulty || 'medium',
        importance: fc.importance || 5,
        ease_factor: fc.ease_factor || 2.5,
        interval: fc.interval || 0,
        repetitions: fc.repetitions || 0,
        next_review: fc.next_review || new Date().toISOString(),
        last_reviewed: fc.last_reviewed || null,
        lapses: fc.lapses || 0,
        created_at: fc.created_at || new Date().toISOString(),
        updated_at: fc.updated_at || new Date().toISOString(),
      };

      const { error } = await supabase.from('flashcards').upsert(row);
      if (error) console.error(`Erro ao inserir flashcard ${fc.id}:`, error.message);
    }
  } catch (err) {
    console.warn('Aviso ao ler flashcards do SQLite:', err.message);
  }

  console.log('Migração SQLite -> Supabase concluída com sucesso!');
}

runMigration().catch((err) => {
  console.error('Erro fatal na migração:', err);
  process.exit(1);
});
