<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * Usuário que acessa o sistema (role 'admin' ou 'user'). Gerenciado na
 * "Lista de Usuários" da tela Administração; o primeiro é criado pela tela
 * Configuração Inicial ou pelo comando usuarios:criar-admin.
 */
#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'avatar_atualizado_em'])]
class User extends Authenticatable implements MustVerifyEmail
{
    use Auditavel;

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    // URL pronta da foto de perfil; o front já lê auth.user.avatar no menu
    // lateral, no menu do usuário e no card do Perfil.
    protected $appends = ['avatar'];

    /**
     * URL da foto (GET /settings/profile/avatar/{id}) ou null sem foto — aí o
     * Avatar mostra as iniciais. Usa só avatar_atualizado_em (já vem no SELECT
     * do usuário), sem consultar fotos_usuarios; o ?v= muda a cada troca de
     * foto, para o navegador não reaproveitar a imagem antiga do cache. A foto
     * em si some junto com o usuário pelo ON DELETE CASCADE.
     */
    public function getAvatarAttribute(): ?string
    {
        $versao = $this->attributes['avatar_atualizado_em'] ?? null;

        if (! $versao) {
            return null;
        }

        return route('profile.avatar.show', ['user' => $this->id, 'v' => substr(md5((string) $versao), 0, 8)], false);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'string',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Atalho para role === 'admin'. Hoje nada chama este método: o controle de
     * acesso usa o Gate 'is-admin' (AppServiceProvider) e o front lê auth.user.role.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Usuário';
    }

    public function auditoriaDescricao(): string
    {
        return $this->name.' ('.$this->email.')';
    }
}
