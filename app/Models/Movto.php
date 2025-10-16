<?php

namespace App\Models;

use App\Events\MovtoUpdated;
use Illuminate\Database\Eloquent\Model;

class Movto extends Model
{
    protected $table = 'Movtos';
    protected $primaryKey = 'IDMovto';
    public $timestamps = false;

    protected $fillable = [
        'ODP', 'CitaDelta', 
        'CitaAnden', 'FechaRegistro', 
        'FechaProgramacion', 'CitaCarga',
        'Consolidado', 'es_principal',
    ];

    // Relación con tabla Delta por ODP
    public function Delta()
    {
        return $this->hasOne(Delta::class, 'ODP', 'ODP');
    }

    public function Bascula()
    {
        return $this->hasOne(Bascula::class, 'ODP', 'ODP');
    }

    public function CasetaSerdan()
    {
        return $this->hasOne(CasetaSerdan::class, 'ODP', 'ODP');
    }

    public function MonitorAndenes()
    {
        return $this->hasOne(MonitorAnden::class, 'ODP', 'ODP');
    }

    public function Anden()
    {
        return $this->hasOne(Anden::class, 'ODP', 'ODP');
    }

    protected static function booted()
    {
        static::created(function ($movto) {
            event(new MovtoUpdated($movto));
        });

        static::updated(function ($movto) {
            event(new MovtoUpdated($movto));
        });
    }
}
