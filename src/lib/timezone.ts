import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

// Zona horaria de Lima, Perú (UTC-5 permanente)
export const PERU_TIMEZONE = 'America/Lima';

/**
 * Formatea una fecha en la zona horaria de Perú
 */
export const formatInPeruTimezone = (
  date: Date | string,
  formatStr: string = 'PPpp'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, PERU_TIMEZONE, formatStr, { locale: es });
};

/**
 * Convierte una fecha UTC a hora de Perú
 */
export const toPeruTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, PERU_TIMEZONE);
};

/**
 * Convierte una fecha en hora de Perú a UTC (para guardar en DB)
 */
export const fromPeruTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return fromZonedTime(dateObj, PERU_TIMEZONE);
};

/**
 * Obtiene la hora actual en Perú
 */
export const getCurrentPeruTime = (): Date => {
  return toZonedTime(new Date(), PERU_TIMEZONE);
};

/**
 * Formatea una fecha para mostrar (solo fecha)
 */
export const formatPeruDate = (date: Date | string): string => {
  return formatInPeruTimezone(date, 'PPP'); // "27 de octubre de 2025"
};

/**
 * Formatea una fecha y hora completa
 */
export const formatPeruDateTime = (date: Date | string): string => {
  return formatInPeruTimezone(date, "d 'de' MMMM 'de' yyyy, HH:mm"); 
  // "27 de octubre de 2025, 14:30"
};

/**
 * Formatea solo la hora
 */
export const formatPeruTime = (date: Date | string): string => {
  return formatInPeruTimezone(date, 'HH:mm'); // "14:30"
};

/**
 * Formatea fecha corta con hora
 */
export const formatPeruDateTimeShort = (date: Date | string): string => {
  return formatInPeruTimezone(date, "d MMM yyyy, HH:mm"); 
  // "27 oct 2025, 14:30"
};

/**
 * Parsea un string de datetime del usuario (hora Perú) a UTC
 */
export const parsePeruDateTime = (dateTimeString: string): Date => {
  const localDate = parseISO(dateTimeString);
  return fromPeruTime(localDate);
};
