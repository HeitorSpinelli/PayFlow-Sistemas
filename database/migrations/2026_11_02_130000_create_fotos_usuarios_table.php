<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Foto de perfil guardada NO BANCO, para todo mundo ver a foto de todo mundo
 * (o banco do Supabase é o que as máquinas do time compartilham; um arquivo no
 * disco só existiria no computador de quem enviou).
 *
 * - fotos_usuarios: o conteúdo (base64) fica numa tabela à parte para o
 *   SELECT do usuário logado — feito a cada requisição — não trazer a imagem.
 * - users.avatar_atualizado_em: diz se há foto e serve de versão na URL
 *   (cache do navegador), sem precisar consultar fotos_usuarios.
 *
 * Também remove users.avatar_path, da primeira versão (foto em arquivo),
 * caso essa migration antiga tenha rodado neste banco.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fotos_usuarios', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('mime', 30);
            $table->longText('conteudo');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('avatar_atualizado_em')->nullable()->after('role');
        });

        if (Schema::hasColumn('users', 'avatar_path')) {
            Schema::table('users', fn (Blueprint $table) => $table->dropColumn('avatar_path'));
        }

        DB::table('migrations')->where('migration', '2026_11_02_120000_add_avatar_path_to_users_table')->delete();
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('avatar_atualizado_em'));
        Schema::dropIfExists('fotos_usuarios');
    }
};
