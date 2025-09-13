const UI_EVENTS = {
  HUD: {
    SPEED: 'HUD_SPEED',
    RPM: 'HUD_RPM',
    GEAR: 'HUD_GEAR',
    LAP: {
      TIMER: 'HUD_LAP_TIMER',
      LAST_LAP: 'HUD_LAP_LAST_LAP',
      AVERAGE_LAP: 'HUD_LAP_AVERAGE_LAP'
    }
  },
  HOTLAP: {
    TOGGLE: 'HOTLAP_TOGGLE'
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

export function updateUILapTimer(value: string) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.LAP.TIMER,
    value: value
  }))
}

export function toggleHotlapUIElements(show: boolean) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HOTLAP.TOGGLE,
    value: show
  }))
}

export function updateUILastLap(value: string) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.LAP.LAST_LAP,
    value: value
  }))
}

export function updateUIAverageLap(value: string) {
  SendNuiMessage(JSON.stringify({
    type: UI_EVENTS.HUD.LAP.AVERAGE_LAP,
    value: value
  }))
}
