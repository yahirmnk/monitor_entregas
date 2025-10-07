<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bascula extends Model
{
    protected $table = 'bascula';
    protected $primaryKey = 'IDBascula';
    public $timestamps = false;

    protected $fillable = ['IDMovto', 'HoraEntradaBascula'];

    public function movto() {
        return $this->belongsTo(Movtos::class, 'IDMovto', 'IDMovto');
    }
}
