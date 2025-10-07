<?php

namespace App\Http\Controllers;

use App\Models\Movtos;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $fecha = $request->query('fecha', now()->toDateString());

        $movtos = Movtos::with(['delta', 'caseta', 'bascula', 'monitorAnden.anden'])
            ->whereDate('CitaAnden', $fecha)
            ->get()
            ->map(function ($m) {
                return [
                    'ODP' => $m->ODP,
                    'CitaAnden' => $m->CitaAnden,
                    'CitaDelta' => $m->CitaDelta,
                    'SalidaDelta' => $m->delta->SalidaDelta ?? null,
                    'LlegadaDelta' => $m->delta->LlegadaDelta ?? null,
                    'HoraSalida' => $m->caseta->HoraSalida ?? null,
                    'HoraEntradaBascula' => $m->bascula->HoraEntradaBascula ?? null,
                    'NoAnden' => $m->monitorAnden->NoAnden ?? $m->monitorAnden->anden->NoAnden ?? null,
                ];
            });

        return Inertia::render('Dashboard', [
            'movtos' => $movtos,
            'fechaSeleccionada' => $fecha,
        ]);
    }

    public function filtrar(Request $request)
    {
        $fecha = $request->query('fecha', now()->toDateString());

        $movtos = Movtos::with(['delta', 'caseta', 'bascula', 'monitorAnden.anden'])
            ->whereDate('CitaAnden', $fecha)
            ->get()
            ->map(function ($m) {
                return [
                    'ODP' => $m->ODP,
                    'CitaAnden' => $m->CitaAnden,
                    'CitaDelta' => $m->CitaDelta,
                    'SalidaDelta' => $m->delta->SalidaDelta ?? null,
                    'LlegadaDelta' => $m->delta->LlegadaDelta ?? null,
                    'HoraSalida' => $m->caseta->HoraSalida ?? null,
                    'HoraEntradaBascula' => $m->bascula->HoraEntradaBascula ?? null,
                    'NoAnden' => $m->monitorAnden->NoAnden ?? $m->monitorAnden->anden->NoAnden ?? null,
                ];
            });

        return response()->json($movtos);
    }
}
