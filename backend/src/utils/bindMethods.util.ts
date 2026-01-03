/**
 * Binds multiple methods from a service class
 */
export function bindMethods<T extends object>(
  service: T,
  methods: (keyof T)[]
): Partial<T> {
  return methods.reduce((acc, method) => {
    const value = service[method];
    if (typeof value === "function") {
      acc[method] = value.bind(service) as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}
