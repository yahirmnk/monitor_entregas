<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bascula extends Model
{
    protected $table = 'Bascula';
    protected $primaryKey = 'IDBascula';
    public $timestamps = false;

    protected $fillable = [
        'IDMovto', 'HoraEntradaBascula', 'HoraSalidaBascula', 'HoraSalidaBasEmbarque',
    ];

    public function Movto()
    {
        return $this->belongsTo(Movto::class, 'IDBascula', 'IDMovto');
    }
}
