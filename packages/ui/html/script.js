const UI_EVENTS = {
  HUD: {
    SPEED: 'HUD_SPEED',
    RPM: 'HUD_RPM',
    GEAR: 'HUD_GEAR'
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
  CURRENT_TIME: 'current-time-bottom-left-value'
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
    }
  }
});

// update current time every second
console.log(`Starting to display current time every second...`);
setInterval(() => updateCurrentTimeEverySecond(), 1000);
updateCurrentTimeEverySecond();

function updateCurrentTimeEverySecond() {
  const timestamp = new Date();
  adjustTimestampTimezoneOffset(timestamp);

  const timestampFormatted = formatTimestamp(timestamp);
  const timeValueElement = document.getElementById(UI_ELEMENT_IDS.CURRENT_TIME);

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

function adjustTimestampTimezoneOffset(timestamp) {
  const timezoneOffset = timestamp.getTimezoneOffset() / 60;
  timestamp.setHours(
    timezoneOffset < 0
      ? timestamp.getHours() - timezoneOffset
      : timestamp.getHours() + timezoneOffset
  );
}
