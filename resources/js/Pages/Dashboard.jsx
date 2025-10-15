import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes } from 'date-fns'
import * as dateFnsTz from 'date-fns-tz'
import echo from '../echo'

// === CSS de estados dinámicos ===
// NO SE APLICA COLORVERDE SOLO BLANCO
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
`;

// === Inyectar estilos al documento ==
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.innerHTML = estilos
  document.head.appendChild(styleTag)
}

// == Función de formato de fecha ===
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

// === Lógica de colores y tiempos =
const getColorClase = (movto) => {
  const zona = 'America/Mexico_City'
  let ahora

  try {
    ahora = dateFnsTz.utcToZonedTime(new Date(), zona)
  } catch {
    ahora = new Date()
  }

  const citaDelta = movto.CitaDelta ? parseISO(movto.CitaDelta) : null
  const llegadaDelta = movto.LlegadaDelta ? parseISO(movto.LlegadaDelta) : null
  const salidaDelta = movto.SalidaDelta ? parseISO(movto.SalidaDelta) : null
  const entradaBascula = movto.EntradaBascula ? parseISO(movto.EntradaBascula) : null
  const salidaBascula = movto.SalidaBascula ? parseISO(movto.SalidaBascula) : null
  const llegadaAnden = movto.LlegadaAnden ? parseISO(movto.LlegadaAnden) : null
  const salidaAnden = movto.SalidaAnden ? parseISO(movto.SalidaAnden) : null
  const salidaPlanta = movto.SalidaPlanta ? parseISO(movto.SalidaPlanta) : null
  const inicioRuta = movto.InicioRuta ? parseISO(movto.InicioRuta) : null

  const colorCelda = {
    llegadaDelta: '',
    salidaDelta: '',
    entradaBascula: '',
    salidaBascula: '',
    llegadaAnden: '',
    salidaAnden: '',
    inicioRuta: '',
    salidaPlanta: ''
  }

  let colorFila = ''

  // === 1. CitaDelta → LlegadaDelta ===
  if (citaDelta && !llegadaDelta) {
    const diff = differenceInMinutes(citaDelta, ahora)
    if (diff <= 120 && diff > 60) colorCelda.llegadaDelta = 'estado-naranja' // -2h
    else if (diff <= 60 && diff >= 0) colorCelda.llegadaDelta = 'estado-rojo' // -1h
  } else if (llegadaDelta) {
    colorCelda.llegadaDelta = 'estado-verde'
  }

  // === 2. LlegadaDelta → SalidaDelta (Estancia 4h) ===
  if (llegadaDelta && !salidaDelta) {
    const diff = differenceInMinutes(ahora, llegadaDelta)
    if (diff >= 120 && diff < 180) colorCelda.salidaDelta = 'estado-naranja' // 2–3h
    else if (diff >= 180) colorCelda.salidaDelta = 'estado-rojo' // +3h
  } else if (salidaDelta) {
    colorCelda.salidaDelta = 'estado-verde'
  }

  // === 3. SalidaDelta → EntradaBascula (Estancia 20 min) ===
  if (salidaDelta && !entradaBascula) {
    const diff = differenceInMinutes(ahora, salidaDelta)
    if (diff >= 10 && diff < 20) colorCelda.entradaBascula = 'estado-naranja'
    else if (diff >= 20) colorCelda.entradaBascula = 'estado-rojo'
  } else if (entradaBascula) {
    colorCelda.entradaBascula = 'estado-verde'
  }

  // === 4. EntradaBascula → SalidaBascula (Estancia 20 min) ===
  if (entradaBascula && !salidaBascula) {
    const diff = differenceInMinutes(ahora, entradaBascula)
    if (diff >= 10) colorCelda.salidaBascula = 'estado-rojo'
  } else if (salidaBascula) {
    colorCelda.salidaBascula = 'estado-verde'
  }

  // === 5. LlegadaAnden → SalidaAnden (Estancia 2h) ===
  if (llegadaAnden && !salidaAnden) {
    const diff = differenceInMinutes(ahora, llegadaAnden)
    if (diff >= 60) colorCelda.salidaAnden = 'estado-rojo'
  } else if (salidaAnden) {
    colorCelda.salidaAnden = 'estado-verde'
  }

  // === 6. SalidaPlanta → InicioRuta (2h antes) ==
  if (salidaPlanta && !inicioRuta) {
    const diff = differenceInMinutes(ahora, salidaPlanta)
    if (diff >= 0 && diff < 60) colorFila = 'estado-naranja'
    else if (diff >= 60) colorFila = 'estado-rojo'
  } else if (inicioRuta) {
    colorCelda.inicioRuta = 'estado-verde'
  }

  return { colorCelda, colorFila }
}

// === COMPONENTE PRINCIPAL ===
export default function Dashboard() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [movtos, setMovtos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const INTERVALO_ACTUALIZACION = 60000 // 1 minuto

  // == Carga inicial y autoactualización ===
  useEffect(() => {
    obtenerDatos()
    const timer = setInterval(obtenerDatos, INTERVALO_ACTUALIZACION)
    return () => clearInterval(timer)
  }, [fechaSeleccionada, fechaInicio, fechaFin])

  // === Escucha en tiempo real ==
  useEffect(() => {
    const channel = echo.private('monitor-logistico')
    channel.listen('MovtoUpdated', (evento) => {
      setMovtos((prev) =>
        prev.map((m) => (m.ODP === evento.ODP ? { ...m, ...evento } : m))
      )
    })
    return () => echo.leave('monitor-logistico')
  }, [])

  // == Función de carga de datos 
  const obtenerDatos = async () => {
    try {
      let url = '/api/monitor/json'
      if (fechaInicio && fechaFin) url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      else url += `?fecha=${fechaSeleccionada || new Date().toISOString().split('T')[0]}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const data = await res.json()
      setMovtos(data?.data || [])
      setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
    } catch {
      setMovtos([])
    }
  }

  //  Render principal 
  return (
    <>
      <Head title="Almacen" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MONITOR TRÁFICO</h1>

        {/* Filtros de fecha */}
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label className="block text-sm font-medium">Fecha única</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                setFechaSeleccionada(e.target.value)
                setFechaInicio('')
                setFechaFin('')
              }}
              className="border rounded px-2 py-1"
            />
          </div>
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

          <button
            onClick={obtenerDatos}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            Filtrar
          </button>

          <div className="text-sm text-gray-600 italic">
            Última actualización: {ultimaActualizacion || '---'}
          </div>
        </div>

        {/* Tabla principal */}
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">ODP</th>
              <th className="border px-2 py-1">Cita Delta</th>
              <th className="border px-2 py-1">Llegada Delta</th>
              <th className="border px-2 py-1">Salida Delta</th>
              <th className="border px-2 py-1">Entrada Báscula</th>
              <th className="border px-2 py-1">Salida Báscula</th>
              <th className="border px-2 py-1">No. Andén</th>
              <th className="border px-2 py-1">Llegada Andén</th>
              <th className="border px-2 py-1">Salida Andén</th>
              <th className="border px-2 py-1">Salida Planta</th>
              <th className="border px-2 py-1">Inicio Ruta</th>
            </tr>
          </thead>
          <tbody>
            {movtos.length > 0 ? (
              movtos
                .filter((m) => !m.SalidaPlanta)
                .map((m, i) => {
                  const { colorCelda, colorFila } = getColorClase(m)
                  return (
                    <tr key={i} className={`text-center ${colorFila}`}>
                      <td className="border px-2 py-1">{m.ODP || 'No reportado'}</td>
                      <td className="border px-2 py-1">{formatearFecha(m.CitaDelta)}</td>
                      <td className={`border px-2 py-1 ${colorCelda.llegadaDelta}`}>
                        {formatearFecha(m.LlegadaDelta)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.salidaDelta}`}>
                        {formatearFecha(m.SalidaDelta)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.entradaBascula}`}>
                        {formatearFecha(m.EntradaBascula)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.salidaBascula}`}>
                        {formatearFecha(m.SalidaBascula)}
                      </td>
                      <td className="border px-2 py-1">{m.NoAnden || 'No reportado'}</td>
                      <td className={`border px-2 py-1 ${colorCelda.llegadaAnden}`}>
                        {formatearFecha(m.LlegadaAnden)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.salidaAnden}`}>
                        {formatearFecha(m.SalidaAnden)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.salidaPlanta}`}>
                        {formatearFecha(m.SalidaPlanta)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.inicioRuta}`}>
                        {formatearFecha(m.InicioRuta)}
                      </td>
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
    </>
  )
}
