<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delta extends Model
{
    protected $table = 'Delta';
    protected $primaryKey = 'IDDelta';
    public $timestamps = false;

    protected $fillable = [
        'IDMovto', 'SalidaDelta', 
        'LlegadaDelta', 'ODP'
    ];

    public function Movto()
    {
        return $this->belongsTo(Movto::class, 'IDMovto', 'IDDelta');
    }
}
