/** Serializable game state clone that works consistently in Hermes and browsers. */
export function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

