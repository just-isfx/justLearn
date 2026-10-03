<?php

namespace App\Models;

use App\Models\Concerns\HasContentTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LibraryCategory extends Model
{
    use HasFactory, HasContentTranslations;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(LibraryArticle::class);
    }
}
