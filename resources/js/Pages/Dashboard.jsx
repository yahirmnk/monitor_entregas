import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes } from 'date-fns'
import * as dateFnsTz from 'date-fns-tz'

import echo from '../echo'

// === Estilos visuales ===
const estilos = `
@keyframes blink {
  50% { opacity: 0.4; }
}
.estado-verde {
  background-color: #e9fcf0ff; 
  color: black;
  transition: all 0.4s ease;
}
.estado-naranja {
  background-color: #f97316;
  animation: blink 1s infinite;
  color: black;
}
.estado-rojo {
  background-color: #dc2626;
  animation: blink 1s infinite;
  color: white;
}
`

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.innerHTML = estilos
  document.head.appendChild(styleTag)
}

// Formatear Fecha 
const formatearFecha = (valor) => {
  if (!valor) return 'No reportado'
  try {
    const [fecha, hora] = valor.split(' ')
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}${hora ? ' ' + hora : ''}`
  } catch {
    return valor
  }
}

//  Cálculo de colores 
const getColorClase = (movto) => {
  const zona = 'America/Mexico_City'
  let ahora

  try {
    // Usa la función desde el namespace
    ahora = dateFnsTz.utcToZonedTime
      ? dateFnsTz.utcToZonedTime(new Date(), zona)
      : new Date()
  } catch {
    ahora = new Date()
  }
  //const salidaPlanta = movto.SalidaPlanta ? parseISO(movto.SalidaPlanta) : null
  //const inicioRuta = movto.InicioRuta ? parseISO(movto.InicioRuta) : null
  const citaEntrega = movto.CitaEntrega ? parseISO(movto.CitaEntrega) : null
  const colorCelda = { inicioRuta: '', salidaPlanta: '', citaEntrega: '' }
  let colorFila = ''
  // CitaEntrega vs Fecha y Hora Actual 
  if (citaEntrega) {
    try {
      const citaLocal = dateFnsTz.utcToZonedTime
        ? dateFnsTz.utcToZonedTime(citaEntrega, zona)
        : citaEntrega
      const ahoraLocal = dateFnsTz.utcToZonedTime
        ? dateFnsTz.utcToZonedTime(new Date(), zona)
        : new Date()
      const diffEntrega = differenceInMinutes(citaLocal, ahoraLocal)
      console.log(
        '[CITA]',
        'ODP:', movto.ODP,
        '| CitaEntrega:', citaLocal,
        '| Ahora:', ahoraLocal,
        '| Diff(min):', diffEntrega
      )
      if (diffEntrega <= 120 && diffEntrega > 60) {
        colorCelda.citaEntrega = 'estado-naranja'
      } else if (diffEntrega <= 60 && diffEntrega >= 0) {
        colorCelda.citaEntrega = 'estado-rojo'
      } else if (diffEntrega < 0) {
        colorCelda.citaEntrega = 'estado-rojo'
      }
    } catch (e) {
      console.error('Error CitaEntrega:', e)
    }
  }
  return { colorCelda, colorFila }
}
//  Componente principal 
export default function Dashboard() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const hoy = new Date().toISOString().split('T')[0]
  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [fechaFin, setFechaFin] = useState(hoy)
  const [movtos, setMovtos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [filtroTransporte, setFiltroTransporte] = useState('')
  const INTERVALO_ACTUALIZACION = 60000
  useEffect(() => {
    obtenerDatos()
    const timer = setInterval(obtenerDatos, INTERVALO_ACTUALIZACION)
    return () => clearInterval(timer)
  }, [fechaSeleccionada, fechaInicio, fechaFin])
  useEffect(() => {
    const channel = echo.private('monitor-logistico')
    channel.listen('MovtoUpdated', (evento) => {
      setMovtos((prev) =>
        prev.map((m) => (m.ODP === evento.ODP ? { ...m, ...evento } : m))
      )
    })
    return () => echo.leave('monitor-logistico')
  }, [])
  const obtenerDatos = async () => {
    try {
      let url = '/api/monitor/json'
      if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      } else {
        url += `?fecha=${fechaSeleccionada || new Date().toISOString().split('T')[0]}`
      }
      console.log('Conectando con backend:', url)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const data = await res.json()
      console.log('Datos recibidos:', data?.data?.length || 0, 'registros')
      setMovtos(data?.data || [])
      setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
    } catch (error) {
      console.error('Error en la conexión o lectura de datos:', error)
      setMovtos([])
    }
  }
  return (
    <>
      <Head title="Almacen" />
      <div className="container mx-auto max-w-none p-2">
        <h1 className="text-3xl font-bold mb-4 text-center">
          MONITOR DE ENTREGAS PASTEURIZADORA MAULEC SAPI DE CV
        </h1>
        <div className="flex flex-wrap gap-4 items-center mb-4 justify-center">
          <div>
            <label className="block text-sm font-medium">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setFechaSeleccionada('')
              }}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setFechaSeleccionada('')
              }}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Línea de Transporte</label>
            <input
              type="text"
              placeholder="Buscar línea..."
              value={filtroTransporte}
              onChange={(e) => setFiltroTransporte(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <button
            onClick={obtenerDatos}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
          <div className="text-sm text-gray-600 italic">
            Última actualización: {ultimaActualizacion || '---'}
          </div>
          <form
            method="POST"
            action="/logout"
            onSubmit={() => console.log('Cerrando sesión...')}
          >
            <input
              type="hidden"
              name="_token"
              value={document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')}
            />
            <button
              type="submit"
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
        <div className="overflow-x-auto max-h-[85vh] shadow-md border border-gray-300 rounded-md">
          <table className="table-auto w-full text-xs md:text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="border px-2 py-2">ODP</th>
                <th className="border px-2 py-2">Línea Transporte</th>
                <th className="border px-2 py-2">Cita Entrega</th>
                <th className="border px-2 py-2">Salida Planta</th>
                <th className="border px-2 py-2">Inicio Ruta</th>
                <th className="border px-2 py-2">ETA</th>
                <th className="border px-2 py-2">Status</th>
                <th className="border px-2 py-2">Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {movtos.length > 0 ? (
                movtos
                  .filter((m) => m.Status?.toLowerCase() !== 'entregado')
                  .filter((m) =>
                    filtroTransporte.trim() === '' 
                      ? true 
                      : m.LineaTransporte?.toLowerCase().includes(filtroTransporte.toLowerCase())
                  )
                  .map((m, i) => {
                    const { colorCelda, colorFila } = getColorClase(m)
                    return (
                      <tr key={i} className={`text-center ${colorFila}`}>
                        <td className="border px-2 py-1">{m.ODP || 'No reportado'}</td>
                        <td className="border px-2 py-1">{m.LineaTransporte || 'No reportado'}</td>
                        <td className={`border px-2 py-1 ${colorCelda.citaEntrega}`}>
                          {formatearFecha(m.CitaEntrega)}
                        </td>
                        <td className="border px-2 py-1">{formatearFecha(m.SalidaPlanta)}</td>
                        <td className="border px-2 py-1">{formatearFecha(m.InicioRuta)}</td>
                        <td className="border px-2 py-1">{formatearFecha(m.ETA)}</td>
                        <td className="border px-2 py-1">{m.Status || 'No reportado'}</td>
                        <td className="border px-2 py-1">{m.ComentarioTransito || 'No reportado'}</td>
                      </tr>
                    )
                  })
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-3 text-gray-500">
                    No hay registros para la fecha seleccionada o rango
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="bg-gray-100 text-center py-4 mt-6 border-t shadow-inner">
        <p className="text-gray-700 text-sm md:text-base tracking-wide">
          © {new Date().getFullYear()} Desarrollo y análisis de datos
        </p>
      </footer>
    </>
  )
}
