/**
 * Formats a timestamp (milliseconds) to a time of the format HH:MM:ss.SSS.
 *
 * @param timestampMs The timestamp to format, in milliseconds.
 * @param showHours Whether to include the hours in the resulting string in case they are zero.
 * @param showMinutes Whether to include the minutes in the resulting string in case they are zero.
 */
export function formatTimestampToDisplayTime(
  timestampMs: number,
  showHours: boolean = false,
  showMinutes: boolean = false
) {
  const [ hours, minutes, secondsAndMilliseconds ] = new Date(timestampMs)
    .toISOString()
    .slice(11, -1)
    .split(':');

  const [ seconds, milliseconds ] = secondsAndMilliseconds.split('.');

  if (!showMinutes) {
    return `${seconds}.${milliseconds}`;
  } else if (!showHours) {
    return `${minutes}:${seconds}.${milliseconds}`;
  } else {
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
}
