export function identifyType(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "bigint") return "bigint";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "symbol") return "symbol";
  if (typeof value === "function") return "function";
  if (typeof value === "object") {
    if (value.constructor) {
      const name = value.constructor.name;
      return name === "Object" ? "object" : name;
    }
    return "object";
  }
  return "?";
}
