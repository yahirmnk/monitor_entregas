<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonitorAnden extends Model
{
    protected $table = 'MonitorAndenes';
    protected $primaryKey = 'IdMonitor';
    public $timestamps = false;

    protected $fillable = [
        'IDMovto', 'IDAnden', 'NoAnden', 'HoraLlegada'
    ];

    public function Movto()
    {
        return $this->belongsTo(Movto::class, 'IDMovto', 'IdMonitor');
    }

    public function Anden()
    {
        return $this->belongsTo(Anden::class, 'IDAnden', 'IDAnden');
    }
}

