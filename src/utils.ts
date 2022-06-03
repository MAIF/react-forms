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

export function isDefined (value: any): boolean {
  return value !== null && value !== undefined
} 

export const useHashEffect = (func: () => void, deps: any) => {
  const isFirst = useRef(true);
  const prevDeps = useRef(deps);

  useEffect(() => {
    if (isFirst.current ) {
      func();
      isFirst.current = false;
      return;
    }
    
    const depsHash = hash(deps);
    const prevDepsHash = hash(prevDeps.current);

    if (depsHash !== prevDepsHash) {
      prevDeps.current = deps;
      func();
    }


  }, [deps]) /* FIXME deps or [deps] ? */
  
}