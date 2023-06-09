export function isPromise<T>(obj: any): obj is Promise<T> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

export function isArrayTemplateStringsArray(
  strings: any | TemplateStringsArray
): strings is TemplateStringsArray {
  return Array.isArray((strings as TemplateStringsArray).raw);
}
