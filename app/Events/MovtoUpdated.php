<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use App\Models\Movtos;

class MovtoUpdated implements ShouldBroadcast
{
    use SerializesModels;

    public $movtoData;

    public function __construct(Movtos $movto)
    {
        // Incluimos relaciones para enviarlas al front
        $this->movtoData = $movto->load(['delta', 'caseta', 'bascula', 'monitorAnden.anden']);
    }

    public function broadcastOn(): Channel
    {
        return new Channel('movtos-channel');
    }

    public function broadcastAs(): string
    {
        return 'movto.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'movto' => [
                'ODP' => $this->movtoData->ODP,
                'CitaAnden' => $this->movtoData->CitaAnden,
                'CitaDelta' => $this->movtoData->CitaDelta,
                'SalidaDelta' => $this->movtoData->delta->SalidaDelta ?? null,
                'LlegadaDelta' => $this->movtoData->delta->LlegadaDelta ?? null,
                'HoraSalida' => $this->movtoData->caseta->HoraSalida ?? null,
                'HoraEntradaBascula' => $this->movtoData->bascula->HoraEntradaBascula ?? null,
                'NoAnden' => $this->movtoData->monitorAnden->NoAnden ?? $this->movtoData->monitorAnden->anden->NoAnden ?? null,
            ]
        ];
    }
}
