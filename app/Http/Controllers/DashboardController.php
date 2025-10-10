<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movto;
use Carbon\Carbon;
use Inertia\Inertia;

//use App\Events\MovtoUpdated;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard prinncipal.
     */
    public function index(Request $request)
    {
        try {
            $fecha = $request->input('fecha', now()->toDateString());

            
            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes',
                'Anden'
            ])->whereDate('CitaCarga', $fecha);

            $movtos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP,
                    'CitaDelta'      => $movto->CitaDelta ?? null,
                    'LlegadaDelta'   => $movto->Delta?->LlegadaDelta ?? null,
                    'SalidaDelta'    => $movto->Delta?->SalidaDelta ?? null,
                    'EntradaBascula' => $movto->Bascula?->HoraEntradaBascula ?? null,
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null,
                    'LlegadaAnden'   => $movto->Anden?->HoraLlegada ?? null,
                    'SalidaPlanta'   => $movto->Bascula?->HoraSalidaBascula?? $movto->CasetaSerdan?->HoraSalida ?? null,
                    'InicioRuta'     => $movto->Bascula?->HoraSalidaBasEmbarque ?? null,
                ];
            });

            $fechaTexto = ucfirst(
                Carbon::parse($fecha)
                    ->locale('es')
                    ->translatedFormat('l d \\d\\e F Y')
            );

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

    //JSON limpio (para pruebas o conexión React).

    public function json(Request $request)
    {
        try {
            $fecha = $request->input('fecha', now()->toDateString());

            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes',
                'Anden',
            ])->whereDate('CitaCarga', $fecha);

            $datos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP,
                    'CitaDelta'      => $movto->CitaDelta ?? null,
                    'LlegadaDelta'   => $movto->Delta?->LlegadaDelta ?? null,
                    'SalidaDelta'    => $movto->Delta?->SalidaDelta ?? null,
                    'EntradaBascula' => $movto->Bascula?->HoraEntradaBascula ?? null,
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null,
                    'LlegadaAnden'   => $movto->Anden?->HoraLlegada ?? null,
                    'SalidaPlanta'   => $movto->Bascula?->HoraSalidaBasEmbarque ?? null,
                    'InicioRuta'     => $movto->FechaProgramacion ?? null,
                ];
            });

            return response()->json([
                'fecha_consultada' => $fecha,
                'fecha_texto' => ucfirst(
                    Carbon::parse($fecha)
                        ->locale('es')
                        ->translatedFormat('l d \\d\\e F Y')
                ),
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
