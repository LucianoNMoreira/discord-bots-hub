import en, { type Messages } from "./en";
import es from "./es";
import ptBr from "./pt-br";

export const dictionaries: Record<string, Messages> = {
  en,
  es,
  "pt-br": ptBr,
};

export type { Messages };


