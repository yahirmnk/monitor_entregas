<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Habilita las rutas de broadcasting (como /broadcasting/auth)
        Broadcast::routes();

        // Carga la definición de canales
        require base_path('routes/channels.php');
    }
}
