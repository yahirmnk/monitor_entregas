<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movto;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Vista principal con Inertia.
     */
    public function index(Request $request)
    {
        try {
            $fecha = $request->input('fecha', now()->toDateString());
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes',
                'Anden'
            ])
            
            //ERA PARA LOS CONSOLIDADOS
            //->where(function ($q){
            //    $q->where('es_principal', 1)
            //        ->orWhere(function ($sub) {
            //            $sub->whereNull('es_principal')
            //                ->whereNull('Consolidado');
            //        });
            //});
            ;
            // Filtro por rango o fecha única
            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('CitaCarga', [$fechaInicio, $fechaFin]);
            } else {
                $query->whereDate('CitaCarga', $fecha);
            }

            $query->orderBy('CitaDelta', 'asc');

            // Log para verificar filtros aplicados
            Log::info('Filtro aplicado correctamente', [
                'fecha' => $fecha,
                'fechaInicio' => $fechaInicio,
                'fechaFin' => $fechaFin,
                'totalRegistros' => $query->count(),
            ]);

            // elper para convertir todas las fechas a zona local MExico
            $toLocal = fn($v) => $v
                ? Carbon::parse($v)->setTimezone('America/Mexico_City')->toDateTimeString()
                : null;

            // Mapear resultados
            $movtos = $query->get()->map(function ($movto) use ($toLocal) {
                return [
                    'ODP'            => $movto->ODP,
                    'LineaTransporte' => $movto->LineaTransporte,
                    'CitaDelta'      => $toLocal($movto->CitaDelta),
                    'LlegadaDelta'   => $toLocal($movto->Delta?->LlegadaDelta),
                    'SalidaDelta'    => $toLocal($movto->Delta?->SalidaDelta),
                    'EntradaBascula' => $toLocal($movto->Bascula?->HoraEntradaBascula),
                    'SalidaBascula'  => $toLocal($movto->Bascula?->HoraSalidaBascula),
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null,
                    'LlegadaAnden'   => $toLocal($movto->Anden?->HoraLlegada),
                    'SalidaAnden'    => $toLocal($movto->Anden?->HoraSalida),
                    'SalidaPlanta'   => $toLocal($movto->Bascula?->HoraSalidaBasEmbarque),
                    'InicioRuta'     => $toLocal($movto->FechaProgramacion),
                ];
            });

            // Texto legible de la fecha consultada
            $fechaTexto = $fechaInicio && $fechaFin
                ? "Del " . Carbon::parse($fechaInicio)->locale('es')->translatedFormat('d \\d\\e F') .
                  " al " . Carbon::parse($fechaFin)->locale('es')->translatedFormat('d \\d\\e F Y')
                : ucfirst(Carbon::parse($fecha)->locale('es')->translatedFormat('l d \\d\\e F Y'));

            return Inertia::render('Dashboard', [
                'movtos' => $movtos,
                'fechaSeleccionada' => $fecha,
                'fechaTexto' => $fechaTexto,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en index DashboardController', ['detalle' => $e->getMessage()]);

            return Inertia::render('Dashboard', [
                'movtos' => [],
                'fechaSeleccionada' => now()->toDateString(),
                'fechaTexto' => 'Error al cargar los datos',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Endpoint JSON consumido por React (Dashboard.jsx)
     */
    public function json(Request $request)
    {
        try {
            $fecha = $request->input('fecha', now()->toDateString());
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            $query = Movto::with([
                'Delta',
                'Bascula',
                'CasetaSerdan',
                'MonitorAndenes',
                'Anden',
            ]);

            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('CitaCarga', [$fechaInicio, $fechaFin]);
            } else {
                $query->whereDate('CitaCarga', $fecha);
            }

            $query->orderBy('CitaDelta', 'asc');

            // Helper local
            $toLocal = fn($v) => $v
                ? Carbon::parse($v)->setTimezone('America/Mexico_City')->toDateTimeString()
                : null;

            $datos = $query->get()->map(function ($movto) use ($toLocal) {
                return [
                    'ODP'            => $movto->ODP ?? $movto->Delta?->ODP?? null,
                    'LineaTransporte' => $movto->LineaTransporte,
                    'CitaDelta'      => $toLocal($movto->CitaDelta),
                    'LlegadaDelta'   => $toLocal($movto->Delta?->LlegadaDelta),
                    'SalidaDelta'    => $toLocal($movto->Delta?->SalidaDelta),
                    'EntradaBascula' => $toLocal($movto->Bascula?->HoraEntradaBascula),
                    'SalidaBascula'  => $toLocal($movto->Bascula?->HoraSalidaBascula),
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null,
                    'LlegadaAnden'   => $toLocal($movto->Anden?->HoraLlegada),
                    'SalidaAnden'    => $toLocal($movto->Anden?->SalidaAnden),
                    'SalidaPlanta'   => $toLocal($movto->Bascula?->HoraSalidaBasEmbarque),
                    'InicioRuta'     => $toLocal($movto->FechaProgramacion),
                ];
            });

            $fechaTexto = $fechaInicio && $fechaFin
                ? "Del " . Carbon::parse($fechaInicio)->locale('es')->translatedFormat('d \\d\\e F') .
                  " al " . Carbon::parse($fechaFin)->locale('es')->translatedFormat('d \\d\\e F Y')
                : ucfirst(Carbon::parse($fecha)->locale('es')->translatedFormat('l d \\d\\e F Y'));

            Log::info('Consulta JSON completada correctamente', [
                'rango' => $fechaInicio && $fechaFin ? "$fechaInicio - $fechaFin" : $fecha,
                'totalRegistros' => $datos->count(),
            ]);

            return response()->json([
                'fecha_consultada' => $fechaInicio && $fechaFin ? "$fechaInicio - $fechaFin" : $fecha,
                'fecha_texto' => $fechaTexto,
                'total' => $datos->count(),
                'data' => $datos,
                'sin_datos' => $datos->isEmpty() ? 'No hay registros para la fecha o rango seleccionado' : false,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en json DashboardController', ['detalle' => $e->getMessage()]);

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al consultar los datos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
