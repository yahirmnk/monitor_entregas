import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes } from 'date-fns'
import * as dateFnsTz from 'date-fns-tz'
import echo from '../echo'

// CSS 
const estilos = `
@keyframes blink {
  50% { opacity: 0.4; }
}
.estado-verde {
  background-color: #16a34a;
  color: white;
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

// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.innerHTML = estilos
  document.head.appendChild(styleTag)
}

// Formatear fecha a dd/mm/yyyy HH:mm:ss
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

// Lógica de colores (versión final)
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
  const entradaBascula = movto.EntradaBascula ? parseISO(movto.EntradaBascula) : null
  const llegadaAnden = movto.LlegadaAnden ? parseISO(movto.LlegadaAnden) : null
  const inicioRuta = movto.InicioRuta ? parseISO(movto.InicioRuta) : null
  const salidaPlanta = movto.SalidaPlanta ? parseISO(movto.SalidaPlanta) : null

  // Colores separados por celda
  const colorCelda = {
    llegadaDelta: '',
    llegadaAnden: '',
    salidaPlanta: ''
  }
  let colorFila = ''

  // CitaDelta → LlegadaDelta
  if (citaDelta && !llegadaDelta) {
    const diff = differenceInMinutes(ahora, citaDelta)
    if (diff >= -60 && diff < 0) colorCelda.llegadaDelta = 'estado-naranja'
    else if (diff >= 0) colorCelda.llegadaDelta = 'estado-rojo'
  } else if (llegadaDelta) {
    colorCelda.llegadaDelta = 'estado-verde'
  }

  // EntradaBascula → LlegadaAnden
  if (entradaBascula && !llegadaAnden) {
    const diff = differenceInMinutes(ahora, entradaBascula)
    if (diff < 20) colorCelda.llegadaAnden = 'estado-naranja'
    else if (diff >= 20) colorCelda.llegadaAnden = 'estado-rojo'
  } else if (llegadaAnden) {
    colorCelda.llegadaAnden = 'estado-verde'
  }

  // InicioRuta → SalidaPlanta
  if (inicioRuta && !salidaPlanta) {
    const diff = differenceInMinutes(ahora, inicioRuta)

    // 1 hora antes hasta 2 horas después → naranja solo la celda
    if (diff >= -60 && diff < 60) {
      colorCelda.salidaPlanta = 'estado-naranja'
    }

    // A partir de 2 horas después → toda la fila roja parpadeante
    if (diff >= 60) {
      colorFila = 'estado-rojo'
    }
  }


  return { colorCelda, colorFila }
}

// COMPONENTE PRINCIPAL 
export default function Dashboard() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const [movtos, setMovtos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const INTERVALO_ACTUALIZACION = 60000 // 1 minuto 

  useEffect(() => {
    obtenerDatos(fechaSeleccionada)
    const timer = setInterval(() => obtenerDatos(fechaSeleccionada), INTERVALO_ACTUALIZACION)
    return () => clearInterval(timer)
  }, [fechaSeleccionada])

  // Escucha de eventos en tiempo real
  useEffect(() => {
    const channel = echo.private('monitor-logistico')
    channel.listen('MovtoUpdated', (evento) => {
      setMovtos((prev) => prev.map((m) => (m.ODP === evento.ODP ? { ...m, ...evento } : m)))
    })
    return () => echo.leave('monitor-logistico')
  }, [])

  const obtenerDatos = async (fecha) => {
    try {
      const res = await fetch(`/api/monitor/json?fecha=${fecha}`)
      const data = await res.json()
      if (data && Array.isArray(data.data)) setMovtos(data.data)
      setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
    } catch {
      setMovtos([])
    }
  }

  return (
    <>
      <Head title="Almacen" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MONITOR TRÁFICO</h1>

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
                      <td className="border px-2 py-1">{formatearFecha(m.SalidaDelta)}</td>
                      <td className="border px-2 py-1">{formatearFecha(m.EntradaBascula)}</td>
                      <td className="border px-2 py-1">{m.NoAnden || 'No reportado'}</td>
                      <td className={`border px-2 py-1 ${colorCelda.llegadaAnden}`}>
                        {formatearFecha(m.LlegadaAnden)}
                      </td>
                      <td className={`border px-2 py-1 ${colorCelda.salidaPlanta}`}>
                        {formatearFecha(m.SalidaPlanta)}
                      </td>
                      <td className="border px-2 py-1">{formatearFecha(m.InicioRuta)}</td>
                    </tr>
                  )
                })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-3 text-gray-500">
                  No hay registros para la fecha seleccionada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
