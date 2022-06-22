import { useEffect, useRef } from "react";
import hash from 'object-hash';

export const isPromise = (value: any) => {
  return Boolean(value && typeof value.then === 'function');
}

export const arrayFlatten = <T>(array: T[] | Array<T[]>): T[] => {
  if (array.some(Array.isArray)) {
    return arrayFlatten((array as Array<T[]>).flat())
  }
  return array as T[];
}

export function isDefined(value: any): boolean {
  return value !== null && value !== undefined
}

const cleanPromise = <T extends { [x: string]: any } | any[] | string | number | boolean,>(obj: T): T => {
  if (!!obj && Array.isArray(obj)) {
    return obj.map(cleanPromise) as T
  } else if (!!obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => {
      if (isPromise(v)) {
        return [k, `promise-${k}`];
      } else if (typeof v === "object") {
        return [k, cleanPromise(v)];
      } else {
        return [k, v];
      }
    })) as T;
  }
  return obj;
};

export const cleanHash = (item: any) => hash(cleanPromise(item))

export const useHashEffect = (func: () => void, deps: any) => {
  const isFirst = useRef(true);
  const prevDeps = useRef(deps);

  useEffect(() => {
    if (isFirst.current) {
      func();
      isFirst.current = false;
      return;
    }

    const depsHash = cleanHash(deps);
    const prevDepsHash = cleanHash(prevDeps.current);

    if (depsHash !== prevDepsHash) {
      prevDeps.current = { ...deps };
      func();
    }


  }, deps) /* FIXME deps or [deps] ? */

}