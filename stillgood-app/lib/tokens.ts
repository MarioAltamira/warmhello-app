import { randomBytes } from "crypto";

export function createCheckInToken() {
  return randomBytes(18).toString("base64url");
}
