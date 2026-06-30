import { v7 as uuidv7 } from 'uuid';

/**
 * Generate an application-layer **UUID v7** primary key (CTO decision).
 * v7 is time-ordered, giving sequential B-tree insert locality while remaining
 * non-enumerable. All entity IDs are generated here, never by the database
 * (PostgreSQL 16 has no native `uuidv7()`), and never as auto-increment integers.
 */
export function newId(): string {
  return uuidv7();
}
