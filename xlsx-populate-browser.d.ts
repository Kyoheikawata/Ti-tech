declare module "xlsx-populate/browser/xlsx-populate" {
  const XlsxPopulate: unknown;
  export default XlsxPopulate;
}

// ついでにルートモジュール側も宣言しておくと将来のimportにも効く
declare module "xlsx-populate" {
  const XlsxPopulate: unknown;
  export default XlsxPopulate;
}