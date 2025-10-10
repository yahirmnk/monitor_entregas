import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes, differenceInHours } from 'date-fns'
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
.rojo-fijo {
  background-color: #991b1b;
  color: white;
}
`;


// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.innerHTML = estilos
  document.head.appendChild(styleTag)
}

// FUNCIONES 

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

// LÓGICA DE COLORES 
const getColorClase = (movto) => {
  const zona = 'America/Mexico_City'

  // Obtener hora actual ajustada a México
  let ahora
  try {
    if (dateFnsTz && typeof dateFnsTz.utcToZonedTime === 'function') {
      ahora = dateFnsTz.utcToZonedTime(new Date(), zona)
    } else {
      ahora = new Date(new Date().toLocaleString('en-US', { timeZone: zona }))
    }
  } catch (err) {
    console.warn('Error al ajustar zona horaria, usando hora local:', err)
    ahora = new Date()
  }

  const citaDelta = movto.CitaDelta ? parseISO(movto.CitaDelta) : null
  const llegadaDelta = movto.LlegadaDelta ? parseISO(movto.LlegadaDelta) : null
  const entradaBascula = movto.EntradaBascula ? parseISO(movto.EntradaBascula) : null
  const llegadaAnden = movto.LlegadaAnden ? parseISO(movto.LlegadaAnden) : null
  const inicioRuta = movto.InicioRuta ? parseISO(movto.InicioRuta) : null
  const salidaPlanta = movto.SalidaPlanta ? parseISO(movto.SalidaPlanta) : null

  let clase = ''

  // 1. CITA DELTA vs LLEGADA DELTA
  // Si aún no llega, se compara hora actual con la cita
  if (citaDelta && !llegadaDelta) {
    const diff = differenceInMinutes(ahora, citaDelta)

    // Falta más de 1h
    if (diff < -60) clase = ''
    // Falta menos de 1h
    else if (diff >= -60 && diff < 0) clase = 'estado-naranja'
    // Ya pasó la hora, hasta 2h
    else if (diff >= 0 && diff < 120) clase = 'estado-rojo'
    // Más de 2h de retraso
    else if (diff >= 120) clase = 'rojo-fijo'

    // Si lleva más de 30 min en rojo → fijo
    if (clase === 'estado-rojo' && diff >= 150) clase = 'rojo-fijo'
  }
  // Si ya llegó, comparar cita y llegada
  else if (citaDelta && llegadaDelta) {
    const diffLlegada = differenceInMinutes(llegadaDelta, citaDelta)
    if (diffLlegada <= 0) clase = 'estado-verde'
    else if (diffLlegada > 120) clase = 'rojo-fijo'
    else if (diffLlegada > 60) clase = 'estado-naranja'
  }

  // 2. ENTRADA BÁSCULA vs LLEGADA ANDÉN
  // Si hay entrada a báscula y no ha llegado al andén:
  if (entradaBascula && !llegadaAnden) {
    const minutos = differenceInMinutes(ahora, entradaBascula)
    if (minutos < 20) clase = 'estado-naranja'
    else if (minutos >= 20 && minutos < 50) clase = 'estado-rojo'
    else if (minutos >= 50) clase = 'rojo-fijo'
  }

  // 3. INICIO RUTA vs SALIDA PLANTA
  // Si hay inicio ruta y no salida:
  if (inicioRuta) {
    const diffInicio = differenceInMinutes(ahora, inicioRuta)

    if (!salidaPlanta) {
      if (diffInicio < -60) clase = ''
      else if (diffInicio >= -60 && diffInicio < 0) clase = 'estado-naranja'
      else if (diffInicio >= 0 && diffInicio < 120) clase = 'estado-rojo'
      else if (diffInicio >= 120) clase = 'rojo-fijo'
    } else {
      const diffSalida = differenceInMinutes(salidaPlanta, inicioRuta)
      if (diffSalida <= 0) clase = 'estado-verde'
      else if (diffSalida > 0 && diffSalida <= 60) clase = 'estado-naranja'
      else if (diffSalida > 60) clase = 'rojo-fijo'
    }
  }

  return clase
}

// COMPONENTE PRINCIPAL 
export default function Dashboard() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const [movtos, setMovtos] = useState([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  //const INTERVALO_ACTUALIZACION = 300000 // 5 minutos
  //const INTERVALO_ACTUALIZACION = 180000 //3 minutos
  const INTERVALO_ACTUALIZACION = 60000 // 1 minuto 

  useEffect(() => {
    console.log('Componente montado. Fecha seleccionada:', fechaSeleccionada)
    obtenerDatos(fechaSeleccionada)

    const timer = setInterval(() => {
      console.log('Actualizando datos automáticamente...')
      obtenerDatos(fechaSeleccionada)
    }, INTERVALO_ACTUALIZACION)

    return () => {
      console.log('Componente desmontado o fecha cambiada, limpiando intervalo.')
      clearInterval(timer)
    }
  }, [fechaSeleccionada])

   // ECHO
  useEffect(() => {
    console.log('Escuchando canal privado: monitor-logistico...')

    const channel = echo.private('monitor-logistico')

    channel.listen('MovtoUpdated', (evento) => {
      console.log('Evento recibido:', evento)
      setMovtos((prev) =>
        prev.map((m) =>
          m.ODP === evento.ODP ? { ...m, ...evento } : m
        )
      )
    })

    return () => {
      echo.leave('monitor-logistico')
      console.log('Canal cerrado')
    }
  }, [])

  const obtenerDatos = async (fecha) => {
    try {
      console.log('Solicitando datos del backend para la fecha:', fecha)
      const res = await fetch(`/api/monitor/json?fecha=${fecha}`)
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)

      const data = await res.json()
      if (data && Array.isArray(data.data)) {
        console.log('Datos recibidos:', data.data.length, 'registros')
        setMovtos(data.data)
      } else {
        console.warn('Formato inesperado:', data)
        setMovtos([])
      }

      setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
      console.log('Actualización completada:', new Date().toLocaleTimeString('es-MX'))
    } catch (err) {
      console.error('Error al obtener datos:', err)
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
              onChange={(e) => {
                console.log('Fecha seleccionada manualmente:', e.target.value)
                setFechaSeleccionada(e.target.value)
              }}
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
                    <td className="border px-2 py-1">{m.ODP || 'No reportado'}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.CitaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.LlegadaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.SalidaDelta)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.EntradaBascula)}</td>
                    <td className="border px-2 py-1">{m.NoAnden || 'No reportado'}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.LlegadaAnden)}</td>
                    <td className="border px-2 py-1">{formatearFecha(m.SalidaPlanta)}</td>
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
