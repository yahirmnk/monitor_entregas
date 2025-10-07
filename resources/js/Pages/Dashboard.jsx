import { useEffect, useState } from 'react'
import { Head, usePage } from '@inertiajs/react'

export default function Dashboard() {
  const { movtos, fechaSeleccionada } = usePage().props
  const [data, setData] = useState(movtos)
  const [fecha, setFecha] = useState(fechaSeleccionada)

  const handleFiltro = async () => {
    try {
      const res = await fetch(`/api/filtrar?fecha=${fecha}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error al filtrar', error)
    }
  }

  return (
    <>
      <Head title="Dashboard Logístico" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard Logístico</h1>

          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <button
              onClick={handleFiltro}
              className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
            >
              Filtrar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">ODP</th>
                <th className="p-2">Cita Anden</th>
                <th className="p-2">Cita Delta</th>
                <th className="p-2">Salida Delta</th>
                <th className="p-2">Llegada Delta</th>
                <th className="p-2">Hora Salida</th>
                <th className="p-2">Entrada Báscula</th>
                <th className="p-2">No. Andén</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">{r.ODP}</td>
                    <td className="p-2">{r.CitaAnden}</td>
                    <td className="p-2">{r.CitaDelta}</td>
                    <td className="p-2">{r.SalidaDelta || '-'}</td>
                    <td className="p-2">{r.LlegadaDelta || '-'}</td>
                    <td className="p-2">{r.HoraSalida || '-'}</td>
                    <td className="p-2">{r.HoraEntradaBascula || '-'}</td>
                    <td className="p-2 text-center">{r.NoAnden || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-3 text-center text-gray-500">
                    No hay registros para esta fecha
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
