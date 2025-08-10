// app/api/export/route.ts
import { readFile } from "fs/promises";
import path from "path";
export const runtime = "nodejs"; // Node ランタイム必須（ファイルI/O & Buffer）

// ===== xlsx-populate 最小型（unknownベース）=====
type CellLite = {
  value(): unknown;
  value(v: unknown): CellLite;
  style(key: string, val: unknown): CellLite;
  formula?: () => string | null;
};
type UsedRangeLite = {
  value(): unknown[][];
  startCell(): { rowNumber(): number; columnNumber(): number };
};
type SheetLite = {
  cell(ref: string): CellLite;
  cell(row: number, col: number): CellLite;
  row(r: number): { hidden(v?: boolean): unknown };
  usedRange(): UsedRangeLite;
};
type WorkbookLite = {
  sheets(): SheetLite[];
  sheet(index: number | string): SheetLite;
  outputAsync(): Promise<ArrayBuffer | Uint8Array>;
};
type XlsxPopulateLike = {
  fromDataAsync: (ab: ArrayBuffer | Uint8Array) => Promise<WorkbookLite>;
};

// ===== アプリ側の型 =====
type LegalKey = "jibaiseki24m" | "weightTax" | "stamp";
type QtyUnit = { unit: number; qty: number };
type Legal = Record<LegalKey, QtyUnit>;
type FeeKey = "partsExchangeTech" | "proxy" | "basic";
type Fees = Record<FeeKey, QtyUnit> & { discount: number; deposit: number };

type Item = { id: string; name: string; price: number; qty: number; cat: string; notes?: string };
type Client = { name: string; phone: string; email: string; address: string };
type Vehicle = {
  registrationNo: string; model: string; modelCode: string; vin: string; engineModel: string;
  mileage: string; firstReg: string; nextInspection: string;
};
type Settings = {
  company: { name: string; address: string; phone: string; bank: string; logoUrl: string };
  tax: { rate: number };
};
type Meta = { date: string; invoiceNo: string };

type ExportPayload = {
  client: Client;
  vehicle: Vehicle;
  items: Item[];
  legal: Legal;
  fees: Fees;
  settings: Settings;
  meta: Meta;
};

export async function POST(req: Request) {
  const data: ExportPayload = await req.json();

  // xlsx-populate（Node）を読み込み
  const mod = await import("xlsx-populate");
  const XlsxPopulate: XlsxPopulateLike =
    ((mod as unknown as { default?: XlsxPopulateLike }).default ?? (mod as unknown as XlsxPopulateLike));

  // テンプレ読込（public/templates/shaken_template.xlsx）
  const templatePath = path.join(process.cwd(), "public", "templates", "shaken_template.xlsx");
  const templateBuf = await readFile(templatePath);
  const wb = await XlsxPopulate.fromDataAsync(templateBuf);
  const moneyFmt = '"¥"#,##0;-"¥"#,##0';

  // シート選択
  const candidate = wb.sheets().find((s) => String(s.cell("A1").value() ?? "").includes("見積書"));
  const sheet = (candidate ?? wb.sheet(0));

  // ---- 上部：宛名・日付・車両 ----
  sheet.cell("A2").value(data.client.name || "");
  const d = data.meta.date ? new Date(data.meta.date) : new Date();
  sheet.cell("F2").value(d).style("numberFormat", "yyyy/m/d");
  sheet.cell("B3").value(data.vehicle.registrationNo || "");
  sheet.cell("D3").value(data.vehicle.modelCode || "");
  sheet.cell("B4").value(data.vehicle.model || "");
  sheet.cell("D4").value(data.vehicle.vin || "");
  sheet.cell("B5").value(data.vehicle.mileage ? `${data.vehicle.mileage} km` : "　km");
  sheet.cell("D5").value(data.vehicle.engineModel || "");
  sheet.cell("B6").value(data.vehicle.firstReg || "");
  sheet.cell("D6").value(data.vehicle.nextInspection || "");

  // ---- 法定費用（非課税）：D=単価 / E=個数 / F=金額 ----
  const L9  = Number(data.legal.jibaiseki24m.unit||0) * Number(data.legal.jibaiseki24m.qty||0);
  const L10 = Number(data.legal.weightTax.unit||0)    * Number(data.legal.weightTax.qty||0);
  const L11 = Number(data.legal.stamp.unit||0)        * Number(data.legal.stamp.qty||0);

  sheet.cell("D9").value(Number(data.legal.jibaiseki24m.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E9").value(Number(data.legal.jibaiseki24m.qty ||0)).style("numberFormat", "0");
  sheet.cell("F9").value(L9).style("numberFormat", moneyFmt);

  sheet.cell("D10").value(Number(data.legal.weightTax.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E10").value(Number(data.legal.weightTax.qty ||0)).style("numberFormat", "0");
  sheet.cell("F10").value(L10).style("numberFormat", moneyFmt);

  sheet.cell("D11").value(Number(data.legal.stamp.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E11").value(Number(data.legal.stamp.qty ||0)).style("numberFormat", "0");
  sheet.cell("F11").value(L11).style("numberFormat", moneyFmt);

  // ---- 明細（A15:F36想定）→ 未使用行は非表示 ----
  const START = 15, TEMPLATE_ROWS = 22, END = START + TEMPLATE_ROWS - 1;
  const used = Math.min(data.items.length, TEMPLATE_ROWS);

  for (let r = START; r <= END; r++) {
    sheet.row(r).hidden(false);
    ["A","B","C","D","E"].forEach(col => sheet.cell(`${col}${r}`).value(null)); // F列(式)は触らない
  }

  for (let i = 0; i < used; i++) {
    const it = data.items[i];
    const r  = START + i;
    const qty   = Math.max(0, Number(it.qty || 0));
    const price = Number(it.price || 0);

    sheet.cell(`A${r}`).value(qty > 1 ? `×${qty}` : (qty > 0 ? "✓" : ""));
    sheet.cell(`B${r}`).value(it.name || "");
    sheet.cell(`D${r}`).value(price).style("numberFormat", moneyFmt);
    sheet.cell(`E${r}`).value(qty).style("numberFormat", "0");
    // F列はテンプレの式に任せる
  }

  for (let r = START + used; r <= END; r++) sheet.row(r).hidden(true);

  // ---- 技術料など（課税）：D=単価 / E=個数（Fは式に任せる）----
  sheet.cell("D37").value(Number(data.fees.partsExchangeTech.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E37").value(Number(data.fees.partsExchangeTech.qty ||0)).style("numberFormat", "0");
  sheet.cell("D38").value(Number(data.fees.proxy.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E38").value(Number(data.fees.proxy.qty ||0)).style("numberFormat", "0");
  sheet.cell("D39").value(Number(data.fees.basic.unit||0)).style("numberFormat", moneyFmt);
  sheet.cell("E39").value(Number(data.fees.basic.qty ||0)).style("numberFormat", "0");

  // ---- 調整値引き／預り金（該当行のF列＝金額列に直接）----
  const usedRange = () => {
    const rng = sheet.usedRange();
    return {
      values: rng.value() as unknown[][],
      startRow: rng.startCell().rowNumber(),
      startCol: rng.startCell().columnNumber(),
    };
  };
  const norm = (s: string) => String(s).replace(/\s+/g, "");
  function findLabelCell(
    matchers: (string|RegExp)[],
    opt?: { rowMin?: number; rowMax?: number; searchFromBottom?: boolean }
  ): {row:number; col:number} | null {
    const { values, startRow, startCol } = usedRange();
    const rStart = opt?.searchFromBottom ? values.length - 1 : 0;
    const rEnd   = opt?.searchFromBottom ? -1 : values.length;
    const rStep  = opt?.searchFromBottom ? -1 : 1;
    for (let i = rStart; i !== rEnd; i += rStep) {
      const rowNumber = startRow + i;
      if (opt?.rowMin && rowNumber < opt.rowMin) continue;
      if (opt?.rowMax && rowNumber > opt.rowMax) continue;
      const rowVals = values[i];
      for (let j = 0; j < rowVals.length; j++) {
        const v = rowVals[j];
        if (typeof v !== "string") continue;
        const s = norm(v);
        const hit = matchers.some(m => typeof m === "string" ? s.includes(norm(m)) : (m as RegExp).test(s));
        if (hit) return { row: rowNumber, col: startCol + j };
      }
    }
    return null;
  }
  function writeAmountF(matchers: (string|RegExp)[], val: number) {
    const pos = findLabelCell(matchers, { searchFromBottom: true });
    if (!pos) return;
    sheet.cell(`F${pos.row}`).value(val).style("numberFormat", moneyFmt);
  }
  writeAmountF(["調整値引き"], Number(data.fees.discount||0));
  writeAmountF(["預り金"],     Number(data.fees.deposit ||0));

  // 会社情報（任意）
  if (data.settings.company.address) sheet.cell("B46").value(data.settings.company.address);
  if (data.settings.company.name)    sheet.cell("B47").value(data.settings.company.name);

  try {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBin  = await readFile(logoPath);
  const logoB64  = "data:image/png;base64," + logoBin.toString("base64");

  // ★ テンプレと同じ位置に合わせる：B49:F53（必要に応じて調整）
  //    from: { row: 行番号, col: 列番号 }  ※A=1, B=2 ...
  (sheet as any).addImage?.({
    image: logoB64,
    name: "ti-tech-logo",
    from: { row: 49, col: 2 },   // B49
    to:   { row: 53, col: 6 },   // F53
  });
} catch (e) {
  // ロゴが無くても出力は継続
  console.warn("logo insert skipped:", e);
}

  // 出力 & ダウンロードレスポンス
const out = await wb.outputAsync(); // ArrayBuffer | Uint8Array

// 必ず「新しい ArrayBuffer」にコピーして返す（SharedArrayBuffer/Buffer を気にしないでOK）
function toArrayBuffer(x: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (x instanceof ArrayBuffer) {
    const src = new Uint8Array(x);
    const ab = new ArrayBuffer(src.byteLength);
    new Uint8Array(ab).set(src);
    return ab;
  } else {
    // Uint8Array（Bufferも instanceof Uint8Array になる）
    const src = x;
    const ab = new ArrayBuffer(src.byteLength);
    new Uint8Array(ab).set(src);
    return ab;
  }
}

const bodyAb = toArrayBuffer(out);

return new Response(bodyAb, {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="estimate_${data.meta.invoiceNo}.xlsx"`,
    "Cache-Control": "no-store",
  },
});
}
