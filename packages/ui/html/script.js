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

const UI_ELEMENT_IDS = {
  HUD: {
    PRIMARY: {
      SPEED: {
        VALUE: 'hud-bottom-right-speed-value',
        UNIT: 'hud-bottom-right-speed-unit'
      }
    },
    SECONDARY: {
      DIV: 'hud-bottom-right-secondary',
      RPM: {
        VALUE: 'hut-bottom-right-secondary-rpm-value'
      },
      GEAR: {
        VALUE: 'hud-bottom-right-secondary-gear-value'
      }
    }
  },
  SYSTEM_TIME: 'system-time-top-right-value',
  LAP_TIMER: {
    DIV: 'timer-bottom-center',
    VALUE: 'timer-bottom-center-value'
  },
  LAP_TIMES: {
    DIV: 'lap-times-top-right',
    LAST_LAP: 'lap-times-top-right-last-lap-value',
    AVERAGE_LAP: 'lap-times-top-right-average-lap-value',
    PERSONAL_BEST: 'lap-times-top-right-personal-best-value',
    LAP_RECORD: 'lap-times-top-right-lap-record-value'
  }
};

window.addEventListener('message', (event) => {
  switch (event.data.type) {
    case UI_EVENTS.HUD.SPEED: {
      updateHudSpeed(event.data.value, event.data.unit);
      break;
    }
    case UI_EVENTS.HUD.RPM: {
      updateHudRpm(event.data.value, event.data.inVehicle);
      break;
    }
    case UI_EVENTS.HUD.GEAR: {
      updateHudGear(event.data.value, event.data.inVehicle);
      break;
    }
    case UI_EVENTS.HUD.LAP.TIMER: {
      updateLapTimer(event.data.value);
      break;
    }
    case UI_EVENTS.HOTLAP.TOGGLE: {
      toggleHotlapUIElements(event.data.value);
      break;
    }
    case UI_EVENTS.HUD.LAP.LAST_LAP: {
      updateLastLap(event.data.value);
      break;
    }
    case UI_EVENTS.HUD.LAP.AVERAGE_LAP: {
      updateAverageLap(event.data.value);
      break;
    }
  }
});

// update current time every second
setInterval(() => updateCurrentTimeEverySecond(), 1000);

function updateCurrentTimeEverySecond() {
  const timestamp = new Date();

  const timestampFormatted = formatTimestamp(timestamp);
  const timeValueElement = document.getElementById(UI_ELEMENT_IDS.SYSTEM_TIME);

  if (timeValueElement !== null) {
    timeValueElement.innerText = timestampFormatted && timeValueElement ? timestampFormatted : 'N/A';
  }
}

function updateHudSpeed(value, unit) {
  const valueElement = document.getElementById(UI_ELEMENT_IDS.HUD.PRIMARY.SPEED.VALUE);
  valueElement.textContent = value && valueElement ? value : '';

  const unitElement = document.getElementById(UI_ELEMENT_IDS.HUD.PRIMARY.SPEED.UNIT);
  unitElement.textContent = unit && unitElement ? unit : '';
}

function updateHudRpm(value, inVehicle) {
  hideSecondaryHudIfNotInVehicle(inVehicle);
  const valueElement = document.getElementById(UI_ELEMENT_IDS.HUD.SECONDARY.RPM.VALUE);
  valueElement.textContent = value && valueElement ? value : '';
}

function updateHudGear(value, inVehicle) {
  hideSecondaryHudIfNotInVehicle(inVehicle);
  const valueElement = document.getElementById(UI_ELEMENT_IDS.HUD.SECONDARY.GEAR.VALUE);
  valueElement.textContent = value && valueElement ? value : '';
}

function hideSecondaryHudIfNotInVehicle(inVehicle) {
  const hudSecondaryElement = document.getElementById(UI_ELEMENT_IDS.HUD.SECONDARY.DIV);
  hudSecondaryElement.style.display = inVehicle ? 'flex' : 'none';
}

function formatTimestamp(timestamp) {
  return timestamp.toLocaleString('en-uk');
}

function updateLapTimer(value) {
  const valueElement = document.getElementById(UI_ELEMENT_IDS.LAP_TIMER.VALUE);
  if (valueElement && value) {
    valueElement.innerText = value
  }
}

function toggleHotlapUIElements(show) {
  document.getElementById(UI_ELEMENT_IDS.LAP_TIMES.DIV).style.display = show ? 'block' : 'none';
  document.getElementById(UI_ELEMENT_IDS.LAP_TIMER.DIV).style.display = show ? 'flex' : 'none';
}

function updateLastLap(value) {
  const valueElement = document.getElementById(UI_ELEMENT_IDS.LAP_TIMES.LAST_LAP);
  valueElement.textContent = value && valueElement ? value : '--';
}

function updateAverageLap(value) {
  const valueElement = document.getElementById(UI_ELEMENT_IDS.LAP_TIMES.AVERAGE_LAP);
  valueElement.textContent = value && valueElement ? value : '--';
}
