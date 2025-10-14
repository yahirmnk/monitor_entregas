<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movto;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
//use App\Events\MovtoUpdated;

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
            ->where(function ($q){
                $q->where('es_principal', 1)
                    ->orWhere(function ($sub) {
                        $sub->whereNull('es_principal')
                            ->whereNull('Consolidado');
                    });
            });

            // Aplicar filtro por rango o por fecha única
            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('CitaCarga', [$fechaInicio, $fechaFin]);
            } else {
                $query->whereDate('CitaCarga', $fecha);
            }
            Log::info('Filtro aplicado de forma correcta',[
                'fecha' => $fecha,
                'fechaInicio' => $fechaInicio,
                'fechaFin' => $fechaFin,
                'totalMovtos' => $query->count(),
            ]);
            $movtos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP, //ODP
                    'CitaDelta'      => $movto->CitaDelta ?? null, //Cita Delta
                    'LlegadaDelta'   => $movto->Delta?->LlegadaDelta ?? null, //Llegada Delta
                    'SalidaDelta'    => $movto->Delta?->SalidaDelta ?? null, // Salida Delta
                    'EntradaBascula' => $movto->Bascula?->HoraEntradaBascula ?? null, // Entrada Báscula
                    'SalidaBascula'  => $movto->Bascula?->HorsaSalidaBascula ?? null, // Salida Báscula 
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null, //No. Andén
                    'LlegadaAnden'   => $movto->Anden?->HoraLlegada ?? null, //Llegada Andén 
                    'SalidaAnden'    => $movto->Anden?->SalidaAnden ?? null, //Salida Andén
                    'SalidaPlanta'   => $movto->Bascula?->HoraSalidaBascula ?? $movto->CasetaSerdan?->HoraSalida ?? null, //Salida Planta
                    'InicioRuta'     => $movto->Bascula?->HoraSalidaBasEmbarque ?? null, // Inicio Ruta
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

            // Filtro por rango o fecha única
            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('CitaCarga', [$fechaInicio, $fechaFin]);
            } else {
                $query->whereDate('CitaCarga', $fecha);
            }

            $datos = $query->get()->map(function ($movto) {
                return [
                    'ODP'            => $movto->ODP, //ODP
                    'CitaDelta'      => $movto->CitaDelta ?? null, //Cita Delta
                    'LlegadaDelta'   => $movto->Delta?->LlegadaDelta ?? null, //Llegada Delta
                    'SalidaDelta'    => $movto->Delta?->SalidaDelta ?? null, // Salida Delta
                    'EntradaBascula' => $movto->Bascula?->HoraEntradaBascula ?? null, // Entrada Báscula
                    'SalidaBascula'  => $movto->Bascula?->HorsaSalidaBascula ?? null, // Salida Báscula 
                    'NoAnden'        => $movto->MonitorAndenes?->NoAnden ?? $movto->Anden?->NoAnden ?? null, //No. Andén
                    'LlegadaAnden'   => $movto->Anden?->HoraLlegada ?? null, //Llegada Andén 
                    'SalidaAnden'    => $movto->Anden?->SalidaAnden ?? null, //Salida Andén
                    'SalidaPlanta'   => $movto->Bascula?->HoraSalidaBascula ?? $movto->CasetaSerdan?->HoraSalida ?? null, //Salida Planta
                    'InicioRuta'     => $movto->Bascula?->HoraSalidaBasEmbarque ?? null, // Inicio Ruta
                ];
            });

            $fechaTexto = $fechaInicio && $fechaFin
                ? "Del " . Carbon::parse($fechaInicio)->locale('es')->translatedFormat('d \\d\\e F') .
                  " al " . Carbon::parse($fechaFin)->locale('es')->translatedFormat('d \\d\\e F Y')
                : ucfirst(Carbon::parse($fecha)->locale('es')->translatedFormat('l d \\d\\e F Y'));

            return response()->json([
                'fecha_consultada' => $fechaInicio && $fechaFin ? "$fechaInicio - $fechaFin" : $fecha,
                'fecha_texto' => $fechaTexto,
                'total' => $datos->count(),
                'data' => $datos,
                'sin_datos' => $datos->isEmpty() ? 'No hay registros para la fecha o rango seleccionado' : false,
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
