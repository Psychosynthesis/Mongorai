export namespace Utils {
  /**
   * In-place sort of the given array of objects
   * @param arr An array of objects
   * @param field the field used to sort
   * @param descending whether to use descending order
   */
  export const fieldSort = <T extends Record<string, any>>(
    arr: T[],
    field: keyof T,
    descending: boolean = false
  ): T[] => {
    return arr.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return descending ? -1 : 1;
      if (bVal === undefined || bVal === null) return descending ? 1 : -1;

      return (aVal > bVal)
        ? (descending ? -1 : 1)
        : (descending ? 1 : -1);
    });
  }
}
