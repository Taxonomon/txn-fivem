import {COMMANDS} from "../../hotlap/common/command.ts";
import {waitForModelToLoad} from "../../hotlap/client/util.ts";
import {CLIENT_RESOURCE_EVENTS} from "../../util/common/event.ts";
import {ConsoleLogger} from "../../logging/common/log.ts";
import {PACKAGE_NAME} from "../common/package.ts";
import {clientVehicleState} from "./state.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

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
