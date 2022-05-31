import { useEffect, useRef } from "react";
import hash from 'object-hash';

export const isPromise = (value) => {
  return Boolean(value && typeof value.then === 'function');
}

export const arrayFlatten = (array) => {
  if (array.some(Array.isArray)) {
    return arrayFlatten(array.flat())
  }
  return array;
}

export const isDefined = (value) => {
  return value !== null && value !== undefined
} 

export const useHashEffect = (func, deps) => {
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


  }, [deps])
  
}