<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CasetaSerdan extends Model
{
    protected $table = 'CasetaSerdan';
    protected $primaryKey = 'IDCaseta';
    public $timestamps = false;

    protected $fillable = [
        'IDMovto', 'HoraSalida'
    ];

    public function Movto()
    {
        return $this->belongsTo(Movto::class, 'IDCaseta', 'IDMovto');
    }
}
