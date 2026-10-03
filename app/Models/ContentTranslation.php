<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Future content locale row.
 *
 * Approach (Stage 7):
 * - Original educational copy remains on Course, Lesson, LibraryArticle, etc.
 * - Those records keep language-independent slugs and IDs.
 * - Additional languages are stored here: locale + translated title,
 *   description, and content.
 * - Do not treat this table as the primary source of truth until a
 *   translation exists for the requested locale.
 */
class ContentTranslation extends Model
{
    protected $fillable = [
        'translatable_type',
        'translatable_id',
        'locale',
        'title',
        'description',
        'content',
    ];

    public function translatable(): MorphTo
    {
        return $this->morphTo();
    }
}
