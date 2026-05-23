import type { dictionary as enDictionary } from "@/i18n/dictionaries/en";

type WidenStrings<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: WidenStrings<T[K]> }
    : T;

export type Dictionary = WidenStrings<typeof enDictionary>;

export type UploadDictionary = Dictionary["upload"];
export type PreviewDictionary = Dictionary["preview"];
