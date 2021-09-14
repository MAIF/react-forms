export const option = (x) => (x === undefined || x === null ? None : Some(x));

export const Some = (x) => ({
  map: (f) => option(f(x)),
  flatMap: (f) => f(x),
  fold: (_ifEmpty, f) => f(x),
  orElse: () => option(x),
  getOrElse: () => x,
  getOrNull: () => x,
  isDefined: true,
  exists: (f) => option(f(x)).isDefined,
});

export const None = {
  map: () => None,
  flatMap: () => None,
  fold: (ifEmpty, _f) => ifEmpty(),
  orElse: (x) => option(x),
  getOrElse: (ifEmpty) => ifEmpty,
  getOrNull: () => undefined,
  isDefined: false,
  exists: () => false,
};
