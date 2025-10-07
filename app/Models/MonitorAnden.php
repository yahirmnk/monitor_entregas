<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonitorAnden extends Model
{
    protected $table = 'monitor_andenes';
    protected $primaryKey = 'IDMonitor';
    public $timestamps = false;

    protected $fillable = ['IDMovto', 'IDAnden', 'NoAnden'];

    public function movto() {
        return $this->belongsTo(Movtos::class, 'IDMovto', 'IDMovto');
    }

    public function anden() {
        return $this->belongsTo(Anden::class, 'IDAnden', 'IDAnden');
    }
}
