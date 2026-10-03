<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizOption extends Model
{
    use HasFactory;

    protected $fillable = ['question_id', 'option_text', 'is_correct', 'option_order'];
    protected $casts = ['is_correct' => 'boolean', 'option_order' => 'integer'];

    public function question(): BelongsTo { return $this->belongsTo(QuizQuestion::class); }
}
