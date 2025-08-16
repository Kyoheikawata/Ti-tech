// app/api/export/route.ts
import { Workbook, Worksheet } from "exceljs";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// ==== アプリ側の型（そのまま） ====
type LegalKey = "jibaiseki24m" | "weightTax" | "stamp";
type QtyUnit = { unit: number; qty: number };
type Legal = Record<LegalKey, QtyUnit>;
type Fees = { discount: number; deposit: number };

// 備考を持てるように
type Meta = { date: string; invoiceNo: string; docTitle?: string; remarks?: string };

type ExportPayload = {
  client: Client;
  vehicle: Vehicle;
  items: Item[];
  legal: Legal;
  fees: Fees;           // ← 3項目なし
  settings: Settings;
  meta: Meta;           // ← remarks を受け取る
  customParts?: CustomPart[];
};
type Item = { id: string; name: string; price: number; qty: number; cat: string; notes?: string };
type ItemEx = Item & { maker?: string; partNo?: string };
type Client = { name: string; phone: string; email: string; address: string };
type Vehicle = {
  registrationNo: string; model: string; modelCode: string; vin: string; engineModel: string;
  mileage: string; firstReg: string; nextInspection: string;
};
type Settings = { company: { name: string; address: string; phone: string; bank: string; logoUrl: string }; tax: { rate: number } };
type CustomPart = { maker?: string; name: string; partNo?: string; unit: number; qty: number };

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

  // 追加：ページ余白とページ設定（ExcelJS の単位は inch）
  const cmToInch = (cm: number) => cm / 2.54;
  
  // ページ設定を初期化
  ws.pageSetup = {
    ...ws.pageSetup,
    paperSize: 9, // A4
    orientation: 'portrait',
    margins: {
      left: 0.7,
      right: 0.7,
      top: cmToInch(1.5), // 1.5cm
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    },
    printArea: undefined,
    printTitlesRow: undefined
  };

  // 1行目の高さを設定（約2.5cm相当）
  ws.getRow(1).height = 70; // Excel のポイント単位（1ポイント = 1/72インチ）
  
  // ★ 追加：App 側で選んだタイトルを A1 に反映
  if (data.meta?.docTitle && String(data.meta.docTitle).trim()) {
    // 既存の結合を解除（エラー回避のため）
    try {
      ws.unMergeCells("A1:F1");
    } catch (e) {
      // 結合されていない場合は無視
    }
    
    // タイトルを設定
    ws.getCell("A1").value = data.meta.docTitle;
    // タイトルを下寄せ・中央配置
    ws.getCell("A1").alignment = { vertical: "bottom", horizontal: "center" };
    
    // A1からF1までを結合して中央に配置
    try {
      ws.mergeCells("A1:F1");
    } catch (e) {
      console.warn("Merge cells warning:", e);
      // 結合に失敗した場合でも、A1の中央配置は維持される
    }
  }

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
  // 自賠責：AppClientの「金額/ヶ月」をExcelでは「単価=金額、個数=1(0円なら0)」に変換
  const jbUnit    = toNum(data.legal.jibaiseki24m.unit); // 金額
  const jbMonths  = toNum(data.legal.jibaiseki24m.qty);  // 月数（表示用）
  const jbQtyXls  = jbUnit > 0 ? 1 : 0;                  // Excel上の個数
  const L9        = jbUnit * jbQtyXls;

  ws.getCell("D9").value = jbUnit;   ws.getCell("D9").numFmt = moneyFmt; // 単価=金額
  ws.getCell("E9").value = jbQtyXls; ws.getCell("E9").numFmt = "0";      // 個数=1(0円なら0)
  ws.getCell("F9").value = L9;       ws.getCell("F9").numFmt = moneyFmt;

  // ラベルを「自賠責保険◯ヶ月」に書き換え（テンプレ内の既存ラベルを検索）
  const jl = findLabelCell(ws, [/自賠責保険/], { rowMin: 7, rowMax: 12 });
  if (jl) {
    ws.getCell(jl.row, jl.col).value = `自賠責保険${jbMonths}ヶ月`;
  }

  // 重量税・印紙は従来通り
  const L10 = toNum(data.legal.weightTax.unit) * toNum(data.legal.weightTax.qty);
  const L11 = toNum(data.legal.stamp.unit)     * toNum(data.legal.stamp.qty);

  ws.getCell("D10").value = toNum(data.legal.weightTax.unit); ws.getCell("D10").numFmt = moneyFmt;
  ws.getCell("E10").value = toNum(data.legal.weightTax.qty);  ws.getCell("E10").numFmt = "0";
  ws.getCell("F10").value = L10;                              ws.getCell("F10").numFmt = moneyFmt;

  ws.getCell("D11").value = toNum(data.legal.stamp.unit); ws.getCell("D11").numFmt = moneyFmt;
  ws.getCell("E11").value = toNum(data.legal.stamp.qty);  ws.getCell("E11").numFmt = "0";
  ws.getCell("F11").value = L11;                          ws.getCell("F11").numFmt = moneyFmt;
    // ★ 追加：手入力部品を items 形式へ変換して結合
// ★ 置換：name に (メーカー)(P/N...) を混ぜず、列で分ける
const partsAsItems: ItemEx[] = (data.customParts ?? []).map((p, idx) => {
  const maker = (p.maker ?? "").trim();
  const pn    = (p.partNo ?? "").trim();
  return {
    id: `custom_${idx}`,
    cat: "部品",
    name: p.name,                       // B列：純粋な品名だけ
    price: toNum(p.unit),               // D列：単価
    qty: Math.max(0, toNum(p.qty)),     // E列：個数
    maker,                              // A列：メーカー
    partNo: pn,                         // C列：部品番号
    notes: "",
  };
});

const allItems: ItemEx[] = [...data.items, ...partsAsItems];



  // 4) 明細（A15:F36）
  const START = 15, TEMPLATE_ROWS = 22, END = START + TEMPLATE_ROWS - 1;
  const used = Math.min(allItems.length, TEMPLATE_ROWS);

for (let r = START; r <= END; r++) {
  ws.getRow(r).hidden = false;
  ["A","B","C","D","E"].forEach(col => { ws.getCell(`${col}${r}`).value = null; });
  // F列（共有数式）は触らない
}


for (let i = 0; i < used; i++) {
  const it   = allItems[i];
  const r    = START + i;
  const qty  = Math.max(0, Number(it.qty || 0));
  const unit = Number(it.price || 0);

  // ★ここを変更：A列にメーカー名、C列に部品番号を書きます（✓/× は書かない）
  ws.getCell(`A${r}`).value = (it as ItemEx).maker ?? "";
  ws.getCell(`B${r}`).value = it.name || "";
  ws.getCell(`C${r}`).value = (it as ItemEx).partNo ?? "";

  ws.getCell(`D${r}`).value = unit; ws.getCell(`D${r}`).numFmt = moneyFmt;
  ws.getCell(`E${r}`).value = qty;  ws.getCell(`E${r}`).numFmt = "0";
  // F列はテンプレートの共有数式に任せる（触らない）


    // F列はテンプレ式があればそのまま
  }
  for (let r = START + used; r <= END; r++) ws.getRow(r).hidden = true;

// 備考を B37 セルに直接書き込む
const remarksText = data.meta?.remarks ?? "";
ws.getCell("B37").value = remarksText;
ws.getCell("B37").alignment = { wrapText: true, vertical: "top" };

// 備考の文字数に基づいて行の高さを調整
if (remarksText) {
  // 1行あたり約40文字として計算（B列からF列までの幅を考慮）
  const estimatedLines = Math.ceil(remarksText.length / 40);
  const minHeight = 15; // 最小高さ
  const heightPerLine = 15; // 1行あたりの高さ
  const calculatedHeight = Math.max(minHeight, estimatedLines * heightPerLine);
  
  // 37行目の高さを設定
  ws.getRow(37).height = calculatedHeight;
  
  // 備考が長い場合（3行以上）、ロゴと住所の位置を調整
  const logoOffset = estimatedLines > 3 ? Math.floor((estimatedLines - 3) * 1) : 0;
} else {
  // 備考がない場合はデフォルトの高さ
  ws.getRow(37).height = 15;
}

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

  // 備考の行数を計算してロゴ位置を決定
  const remarksLines = remarksText ? Math.ceil(remarksText.length / 40) : 1;
  const logoStartRow = 40 + Math.max(0, remarksLines - 3); // 3行を超えた分だけ下にずらす
  const logoEndRow = logoStartRow + 5;

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
    // 備考の長さに応じてロゴ位置を動的に調整
    ws.addImage(imgId, `A${logoStartRow}:A${logoEndRow}`);
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
