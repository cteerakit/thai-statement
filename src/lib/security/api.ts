/** Custom header required on POST /api/convert (CSRF mitigation). */
export const CONVERT_API_HEADER = "x-statement-converter";
export const CONVERT_API_HEADER_VALUE = "1";

export function hasConvertApiHeader(request: Request): boolean {
  return (
    request.headers.get(CONVERT_API_HEADER) === CONVERT_API_HEADER_VALUE
  );
}
