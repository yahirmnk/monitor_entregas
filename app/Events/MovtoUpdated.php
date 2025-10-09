<?php

namespace App\Events;

use App\Models\Movto;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MovtoUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $movto;

    public function __construct(Movto $movto)
    {
        $this->movto = $movto->load([
            'Delta',
            'Bascula',
            'CasetaSerdan',
            'MonitorAndenes',
            'Anden',
        ]);
    }

    public function broadcastOn()
    {
        return new PrivateChannel('monitor-logistico');
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->movto->IDMovto,
            'ODP' => $this->movto->ODP,
            'CitaDelta' => $this->movto->CitaDelta,
            'LlegadaDelta' => $this->movto->Delta?->LlegadaDelta,
            'SalidaDelta' => $this->movto->Delta?->SalidaDelta,
            'EntradaBascula' => $this->movto->Bascula?->HoraEntradaBascula,
            'NoAnden' => $this->movto->MonitorAndenes?->NoAnden ?? $this->movto->Anden?->NoAnden,
            'LlegadaAnden' => $this->movto->Anden?->HoraLlegada,
            'SalidaPlanta' => $this->movto->Bascula?->HoraSalidaBasEmbarque ?? $this->movto->CasetaSerdan?->HoraSalida,
            'InicioRuta' => $this->movto->FechaProgramacion,
        ];
    }
}
