<?php

namespace App\Models\Concerns;

use App\Models\ContentTranslation;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasContentTranslations
{
    public function translations(): MorphMany
    {
        return $this->morphMany(ContentTranslation::class, 'translatable');
    }

    public function translationFor(?string $locale): ?ContentTranslation
    {
        $locale = $locale ?: config('languages.default', 'en');

        return $this->translations->firstWhere('locale', $locale)
            ?? $this->translations()->where('locale', $locale)->first();
    }

    /**
     * Overlay translated title/description/content when a locale row exists.
     * Falls back to the original record fields.
     */
    public function toLocalizedArray(?string $locale = null): array
    {
        $locale = $locale ?: config('languages.default', 'en');
        $base = $this->toArray();
        $translation = $this->translationFor($locale);

        if (!$translation) {
            $base['locale'] = config('languages.default', 'en');
            $base['is_translated'] = false;

            return $base;
        }

        $base['title'] = $translation->title ?: ($base['title'] ?? null);
        if (array_key_exists('description', $base) && $translation->description) {
            $base['description'] = $translation->description;
        }
        if (array_key_exists('summary', $base) && $translation->description) {
            $base['summary'] = $translation->description;
        }
        if (array_key_exists('name', $base) && $translation->title) {
            $base['name'] = $translation->title;
        }
        if (array_key_exists('content', $base) && $translation->content) {
            $base['content'] = $translation->content;
        }
        $base['locale'] = $locale;
        $base['is_translated'] = true;

        return $base;
    }
}
