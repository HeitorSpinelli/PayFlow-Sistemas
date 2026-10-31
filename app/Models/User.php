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
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    use Auditavel;

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

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
