<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'role_id',
    'store_id',
    'warehouse_id',
    'full_name',
    'email',
    'phone',
    'username',
    'password',
    'status',
];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
        ];
    }

public function role(): BelongsTo
{
    return $this->belongsTo(Role::class);
}

public function hasRole(string $roleCode): bool
{
    return $this->role && $this->role->code === strtoupper($roleCode);
}

public function hasAnyRole(array $roleCodes): bool
{
    if (!$this->role) {
        return false;
    }

    return in_array($this->role->code, array_map('strtoupper', $roleCodes));
}
}
