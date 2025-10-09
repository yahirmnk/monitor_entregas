<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('monitor-logistico', function ($user) {
    return true; 
});
