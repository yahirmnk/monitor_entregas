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
        'ODP', 'CitaDelta', 'CitaAnden', 'FechaRegistro', 'FechaProgramacion'
    ];

    public function Delta()
    {
        return $this->hasOne(Delta::class, 'IDDelta', 'IDMovto');
    }

    public function Bascula()
    {
        return $this->hasOne(Bascula::class, 'IDBascula', 'IDMovto');
    }

    public function CasetaSerdan()
    {
        return $this->hasOne(CasetaSerdan::class, 'IDCaseta', 'IDMovto');
    }

    public function MonitorAndenes()
    {
        return $this->hasOne(MonitorAnden::class, 'IdMonitor', 'IDMovto');
    }

    public function Anden()
    {
        return $this->hasOne(Anden::class, 'IDAnden', 'IDMovto');
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

