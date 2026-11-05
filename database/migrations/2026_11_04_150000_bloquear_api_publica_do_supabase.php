<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fecha a API pública do Supabase (PostgREST) para as tabelas do sistema.
 *
 * O Supabase expõe o schema `public` numa API REST que aceita os papéis
 * `anon` (chave pública) e `authenticated`. O PayFlow não usa essa API — o
 * Laravel conecta direto no Postgres como `postgres`, que ignora RLS
 * (rolbypassrls) — então nada aqui muda o funcionamento do sistema.
 *
 * - Liga Row Level Security em todas as tabelas, sem nenhuma policy: para
 *   anon/authenticated isso significa "nenhuma linha". É o que o Security
 *   Advisor do Supabase cobra ("RLS disabled in public").
 * - Revoga o que sobrou de permissão desses papéis (TRUNCATE, TRIGGER,
 *   REFERENCES) e as permissões padrão das tabelas que forem criadas depois.
 *
 * Só roda no Postgres e só se os papéis do Supabase existirem (no SQLite dos
 * testes e num Postgres comum ela não faz nada).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! $this->ehSupabase()) {
            return;
        }

        foreach ($this->tabelas() as $tabela) {
            DB::statement("alter table public.\"{$tabela}\" enable row level security");
        }

        DB::statement('revoke all on all tables in schema public from anon, authenticated');
        DB::statement('revoke all on all sequences in schema public from anon, authenticated');
        DB::statement('alter default privileges in schema public revoke all on tables from anon, authenticated');
        DB::statement('alter default privileges in schema public revoke all on sequences from anon, authenticated');
    }

    public function down(): void
    {
        if (! $this->ehSupabase()) {
            return;
        }

        foreach ($this->tabelas() as $tabela) {
            DB::statement("alter table public.\"{$tabela}\" disable row level security");
        }

        // Volta só o que existia antes desta migration.
        DB::statement('grant references, trigger, truncate on all tables in schema public to anon, authenticated');
    }

    private function ehSupabase(): bool
    {
        return DB::getDriverName() === 'pgsql'
            && DB::table('pg_roles')->whereIn('rolname', ['anon', 'authenticated'])->count() === 2;
    }

    /** @return list<string> */
    private function tabelas(): array
    {
        return collect(DB::select(
            "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind in ('r', 'p')"
        ))->pluck('relname')->all();
    }
};
