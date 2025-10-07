import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes, differenceInHours, isAfter } from 'date-fns'

// CSS embebido directamente en el archivo
const estilos = `
@keyframes blink {
  50% { opacity: 0.4; }
}
.estado-verde {
  background-color: #16a34a; /* green-600 */
  color: white;
  transition: all 0.4s ease;
}
.estado-naranja {
  background-color: #f97316; /* orange-500 */
  animation: blink 1s infinite;
  color: black;
}
.estado-rojo {
  background-color: #dc2626; /* red-600 */
  animation: blink 1s infinite;
  color: white;
}
.fila-roja {
  background-color: #dc2626;
  color: white;
  animation: blink 1s infinite;
}
`

// Inyectar los estilos al <head> del documento
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.innerHTML = estilos
  document.head.appendChild(styleTag)
}

// Formatear fecha a dd/mm/yyyy HH:mm:ss
const formatearFecha = (valor) => {
  if (!valor) return '-'
  try {
    const [fecha, hora] = valor.split(' ')
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}${hora ? ' ' + hora : ''}`
  } catch {
    return valor
  }
}

// Lógica de colores según condiciones de tiempo
const getColorClase = (movto) => {
  const ahora = new Date()
  const citaDelta = movto.CitaDelta ? parseISO(movto.CitaDelta) : null
  const llegadaDelta = movto.LlegadaDelta ? parseISO(movto.LlegadaDelta) : null
  const entradaBascula = movto.EntradaBascula ? parseISO(movto.EntradaBascula) : null
  const llegadaAnden = movto.LlegadaAnden ? parseISO(movto.LlegadaAnden) : null
  const salidaDelta = movto.SalidaDelta ? parseISO(movto.SalidaDelta) : null
  const inicioRuta = movto.InicioRuta ? parseISO(movto.InicioRuta) : null

  let clase = ''

  // 1. Cita Delta vs Llegada Delta
  if (citaDelta && llegadaDelta) {
    const diff = differenceInMinutes(llegadaDelta, citaDelta)
    if (diff > 120) clase = 'estado-rojo'
    else if (diff > 60) clase = 'estado-naranja'
    else if (diff <= 0) clase = 'estado-verde'
  }

  // 2. Entrada Báscula → 20 minutos
  if (entradaBascula && !llegadaAnden) {
    const minutos = differenceInMinutes(ahora, entradaBascula)
    if (minutos >= 20) clase = 'estado-rojo'
    else clase = 'estado-naranja'
  }

  // 3. Salida Delta vs Inicio Ruta
  if (salidaDelta && inicioRuta) {
    const diffHoras = differenceInHours(inicioRuta, salidaDelta)
    if (diffHoras <= 1) clase = 'fila-roja'
    else if (diffHoras <= 2) clase = 'estado-naranja'
    else if (isAfter(inicioRuta, salidaDelta)) clase = 'estado-verde'
  }

  return clase
}

export default function Dashboard() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const [movtos, setMovtos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  // Intervalo de actualización (1 minuto)
  const INTERVALO_ACTUALIZACION = 60000

  // Carga inicial y recarga automática
  useEffect(() => {
    obtenerDatos(fechaSeleccionada)
    const timer = setInterval(() => obtenerDatos(fechaSeleccionada), INTERVALO_ACTUALIZACION)
    return () => clearInterval(timer)
  }, [fechaSeleccionada])

  const obtenerDatos = async (fecha) => {
    try {
      const res = await fetch(`/api/monitor/json?fecha=${fecha}`)
      if (!res.ok) throw new Error('Error al obtener datos')
      const data = await res.json()
      setMovtos(data.data || [])
      setUltimaActualizacion(new Date().toLocaleTimeString())
      console.log(`Datos actualizados: ${new Date().toLocaleTimeString()}`)
    } catch (err) {
      console.error('Error al refrescar datos:', err)
    }
  }

  return (
    <>
      <Head title="Dashboard Logístico" />

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard Logístico</h1>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label className="block text-sm font-medium">Fecha</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="text-sm text-gray-600 italic">
            Última actualización: {ultimaActualizacion || '---'}
          </div>
        </div>

        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">ODP</th>
              <th className="border px-2 py-1">Cita Delta</th>
              <th className="border px-2 py-1">Llegada Delta</th>
              <th className="border px-2 py-1">Salida Delta</th>
              <th className="border px-2 py-1">Entrada Báscula</th>
              <th className="border px-2 py-1">No. Andén</th>
              <th className="border px-2 py-1">Llegada Andén</th>
              <th className="border px-2 py-1">Salida Planta</th>
              <th className="border px-2 py-1">Inicio Ruta</th>
            </tr>
          </thead>
          <tbody>
            {movtos.length > 0 ? (
              movtos.map((m, i) => {
                const color = getColorClase(m)
                return (
                  <tr key={i} className={`text-center ${color}`}>
                    <td className="border px-2 py-1">{m.ODP || '-'}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.CitaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.LlegadaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.SalidaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.EntradaBascula)}</td>
                    <td className="border px-2 py-1">{m.NoAnden || '-'}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.LlegadaAnden)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.SalidaPlanta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.InicioRuta)}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-3 text-gray-500">
                  No hay registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
