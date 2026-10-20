export const CLINIC_TIME_ZONE = 'America/Caracas';

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function dateTimeParts(date) {
  return Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  );
}

export function formatClinicDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = dateTimeParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function clinicDateTimeToIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new RangeError('La fecha y hora de medición no son válidas.');

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const target = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
  };
  const targetMilliseconds = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
  );
  const calendarDate = new Date(targetMilliseconds);
  if (
    calendarDate.getUTCFullYear() !== target.year ||
    calendarDate.getUTCMonth() + 1 !== target.month ||
    calendarDate.getUTCDate() !== target.day ||
    target.hour > 23 ||
    target.minute > 59
  ) {
    throw new RangeError('La fecha y hora de medición no son válidas.');
  }

  let instant = targetMilliseconds;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateTimeParts(new Date(instant));
    const representedMilliseconds = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const adjustment = targetMilliseconds - representedMilliseconds;
    if (adjustment === 0) break;
    instant += adjustment;
  }

  const resolved = dateTimeParts(new Date(instant));
  if (
    resolved.year !== target.year ||
    resolved.month !== target.month ||
    resolved.day !== target.day ||
    resolved.hour !== target.hour ||
    resolved.minute !== target.minute
  ) {
    throw new RangeError('La fecha y hora no existe en la zona horaria de la clínica.');
  }

  return new Date(instant).toISOString();
}

export function currentClinicDateTime() {
  return formatClinicDateTime(new Date());
}
