import { injectLocal, provideLocal } from "@vueuse/core";

const defineContext = <T extends (...params: any) => {}>(definition: T) => {
  const id = crypto.randomUUID();

  const _provide = (...params: Parameters<T>) => {
    const state = definition(...params);

    provideLocal(id, state);

    return state as ReturnType<T>;
  };

  const _inject = () => {
    const value = injectLocal<ReturnType<T>>(id);

    if (!value) throw new Error("No injected found");

    return value;
  };

  return [_inject, _provide] as const;
};

export default defineContext;
