<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delta extends Model
{
    protected $table = 'delta';
    protected $primaryKey = 'IDDelta';
    public $timestamps = false;

    protected $fillable = ['IDMovto', 'SalidaDelta', 'LlegadaDelta'];

    public function movto() {
        return $this->belongsTo(Movtos::class, 'IDMovto', 'IDMovto');
    }
}
