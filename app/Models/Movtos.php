<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movtos extends Model
{
    protected $table = 'movtos';
    protected $primaryKey = 'IDMovto';
    public $timestamps = false;

    protected $fillable = ['ODP', 'CitaAnden', 'CitaDelta'];

    // Relaciones
    public function delta() {
        return $this->hasOne(Delta::class, 'IDMovto', 'IDMovto');
    }

    public function caseta() {
        return $this->hasOne(CasetaSerdan::class, 'IDMovto', 'IDMovto');
    }

    public function bascula() {
        return $this->hasOne(Bascula::class, 'IDMovto', 'IDMovto');
    }

    public function monitorAnden() {
        return $this->hasOne(MonitorAnden::class, 'IDMovto', 'IDMovto');
    }
}
