<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anden extends Model
{
    protected $table = 'Anden';
    protected $primaryKey = 'IDAnden';
    public $timestamps = false;

    protected $fillable = [
        'IDMovto', 'NoAnden', 'HoraLlegada', 'HoraSalida'
    ];

    public function Movto()
    {
        return $this->belongsTo(Movto::class, 'IDAnden', 'IDMovto');
    }

    public function MonitorAndenes()
    {
        return $this->hasOne(MonitorAnden::class, 'IDAnden', 'IDMovto');
    }
}
