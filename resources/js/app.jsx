import '../css/app.css'
import './bootstrap'
import echo from './echo' // Importación correcta (sin llaves)

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'

// Hacer visible Echo globalmente (opcional)
window.Echo = echo

// Nombre de la app (configurable desde .env)
const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

// Inicializar Inertia con React
createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
