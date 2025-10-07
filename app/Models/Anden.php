<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anden extends Model
{
    protected $table = 'anden';
    protected $primaryKey = 'IDAnden';
    public $timestamps = false;

    protected $fillable = ['IDMovto', 'NoAnden'];

    public function monitor() {
        return $this->hasOne(MonitorAnden::class, 'IDAnden', 'IDAnden');
    }

    public function movto() {
        return $this->belongsTo(Movtos::class, 'IDMovto', 'IDMovto');
    }
}
