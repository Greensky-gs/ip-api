import { If } from "./core";

export type allowed<Raw extends boolean = false> = {
    ip: string;
    allowed: boolean;
    allowedAt: If<Raw, string, number>;
    userId: string;
}