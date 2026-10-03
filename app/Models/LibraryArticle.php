<?php

namespace App\Models;

use App\Models\Concerns\HasContentTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class LibraryArticle extends Model
{
    use HasFactory, HasContentTranslations;

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'summary',
        'content',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(LibraryCategory::class);
    }

    public function notes(): MorphMany
    {
        return $this->morphMany(Note::class, 'notable');
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
