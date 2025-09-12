const UI_EVENTS = {
  HUD: {
    SPEED: 'HUD_SPEED',
    RPM: 'HUD_RPM',
    GEAR: 'HUD_GEAR'
  }
};

export function updateUISpeed(value: number, reverse: boolean, unit: string) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.SPEED,
    value: value.toFixed(1),
    reverse: reverse,
    unit: unit
  }));
}

export function updateUIRpm(value: number, inVehicle: boolean) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.RPM,
    inVehicle: inVehicle,
    value: value.toFixed(0)
  }));
}

export function updateUIGear(value: number | string, inVehicle: boolean) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.GEAR,
    inVehicle: inVehicle,
    value: value
  }));
}
