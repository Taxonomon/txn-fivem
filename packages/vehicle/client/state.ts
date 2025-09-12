class VehicleStateTick {
  stats?: number;
}

export class ClientVehicleState {
  currentVehicleRef?: number;
  speedMetersPerSecond?: number;
  speedUnit: 'kmh' | 'mph' = 'kmh';
  ticks: VehicleStateTick = new VehicleStateTick();
}

export const clientVehicleState = new ClientVehicleState();
