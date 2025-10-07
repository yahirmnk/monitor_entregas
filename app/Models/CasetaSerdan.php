<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CasetaSerdan extends Model
{
    protected $table = 'caseta_serdan';
    protected $primaryKey = 'IDCaseta';
    public $timestamps = false;

    protected $fillable = ['IDMovto', 'HoraSalida'];

    public function movto() {
        return $this->belongsTo(Movtos::class, 'IDMovto', 'IDMovto');
    }
}
