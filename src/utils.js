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