import {isUndefined} from "../../../common/util";
import {ConsoleLogger} from "../../../../logging/common/log";
import {Track} from "../../../common/hotlap/type";
import {parseCheckpoints} from "./checkpoint";
import {parseDynamicProps, parseFixtures, parseStaticProps} from "./prop";
import {PACKAGE_NAME} from "../../../common/package.ts";

const log = new ConsoleLogger(PACKAGE_NAME);

/**
 * Condenses a full R* track JSON object into only the most necessary information to set up a hotlapping session.
 *
 * @param fullTrack A full R* track JSON object
 * @return {Track} A condensed track object, consisting of all necessary information to set up a hotlapping
 * session.
 */
export function parseTrack(fullTrack: any): Track {
  log.debug(`Parsing R* track to condensed format...`);

  if (isUndefined(fullTrack)) {
    throw new Error(`raw track is undefined`);
  }

  return {
    name: parseName(fullTrack),
    author: parseAuthor(fullTrack),
    description: parseDescription(fullTrack),
    checkpoints: parseCheckpoints(fullTrack),
    staticProps: parseStaticProps(fullTrack),
    dynamicProps: parseDynamicProps(fullTrack),
    fixtures: parseFixtures(fullTrack)
  };
}

function parseName(track: any) {
  return track.mission.gen.nm;
}

function parseAuthor(track: any) {
  return track.mission.gen.ownerid;
}

function parseDescription(track: any) {
  return (track.mission.gen.dec).join('');
}
