import {COMMANDS} from "../../hotlap/common/command.ts";
import {CLIENT_RESOURCE_EVENTS} from "../../util/common/event.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {clientVehicleState} from "./state.ts";
import {waitForModelToLoad} from "../../util/client/util.ts";
import {updateUIGear, updateUIRpm, updateUISpeed} from "../../ui/client/ui.ts";
import {wait} from "../../util/common/util.ts";
import {logDebugToServer} from "../../logging/client/log.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

const SPEED_UNITS = {
  METERS_PER_SECOND: 'mps',
  KILOMETERS_PER_HOUR: 'kmh',
  MILES_PER_HOUR: 'mph'
};

const SPEED_UNIT_CONVERSION_RATIO = {
  METERS_PER_SECOND: {
    TO: {
      KILOMETERS_PER_HOUR: 3.6,
      MILES_PER_HOUR: 2.236936
    }
  }
};

on(CLIENT_RESOURCE_EVENTS.ON_RESOURCE_START, (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    deleteClientsCurrentVehicle();
  }
});

RegisterCommand(
  COMMANDS.CAR,
  async (source: number, args: string[]) => handleCarCommand(args),
  false
);

// start fetching vehicle stats each frame
clientVehicleState.ticks.stats = setTick(async () => {
  updateVehicleStats();
  await wait(0);
});

function updateVehicleStats() {
  // speed
  const speedMetersPerSecond = GetEntitySpeed(PlayerPedId());
  const speedConverted = convertMetersPerSecondTo(speedMetersPerSecond, SPEED_UNITS.KILOMETERS_PER_HOUR);
  clientVehicleState.speedMetersPerSecond = speedMetersPerSecond;

  // from here on, the vehicle is needed to determine the rest of the values
  const vehicleRef = GetVehiclePedIsIn(PlayerPedId(), false);
  if (vehicleRef === 0) {
    clientVehicleState.speedMetersPerSecond = undefined;
    updateUISpeed(speedConverted, false, SPEED_UNITS.KILOMETERS_PER_HOUR.toString());
    updateUIRpm(-1, false);
    updateUIGear(-1, false);
    return;
  }

  // reversing
  const isReversing = GetVehicleThrottleOffset(vehicleRef) < 0;
  updateUISpeed(speedConverted, isReversing, SPEED_UNITS.KILOMETERS_PER_HOUR.toString());

  // rpm
  const value = GetVehicleCurrentRpm(vehicleRef) * 10000;
  clientVehicleState.speedMetersPerSecond = value;
  updateUIRpm(value, true);

  // gear
  let gear: number | 'R' | 'N' = GetVehicleCurrentGear(vehicleRef);
  if (undefined === gear || 0 === gear) {
    gear = isReversing ? 'R' : 'N';
  }
  updateUIGear(gear, true);
}

function convertMetersPerSecondTo(value: number, unit: string) {
  switch (unit) {
    case SPEED_UNITS.KILOMETERS_PER_HOUR: {
      return value * SPEED_UNIT_CONVERSION_RATIO.METERS_PER_SECOND.TO.KILOMETERS_PER_HOUR;
    }
    case SPEED_UNITS.MILES_PER_HOUR: {
      return value * SPEED_UNIT_CONVERSION_RATIO.METERS_PER_SECOND.TO.MILES_PER_HOUR;
    }
    default: {
      return value;
    }
  }
}

async function handleCarCommand(args: string[]) {
  if (args.length === 0) {
    log.error(`Cannot execute command '${COMMANDS.CAR}': no arguments provided`);
    return;
  } else if (args.length > 1) {
    log.error(`Cannot execute command '${COMMANDS.CAR}': too many arguments provided (expected 1, found ${args.length})`);
    return;
  }

  const pedId = PlayerPedId();
  const heading = GetEntityHeading(PlayerPedId());

  if (args[0] === 'delete' && IsPedInAnyVehicle(pedId, false)) {
    deleteClientsCurrentVehicle();
    clientVehicleState.currentVehicleRef = undefined;
    return;
  }

  // all vanilla car ids: https://docs.fivem.net/docs/game-references/vehicle-references/vehicle-models/
  const vehicleId = args[0];

  try {
    const vehicleHash = GetHashKey(vehicleId);
    const [ x, y, z ] = GetOffsetFromEntityInWorldCoords(pedId, 0.0, 0.0, 0.0);

    deleteClientsCurrentVehicle();
    await waitForModelToLoad(vehicleHash);

    const vehicleRef = CreateVehicle(
      vehicleHash,
      x,
      y,
      z,
      heading,
      true,
      true
    );

    SetVehicleEngineOn(
      vehicleRef,
      true,
      true,
      false
    );

    SetPedIntoVehicle(pedId, vehicleRef, -1);

    clientVehicleState.currentVehicleRef = vehicleRef;
    log.info(`Spawned '${GetDisplayNameFromVehicleModel(vehicleHash)}'`);
  } catch (error) {
    log.error(`Failed to spawn vehicle '${vehicleId}': ${error}`);
  }
}

function deleteClientsCurrentVehicle() {
  let vehicleRefToDelete = clientVehicleState.currentVehicleRef;
  vehicleRefToDelete ??= GetVehiclePedIsIn(PlayerPedId(), false);

  if (vehicleRefToDelete === undefined || vehicleRefToDelete === 0) {
    log.debug(`Found no vehicle to delete`);
    return;
  }

  SetEntityAsMissionEntity(vehicleRefToDelete, true, true);
  DeleteVehicle(vehicleRefToDelete);

  log.info(`Deleted current and/or previous vehicle(s)`);
}

function isClientCurrentlyInVehicle() {
  return 0 !== GetVehiclePedIsIn(PlayerPedId(), false);
}

function isReversing(vehicleRef: number) {
  return GetVehicleThrottleOffset(vehicleRef) < 0;
}
