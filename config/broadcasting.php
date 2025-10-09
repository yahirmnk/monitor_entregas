<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | Esta opción controla el broadcaster predeterminado que se utilizará
    | para enviar eventos a través de diferentes conexiones. Puedes
    | configurarlo en tu archivo .env con la variable BROADCAST_DRIVER.
    |
    | Opciones disponibles: "pusher", "ably", "redis", "log", "null"
    |
    */

    'default' => env('BROADCAST_DRIVER', 'null'),

    /*
    |--------------------------------------------------------------------------
    | Conexiones de broadcast disponibles
    |--------------------------------------------------------------------------
    |
    | Aquí defines cada una de las conexiones de broadcast que tu aplicación
    | soportará. Se incluyen ejemplos para Pusher, Ably, Redis, y Log.
    | Puedes modificar o añadir más según tus necesidades.
    |
    */

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                // Configuración flexible compatible con Pusher Cloud o Laravel WebSockets
                'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
                'useTLS' => env('PUSHER_USE_TLS', false),
                'encrypted' => env('PUSHER_ENCRYPTED', false),
                'host' => env('PUSHER_HOST', '127.0.0.1'),
                'port' => env('PUSHER_PORT', 6001),
                'scheme' => env('PUSHER_SCHEME', 'http'),

                // Esta opción permite conectarse con Laravel WebSockets localmente
                'curl_options' => [
                    CURLOPT_SSL_VERIFYHOST => 0,
                    CURLOPT_SSL_VERIFYPEER => 0,
                ],
            ],
        ],

        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
