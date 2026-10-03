<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class LearningStreak extends Model { protected $fillable = ['user_id','current_streak','longest_streak','last_activity_date']; protected $casts = ['last_activity_date'=>'date','current_streak'=>'integer','longest_streak'=>'integer']; public function user(): BelongsTo { return $this->belongsTo(User::class); } }
