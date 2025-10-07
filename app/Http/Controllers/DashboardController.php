<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movto;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard principal (vista con Inertia).
     */
    public function index(Request $request)
    {
        try {
            // Fecha actual o seleccionada desde el filtro
            $fecha = $request->input('fecha', now()->toDateString());

            // Consulta principal con relaciones reales del proyecto
            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes.Anden'
            ])->whereDate('FechaRegistro', $fecha);

            $movtos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP,
                    'CitaDelta'      => $movto->CitaDelta ?? null,
                    'LlegadaDelta'   => $movto->Delta->LlegadaDelta ?? null,
                    'SalidaDelta'    => $movto->Delta->SalidaDelta ?? null,
                    'EntradaBascula' => $movto->Bascula->HoraEntradaBascula ?? null,
                    'NoAnden'        => $movto->MonitorAndenes->NoAnden ?? $movto->MonitorAndenes->Anden->NoAnden ?? null,
                    'LlegadaAnden'   => $movto->MonitorAndenes->Anden->LlegadaAnden ?? null,
                    'SalidaPlanta'   => $movto->Bascula->HoraSalidaBascula ?? null, 
                    //'SalidaPlanta'   => $movto->CasetaSerdan->HoraSalida ?? null,
                    'InicioRuta'     => $movto->MonitorAndenes->Anden->HoraSalida ?? null,
                ];
            });

            $fechaTexto = ucfirst(Carbon::parse($fecha)->locale('es')->translatedFormat('l d \\d\\e F Y'));

            return Inertia::render('Dashboard', [
                'movtos' => $movtos,
                'fechaSeleccionada' => $fecha,
                'fechaTexto' => $fechaTexto,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('Dashboard', [
                'movtos' => [],
                'fechaSeleccionada' => now()->toDateString(),
                'fechaTexto' => 'Error al cargar los datos',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Endpoint API en formato JSON limpio (para pruebas o conexión React).
     */
    public function json(Request $request)
    {
        try {
            $fecha = $request->input('fecha', now()->toDateString());

            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes.Anden'
            ])->whereDate('FechaRegistro', $fecha);

            $datos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP,
                    'CitaDelta'      => $movto->CitaDelta ?? null,
                    'LlegadaDelta'   => $movto->Delta->LlegadaDelta ?? null,
                    'SalidaDelta'    => $movto->Delta->SalidaDelta ?? null,
                    'EntradaBascula' => $movto->Bascula->HoraEntradaBascula ?? null,
                    'NoAnden'        => $movto->MonitorAndenes->NoAnden ?? $movto->MonitorAndenes->Anden->NoAnden ?? null,
                    'LlegadaAnden'   => $movto->MonitorAndenes->Anden->HoraLlegada ?? null,
                    'SalidaPlanta'   => $movto->CasetaSerdan->HoraSalida ?? null,
                    'InicioRuta'     => $movto->MonitorAndenes->Anden->HoraSalida ?? null,
                ];
            });

            return response()->json([
                'fecha_consultada' => $fecha,
                'fecha_texto' => ucfirst(Carbon::parse($fecha)->locale('es')->translatedFormat('l d \\d\\e F Y')),
                'total' => $datos->count(),
                'data' => $datos,
                'sin_datos' => $datos->isEmpty() ? 'No hay registros para la fecha seleccionada' : false,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al consultar los datos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
