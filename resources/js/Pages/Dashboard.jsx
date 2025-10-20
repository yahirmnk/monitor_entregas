import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { parseISO, differenceInMinutes } from 'date-fns'
import * as dateFnsTz from 'date-fns-tz'
import echo from '../echo'

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
  //CONDICIONES
  {/* 
  if (citaDelta && !llegadaDelta) {
    const diff = differenceInMinutes(citaDelta, ahora)
    if (diff <= 120 && diff > 60) colorCelda.llegadaDelta = 'estado-naranja'
    else if (diff <= 60) colorCelda.llegadaDelta = 'estado-rojo'
  } else if (llegadaDelta) {
    colorCelda.llegadaDelta = 'estado-verde'
  }

  if (llegadaDelta && !salidaDelta) {
    const diff = differenceInMinutes(ahora, llegadaDelta)
    if (diff >= 120 && diff < 180) colorCelda.salidaDelta = 'estado-naranja'
    else if (diff >= 180) colorCelda.salidaDelta = 'estado-rojo'
  } else if (salidaDelta) {
    colorCelda.salidaDelta = 'estado-verde'
  }

  if (salidaDelta && !entradaBascula) {
    const diff = differenceInMinutes(ahora, salidaDelta)
    if (diff >= 10 && diff < 20) colorCelda.entradaBascula = 'estado-naranja'
    else if (diff >= 20) colorCelda.entradaBascula = 'estado-rojo'
  } else if (entradaBascula) {
    colorCelda.entradaBascula = 'estado-verde'
  }

  if (entradaBascula && !salidaBascula) {
    const diff = differenceInMinutes(ahora, entradaBascula)
    if (diff >= 10) colorCelda.salidaBascula = 'estado-rojo'
  } else if (salidaBascula) {
    colorCelda.salidaBascula = 'estado-verde'
  }

  if (llegadaAnden && !salidaAnden) {
    const diff = differenceInMinutes(ahora, llegadaAnden)
    if (diff >= 60) colorCelda.salidaAnden = 'estado-rojo'
  } else if (salidaAnden) {
    colorCelda.salidaAnden = 'estado-verde'
  }

  if (inicioRuta && !salidaPlanta) {
    const diff = differenceInMinutes(inicioRuta, ahora)
    if (diff <= 120 && diff > 60) colorFila = 'estado-naranja'
    else if (diff <= 60) colorFila = 'estado-rojo'
  } else if (salidaPlanta) {
    
  }
  */}
  return { colorCelda, colorFila }
}

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
      // Descomentar para volver a activar filtros de rango de fechas
      if (fechaInicio && fechaFin) url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      else 
      url += `?fecha=${fechaSeleccionada || new Date().toISOString().split('T')[0]}`

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
        <h1 className="text-3xl font-bold mb-4 text-center">MONITOR DE ENTREGAS PASTEURIZADORA MAULEC SAPI DE CV</h1>

        <div className="flex flex-wrap gap-4 items-center mb-4 justify-center">
          {/* Campo de Fecha Única commentado
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
          */}

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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Filtrar
          </button>

          <div className="text-sm text-gray-600 italic">
            Última actualización: {ultimaActualizacion || '---'}
          </div>
          {/*Botón de cerrar sesión */}
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
            <button type="submit"
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">
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
                  // .filter((m) => !m.SalidaPlanta) //MANTENER DESACTIVADA YA QUE OMITE REGISTROS
                  // .filter((m) => m.CitaDelta)
                  .map((m, i) => {
                    const { colorCelda, colorFila } = getColorClase(m)
                    return (
                      <tr key={i} className={`text-center ${colorFila}`}>
                        <td className="border px-2 py-1">{m.ODP || 'No reportado'}</td>
                        <td className="border px-2 py-1">{m.LineaTransporte || 'No reportado'}</td>
                        <td className="border px-2 py-1">{formatearFecha(m.CitaEntrega)}</td>
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
