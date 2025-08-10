// app/api/export/route.ts
import { Workbook, Worksheet } from "exceljs";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// ==== アプリ側の型（そのまま） ====
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
type Settings = { company: { name: string; address: string; phone: string; bank: string; logoUrl: string }; tax: { rate: number } };
type Meta = { date: string; invoiceNo: string };
type ExportPayload = { client: Client; vehicle: Vehicle; items: Item[]; legal: Legal; fees: Fees; settings: Settings; meta: Meta };

// 共通
const moneyFmt = '"¥"#,##0;-"¥"#,##0';
const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));
const norm = (s: string) => String(s).replace(/\s+/g, "");

// ラベル検索（ExcelJS版）
function findLabelCell(
  ws: Worksheet,
  matchers: (string | RegExp)[],
  opt?: { rowMin?: number; rowMax?: number; searchFromBottom?: boolean }
): { row: number; col: number } | null {
  const rows = ws.actualRowCount || ws.rowCount;
  const cols = ws.actualColumnCount || ws.columnCount || 60;
  const rStart = opt?.searchFromBottom ? rows : 1;
  const rEnd = opt?.searchFromBottom ? 1 : rows;
  const step = opt?.searchFromBottom ? -1 : 1;

  for (let r = rStart; opt?.searchFromBottom ? r >= rEnd : r <= rEnd; r += step) {
    if (opt?.rowMin && r < opt.rowMin) continue;
    if (opt?.rowMax && r > opt.rowMax) continue;
    for (let c = 1; c <= cols; c++) {
      const v = ws.getCell(r, c).value;
      if (typeof v !== "string") continue;
      const s = norm(v);
      const hit = matchers.some(m => typeof m === "string" ? s.includes(norm(m)) : (m as RegExp).test(s));
      if (hit) return { row: r, col: c };
    }
  }
  return null;
}

export async function POST(req: Request) {
  const data: ExportPayload = await req.json();

  // 1) テンプレを exceljs で読込
const templatePath = path.join(process.cwd(), "public", "templates", "shaken_template.xlsx");
const book = new Workbook();
await book.xlsx.readFile(templatePath);

  // 対象シート（A1 に「見積書」を含む / 無ければ先頭）
  const ws =
    book.worksheets.find(w => String(w.getCell("A1").value ?? "").includes("見積書")) ??
    book.worksheets[0];

  // 2) 上部：宛名・日付・車両
  ws.getCell("A2").value = data.client.name || "";
  const d = data.meta.date ? new Date(data.meta.date) : new Date();
  ws.getCell("F2").value = d; ws.getCell("F2").numFmt = "yyyy/m/d";
  ws.getCell("B3").value = data.vehicle.registrationNo || "";
  ws.getCell("D3").value = data.vehicle.modelCode || "";
  ws.getCell("B4").value = data.vehicle.model || "";
  ws.getCell("D4").value = data.vehicle.vin || "";
  ws.getCell("B5").value = data.vehicle.mileage ? `${data.vehicle.mileage} km` : "　km";
  ws.getCell("D5").value = data.vehicle.engineModel || "";
  ws.getCell("B6").value = data.vehicle.firstReg || "";
  ws.getCell("D6").value = data.vehicle.nextInspection || "";

  // 3) 法定費用
  const L9  = toNum(data.legal.jibaiseki24m.unit) * toNum(data.legal.jibaiseki24m.qty);
  const L10 = toNum(data.legal.weightTax.unit)    * toNum(data.legal.weightTax.qty);
  const L11 = toNum(data.legal.stamp.unit)        * toNum(data.legal.stamp.qty);

  ws.getCell("D9").value = toNum(data.legal.jibaiseki24m.unit); ws.getCell("D9").numFmt = moneyFmt;
  ws.getCell("E9").value = toNum(data.legal.jibaiseki24m.qty);  ws.getCell("E9").numFmt = "0";
  ws.getCell("F9").value = L9;  ws.getCell("F9").numFmt = moneyFmt;

  ws.getCell("D10").value = toNum(data.legal.weightTax.unit); ws.getCell("D10").numFmt = moneyFmt;
  ws.getCell("E10").value = toNum(data.legal.weightTax.qty);  ws.getCell("E10").numFmt = "0";
  ws.getCell("F10").value = L10; ws.getCell("F10").numFmt = moneyFmt;

  ws.getCell("D11").value = toNum(data.legal.stamp.unit); ws.getCell("D11").numFmt = moneyFmt;
  ws.getCell("E11").value = toNum(data.legal.stamp.qty);  ws.getCell("E11").numFmt = "0";
  ws.getCell("F11").value = L11; ws.getCell("F11").numFmt = moneyFmt;

  // 4) 明細（A15:F36）
  const START = 15, TEMPLATE_ROWS = 22, END = START + TEMPLATE_ROWS - 1;
  const used = Math.min(data.items.length, TEMPLATE_ROWS);

  for (let r = START; r <= END; r++) {
    ws.getRow(r).hidden = false;
    ["A","B","C","D","E"].forEach(col => { const cell = ws.getCell(`${col}${r}`); cell.value = null; });
  }

  for (let i = 0; i < used; i++) {
    const it = data.items[i];
    const r  = START + i;
    const qty = Math.max(0, Number(it.qty || 0));
    const price = Number(it.price || 0);

    ws.getCell(`A${r}`).value = qty > 1 ? `×${qty}` : (qty > 0 ? "✓" : "");
    ws.getCell(`B${r}`).value = it.name || "";
    ws.getCell(`D${r}`).value = price; ws.getCell(`D${r}`).numFmt = moneyFmt;
    ws.getCell(`E${r}`).value = qty;   ws.getCell(`E${r}`).numFmt = "0";
    // F列はテンプレの式があればそのまま、無ければ式/値は触らない
  }
  for (let r = START + used; r <= END; r++) ws.getRow(r).hidden = true;

  // 5) 技術料（D/Eのみ）
  ws.getCell("D37").value = toNum(data.fees.partsExchangeTech.unit); ws.getCell("D37").numFmt = moneyFmt;
  ws.getCell("E37").value = toNum(data.fees.partsExchangeTech.qty);  ws.getCell("E37").numFmt = "0";
  ws.getCell("D38").value = toNum(data.fees.proxy.unit);             ws.getCell("D38").numFmt = moneyFmt;
  ws.getCell("E38").value = toNum(data.fees.proxy.qty);              ws.getCell("E38").numFmt = "0";
  ws.getCell("D39").value = toNum(data.fees.basic.unit);             ws.getCell("D39").numFmt = moneyFmt;
  ws.getCell("E39").value = toNum(data.fees.basic.qty);              ws.getCell("E39").numFmt = "0";

  // 6) 調整値引き/預り金 … 該当ラベル行の F 列へ
  const writeAmountF = (labels: (string|RegExp)[], val: number) => {
    const pos = findLabelCell(ws, labels, { searchFromBottom: true });
    if (!pos) return;
    const cell = ws.getCell(pos.row, 6);
    cell.value = val;
    cell.numFmt = moneyFmt;
  };
  writeAmountF(["調整値引き"], toNum(data.fees.discount));
  writeAmountF(["預り金"],     toNum(data.fees.deposit));

  // 7) 会社情報
  if (data.settings.company.address) ws.getCell("B46").value = data.settings.company.address;
  if (data.settings.company.name)    ws.getCell("B47").value = data.settings.company.name;

  // 8) 既存のロゴ画像を削除 → 改めてセル範囲アンカーで追加
  const getImages = (ws as unknown as { getImages?: () => Array<{ imageId: number }> }).getImages;
  if (typeof getImages === "function") {
    for (const im of getImages.call(ws)) {
      (ws as unknown as { removeImage: (id: number) => void }).removeImage(im.imageId);
    }
  }
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBuf = await readFile(logoPath);
    const imgId = book.addImage({ base64: "data:image/png;base64," + logoBuf.toString("base64"), extension: "png" });
    // ★ テンプレと同じ位置に合わせてください（例: "B49:F53"）
    ws.addImage(imgId, "A44:A49");
  } catch (e) {
    console.warn("logo insert skipped:", e);
  }

  // 9) 開いたときに再計算
  book.calcProperties.fullCalcOnLoad = true;

  // 10) 出力
  const out = await book.xlsx.writeBuffer(); // ArrayBuffer | Uint8Array
  const toAB = (x: ArrayBuffer | Uint8Array): ArrayBuffer => {
    const src = x instanceof ArrayBuffer ? new Uint8Array(x) : x;
    const ab = new ArrayBuffer(src.byteLength);
    new Uint8Array(ab).set(src);
    return ab;
  };

  return new Response(out instanceof ArrayBuffer ? out : toAB(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="estimate_${encodeURIComponent(data.meta.invoiceNo)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
