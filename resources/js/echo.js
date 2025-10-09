import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Pusher se define en el objeto window (Laravel lo usa internamente)
window.Pusher = Pusher

// Detecta el modo de broadcasting definido en .env (opcional)
const BROADCAST_DRIVER = import.meta.env.VITE_BROADCAST_DRIVER || 'log'

// Configuración base de Echo (para cuando se use Pusher/WebSockets)
let echo = null

if (BROADCAST_DRIVER === 'pusher') {
  echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST ?? window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
    encrypted: true,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  })

  console.log('%c[Echo] Conectado a Pusher/WebSocket correctamente', 'color: #16a34a')
} else {
  // Si el modo es "log" o no está configurado
  echo = {
    private: () => ({
      listen: () => {
        console.log('%c[Echo] (modo log) Escucha simulada - sin conexión activa', 'color: #f59e0b')
        return this
      },
    }),
  }

  console.log('%c[Echo] Ejecutando en modo log (sin conexión real)', 'color: #f59e0b')
}

export default echo
