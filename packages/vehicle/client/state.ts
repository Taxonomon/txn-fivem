class VehicleStateTick {
  stats?: number;
}

class ClientVehicleState {
  currentVehicleRef?: number;
  speedMetersPerSecond?: number;
  speedUnit: 'kmh' | 'mph' = 'kmh';
  ticks: VehicleStateTick = new VehicleStateTick();
}

export const clientVehicleState = new ClientVehicleState();
