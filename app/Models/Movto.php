<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movto extends Model
{
    protected $table = 'Movtos';
    protected $primaryKey = 'IDMovto';
    public $timestamps = false;

    protected $fillable = [
        'ODP', 'CitaDelta', 'CitaAnden', 'FechaRegistro'
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
}

