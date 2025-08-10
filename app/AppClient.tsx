"use client";
import React, { useEffect, useMemo, useState } from "react";

// ===== xlsx-populate を型に依存せず使うための最小型 =====
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
    outputAsync(): Promise<ArrayBuffer>;
};
type XlsxPopulateLike = { fromDataAsync: (ab: ArrayBuffer) => Promise<WorkbookLite> };

// ---- 型定義（アプリ用） ----
type ServiceDef = {
    id: string;
    cat: string;
    name: string;
    price: number;
    bringIn?: number; // 持込工賃は任意
    notes?: string;
};

type QtyUnit = { unit: number; qty: number };
type QtyUnitDraft = { unit: string; qty: string };

type LegalKey = "jibaiseki24m" | "weightTax" | "stamp";
type Legal = Record<LegalKey, QtyUnit>;
type LegalDraft = Record<LegalKey, QtyUnitDraft>;

type FeeKey = "partsExchangeTech" | "proxy" | "basic";
type Fees = Record<FeeKey, QtyUnit> & { discount: number; deposit: number };
type FeesDraft = Record<FeeKey, QtyUnitDraft> & { discount: string; deposit: string };

// ---- サンプル品目（税込） ----
const SERVICES: readonly ServiceDef[] = [
    { id: "susp_fork_oh_std", cat: "サスペンション系統", name: "フォークOH（正立・カートリッジ無）", price: 24800, bringIn: 49600, notes: "" },
    { id: "susp_fork_oh_cart", cat: "サスペンション系統", name: "フォークOH（倒立・正立カートリッジ式）", price: 29700, bringIn: 59400, notes: "" },
    { id: "brake_pad", cat: "ブレーキ系統", name: "ブレーキパッド（１キャリパー）", price: 2640 },
    { id: "brake_fluid", cat: "ブレーキ系統", name: "ブレーキフルード（１ライン）フルード代別", price: 2500 },
    { id: "drive_125", cat: "駆動系統", name: "駆動系（～125ccまで）", price: 6600 },
    { id: "drive_chain_clip", cat: "駆動系統", name: "チェーン（クリップジョイント）", price: 3800 },
    { id: "intake_air", cat: "吸排気系統", name: "エアエレメント交換", price: 2500 },
    { id: "exhaust_slipon", cat: "吸排気系統", name: "マフラー スリップオン", price: 5000 },
    { id: "inspect_proxy", cat: "車検（２輪）", name: "車検代行費用", price: 10000 },
    { id: "basic_fee", cat: "車検（２輪）", name: "車検整備基本料", price: 19800 },

];

function yen(n: number) {
    if (typeof n !== "number" || Number.isNaN(n)) return "-";
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);
}
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const LS_KEY_SETTINGS = "moto_invoice_settings_v1";

// 数字文字列→数値（空・カンマ許容）
const toNum = (v: string | number) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = v.replace(/,/g, "").trim();
    return s === "" ? 0 : Number(s);
};

export default function AppClient() {
    // 検索・選択
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("ALL");
    const [useBringIn, setUseBringIn] = useState<Record<string, boolean>>({});
    const [qtyDraft, setQtyDraft] = useState<Record<string, number | string>>({});
    const [items, setItems] = useState<{ id: string; name: string; price: number; qty: number; notes?: string; cat: string }[]>([]);

    // 顧客・車両・見積メタ
    const [client, setClient] = useState({ name: "", phone: "", email: "", address: "" });
    const [vehicle, setVehicle] = useState({
        registrationNo: "",
        model: "", modelCode: "", vin: "", engineModel: "",
        mileage: "", firstReg: "", nextInspection: "",
    });
    const [meta, setMeta] = useState({ date: todayISO(), invoiceNo: "INV-" + todayISO().replaceAll("-", "") + "-001" });

    // 事業者情報
    const [settings, setSettings] = useState({
        company: {
            name: "Ti-tech",
            address: "大阪府大阪狭山市大野台6−12−8  589-0023",
            phone: "06-1234-5678",
            bank: "三井住友銀行 ○○支店 普通 1234567 カワタキョウヘイ",
            logoUrl: "/logo.png",
        },
        tax: { rate: 0.10 as number },
    });
    const [showSettings, setShowSettings] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(true);
    // --- 法定費用（非課税）：単価・個数（初期qty=0） ---
    const [legal, setLegal] = useState<Legal>({
        jibaiseki24m: { unit: 0, qty: 0 },
        weightTax: { unit: 0, qty: 0 },
        stamp: { unit: 0, qty: 0 },
    });
    const [legalDraft, setLegalDraft] = useState<LegalDraft>({
        jibaiseki24m: { unit: "", qty: "" },
        weightTax: { unit: "", qty: "" },
        stamp: { unit: "", qty: "" },
    });

    // --- 技術料など（課税）：単価・個数（値引き/預り金は金額） ---
    const [fees, setFees] = useState<Fees>({
        partsExchangeTech: { unit: 0, qty: 0 },
        proxy: { unit: 0, qty: 0 },
        basic: { unit: 0, qty: 0 },
        discount: 0,
        deposit: 0,
    });
    const [feesDraft, setFeesDraft] = useState<FeesDraft>({
        partsExchangeTech: { unit: "", qty: "" },
        proxy: { unit: "", qty: "" },
        basic: { unit: "", qty: "" },
        discount: "",
        deposit: "",
    });

    // LocalStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY_SETTINGS);
            if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
        } catch { }
    }, []);
    useEffect(() => {
        try { localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(settings)); } catch { }
    }, [settings]);

    // 派生
    const categories = useMemo(() => {
        const s = new Set<string>(["ALL"]);
        (SERVICES as readonly ServiceDef[]).forEach((x) => s.add(x.cat));
        return Array.from(s);
    }, []);
    const filtered = useMemo<ServiceDef[]>(() => {
        const kw = q.trim().toLowerCase();
        return (SERVICES as readonly ServiceDef[])
            .filter((s) => (cat === "ALL" || s.cat === cat) && (!kw || (s.name + s.cat).toLowerCase().includes(kw)));
    }, [q, cat]);
    const itemsSubtotal = useMemo(() => items.reduce((a, b) => a + b.price * b.qty, 0), [items]);

    // 計算
    const legalTotal = legal.jibaiseki24m.unit * legal.jibaiseki24m.qty
        + legal.weightTax.unit * legal.weightTax.qty
        + legal.stamp.unit * legal.stamp.qty;        // ① 非課税
    const extrasTotal = fees.partsExchangeTech.unit * fees.partsExchangeTech.qty
        + fees.proxy.unit * fees.proxy.qty
        + fees.basic.unit * fees.basic.qty;     // 課税
    const nonTaxable = legalTotal;                                       // ①
    const taxableBase = itemsSubtotal + extrasTotal;                     // ②
    const taxableAfterDiscount = Math.max(0, taxableBase - Math.max(0, fees.discount || 0));
    const grandTotal = nonTaxable + taxableAfterDiscount;                // ①+②（値引き後）
    const finalDue = Math.max(0, grandTotal - Math.max(0, fees.deposit || 0));

    // 追加・削除
    function addItem(svc: ServiceDef) {
        const usingBringIn = !!useBringIn[svc.id];
        const price = (usingBringIn && typeof svc.bringIn === "number") ? svc.bringIn : svc.price;
        const qn = Math.max(1, Number(qtyDraft[svc.id] || 1));
        setItems((prev) => {
            const idx = prev.findIndex((p) => p.id === svc.id && p.price === price);
            if (idx !== -1) { const next = [...prev]; next[idx] = { ...next[idx], qty: next[idx].qty + qn }; return next; }
            return [...prev, { id: svc.id, name: svc.name, price, qty: qn, notes: svc.notes || "", cat: svc.cat }];
        });
        setQtyDraft((d) => ({ ...d, [svc.id]: 1 }));
    }
    function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }
    function updateQty(i: number, v: string) {
        const n = Math.max(1, Number(v || 1));
        setItems((prev) => prev.map((x, idx) => idx === i ? { ...x, qty: n } : x));
    }

    // ダウンロード共通
    function downloadBlob(filename: string, blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ==================== Excel 出力 ====================
    async function exportExcel() {
        try {
            const payload = { client, vehicle, items, legal, fees, settings, meta };
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`エクスポートに失敗しました: ${res.status} ${txt}`);
            }
            const blob = await res.blob();
            downloadBlob(`estimate_${meta.invoiceNo}.xlsx`, blob);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            alert(`Excel出力でエラーが発生しました。\n${msg}`);
        }
    }

    // --------------------------- UI ---------------------------
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden">
            {/* ヘッダ */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={settings.company.logoUrl || "/logo.png"}
                        alt="logo"
                        className="w-9 h-9 rounded object-cover ring-1 ring-slate-200"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="font-semibold">車検整備 見積書ビルダー</div>
                    <div className="ml-auto text-xs text-slate-600 whitespace-normal break-words max-w-[55vw]">
                        {settings.company.address} ｜ {settings.company.phone}
                    </div>
                    <button type="button" onClick={() => setShowSettings(true)} className="ml-3 px-2.5 py-1.5 rounded-lg border text-xs bg-white hover:bg-slate-50">
                        設定
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 左：検索・顧客・車両 */}
                <section className="md:col-span-3">
                    {/* === 顧客情報ボックス（スマホは折りたたみ可 / 初期オープン） === */}
                    <div className="bg-white rounded-2xl shadow-sm border p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">顧客情報</div>
                            {/* モバイルのみトグルボタン表示（md以上は常時展開） */}
                            <button
                                type="button"
                                onClick={() => setCustomerOpen((o) => !o)}
                                className="md:hidden inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-50"
                                aria-expanded={customerOpen}
                                aria-controls="customer-panel"
                            >
                                {customerOpen ? "閉じる" : "開く"}
                                <svg
                                    className={`w-3 h-3 transition-transform ${customerOpen ? "rotate-180" : "rotate-0"}`}
                                    viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                                >
                                    <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
                                </svg>
                            </button>
                        </div>

                        {/* 中身はスマホで開閉 / md以上は常に表示 */}
                        <div id="customer-panel" className={`${customerOpen ? "block" : "hidden"} md:block`}>
                            <div className="grid gap-2 text-sm mt-3">
                                <input className="border rounded-lg px-3 py-2" placeholder="宛名（氏名/会社）" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="電話" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="Email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="住所" value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} />
                            </div>

                            <div className="text-sm font-semibold mt-4 mb-2">車両情報</div>
                            <div className="grid gap-2 text-sm">
                                <input className="border rounded-lg px-3 py-2" placeholder="登録番号" value={vehicle.registrationNo} onChange={(e) => setVehicle({ ...vehicle, registrationNo: e.target.value })} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input className="border rounded-lg px-3 py-2" placeholder="車名" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
                                    <input className="border rounded-lg px-3 py-2" placeholder="型式" value={vehicle.modelCode} onChange={(e) => setVehicle({ ...vehicle, modelCode: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input className="border rounded-lg px-3 py-2" placeholder="車台番号" value={vehicle.vin} onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })} />
                                    <input className="border rounded-lg px-3 py-2" placeholder="原動機型式" value={vehicle.engineModel} onChange={(e) => setVehicle({ ...vehicle, engineModel: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input className="border rounded-lg px-3 py-2" placeholder="走行距離 (km)" value={vehicle.mileage} onChange={(e) => setVehicle({ ...vehicle, mileage: e.target.value })} />
                                    <input className="border rounded-lg px-3 py-2" placeholder="初年度登録" value={vehicle.firstReg} onChange={(e) => setVehicle({ ...vehicle, firstReg: e.target.value })} />
                                </div>
                                <input className="border rounded-lg px-3 py-2" placeholder="次回車検有効期限" value={vehicle.nextInspection} onChange={(e) => setVehicle({ ...vehicle, nextInspection: e.target.value })} />
                            </div>

                            {/* 法定費用（非課税） 単価/個数 */}
                            <div className="text-sm font-semibold mt-4 mb-2">法定費用（非課税）</div>
                            <div className="grid gap-2 text-sm">
                                {([
                                    { key: "jibaiseki24m", label: "自賠責保険" },
                                    { key: "weightTax", label: "重量税" },
                                    { key: "stamp", label: "印紙代" },
                                ] as { key: LegalKey; label: string }[]).map(({ key, label }) => {
                                    const isJibai = key === "jibaiseki24m"; // ★自賠責だけ表示を変える
                                    return (
                                        <div key={key} className="grid grid-cols-12 items-center gap-2">
                                            <span className="col-span-6 sm:col-span-5">{label}</span>

                                            {/* 左入力：自賠責=「ヶ月」／その他=「単価」 */}
                                            <input
                                                type="text" inputMode="numeric" pattern="\d*"
                                                className="col-span-3 sm:col-span-3 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "金額" : "単価"}
                                                value={legalDraft[key].unit}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], unit: e.target.value.replace(/[^\d,]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: toNum(legalDraft[key].unit), qty: p[key].qty } }))}
                                            />

                                            {/* 右入力：自賠責=「金額」／その他=「個数」 */}
                                            <input
                                                type="text" inputMode="numeric" pattern="\d*"
                                                className="col-span-3 sm:col-span-2 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "ヶ月" : "個数"}
                                                value={legalDraft[key].qty}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], qty: e.target.value.replace(/[^\d,]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: p[key].unit, qty: toNum(legalDraft[key].qty) } }))}
                                            />

                                            <div className="col-span-12 sm:col-span-2 text-right">
                                                {key === "jibaiseki24m" && yen(legal.jibaiseki24m.unit * legal.jibaiseki24m.qty)}
                                                {key === "weightTax" && yen(legal.weightTax.unit * legal.weightTax.qty)}
                                                {key === "stamp" && yen(legal.stamp.unit * legal.stamp.qty)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* === 品目検索ボックス（後ろに移動） === */}
                    <div className="bg-white rounded-2xl shadow-sm border p-3 mt-4">
                        <div className="text-sm font-semibold mb-2">品目検索</div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="キーワード検索"
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                        />
                        <div className="mt-3 text-sm font-semibold mb-1">カテゴリー</div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCat(c)}
                                    className={`px-3 py-1.5 rounded-full border text-xs ${cat === c ? "bg-sky-600 text-white border-sky-600" : "bg-white hover:bg-slate-100"}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>


                {/* 中央：品目追加 */}
                <section className="md:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border p-3">
                        <div className="text-sm font-semibold mb-2">品目一覧（{filtered.length}件）</div>
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="品目検索" className="w-full rounded-xl border px-3 py-2 text-sm mb-3" />
                        <div className="grid gap-3">
                            {filtered.map((s: ServiceDef) => (
                                <div key={s.id} className="border rounded-xl p-3 hover:shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-slate-500">{s.cat}</div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <div>通常: <span className="font-semibold">{yen(s.price)}</span></div>
                                            {typeof s.bringIn === "number" && <div className="mt-0.5">持込: <span className="font-semibold">{yen(s.bringIn)}</span></div>}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-3">
                                        {typeof s.bringIn === "number" && (
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={!!useBringIn[s.id]} onChange={(e) => setUseBringIn({ ...useBringIn, [s.id]: (e.target as HTMLInputElement).checked })} />
                                                <span>部品持込工賃を使う</span>
                                            </label>
                                        )}
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input type="number" min={1} value={qtyDraft[s.id] ?? 1} onChange={(e) => setQtyDraft({ ...qtyDraft, [s.id]: (e.target as HTMLInputElement).value })} className="w-24 border rounded-lg px-3 py-1.5 text-sm" />
                                            <button type="button" onClick={() => addItem(s)} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700">追加</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 右：プレビュー & 出力 */}
                <section className="md:col-span-4">
                    <div className="bg-white rounded-2xl shadow-sm border p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">見積プレビュー</div>
                            <button type="button" onClick={() => setItems([])} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">明細クリア</button>
                        </div>

                        <div className="mt-2 border rounded-xl divide-y">
                            {items.length === 0 && <div className="p-4 text-sm text-slate-500">品目を追加するとここに表示されます。</div>}
                            {items.map((it, idx) => (
                                <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm break-words">{it.name}</div>
                                        <div className="text-xs text-slate-500">{it.cat} / 単価 {yen(it.price)}</div>
                                    </div>
                                    <input type="number" min={1} value={it.qty} onChange={(e) => updateQty(idx, (e.target as HTMLInputElement).value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm" />
                                    <div className="w-28 text-right text-sm font-semibold">{yen(it.price * it.qty)}</div>
                                    <button type="button" onClick={() => removeItem(idx)} className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100">削除</button>
                                </div>
                            ))}
                        </div>

                        {/* 技術料など（課税） 単価/個数 */}
                        <div className="mt-4 grid gap-2 text-sm">
                            {([
                                { key: "partsExchangeTech", label: "部品交換技術料" },
                                { key: "proxy", label: "車検代行料" },
                                { key: "basic", label: "車検整備基本料" },
                            ] as { key: FeeKey; label: string }[]).map(({ key, label }) => (
                                <div key={key} className="grid grid-cols-12 items-center gap-2">
                                    <span className="col-span-6 sm:col-span-5">{label}</span>
                                    <input
                                        type="text" inputMode="numeric" pattern="\d*"
                                        className="col-span-3 sm:col-span-3 w-full border rounded px-2 py-1 text-right"
                                        placeholder="単価"
                                        value={feesDraft[key].unit}
                                        onChange={(e) => setFeesDraft((p) => ({ ...p, [key]: { ...p[key], unit: e.target.value.replace(/[^\d,]/g, '') } }))}
                                        onBlur={() => setFees((p) => ({ ...p, [key]: { unit: toNum(feesDraft[key].unit), qty: p[key].qty } }))}
                                    />
                                    <input
                                        type="text" inputMode="numeric" pattern="\d*"
                                        className="col-span-3 sm:col-span-2 w-full border rounded px-2 py-1 text-right"
                                        placeholder="個数"
                                        value={feesDraft[key].qty}
                                        onChange={(e) => setFeesDraft((p) => ({ ...p, [key]: { ...p[key], qty: e.target.value.replace(/[^\d,]/g, '') } }))}
                                        onBlur={() => setFees((p) => ({ ...p, [key]: { unit: p[key].unit, qty: toNum(feesDraft[key].qty) } }))}
                                    />
                                    <div className="col-span-12 sm:col-span-2 text-right font-semibold">
                                        {key === "partsExchangeTech" && yen(fees.partsExchangeTech.unit * fees.partsExchangeTech.qty)}
                                        {key === "proxy" && yen(fees.proxy.unit * fees.proxy.qty)}
                                        {key === "basic" && yen(fees.basic.unit * fees.basic.qty)}
                                    </div>
                                </div>
                            ))}

                            {/* 値引き・預り金（金額） */}
                            <div className="grid grid-cols-12 items-center gap-2">
                                <span className="col-span-6 sm:col-span-5">調整値引き</span>
                                <input
                                    type="text" inputMode="numeric" pattern="\d*"
                                    className="col-span-6 sm:col-span-7 w-full border rounded px-3 py-1.5 text-right"
                                    value={feesDraft.discount}
                                    onChange={(e) => setFeesDraft({ ...feesDraft, discount: e.target.value.replace(/[^\d,]/g, '') })}
                                    onBlur={() => setFees({ ...fees, discount: toNum(feesDraft.discount) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <span className="col-span-6 sm:col-span-5">預り金</span>
                                <input
                                    type="text" inputMode="numeric" pattern="\d*"
                                    className="col-span-6 sm:col-span-7 w-full border rounded px-3 py-1.5 text-right"
                                    value={feesDraft.deposit}
                                    onChange={(e) => setFeesDraft({ ...feesDraft, deposit: e.target.value.replace(/[^\d,]/g, '') })}
                                    onBlur={() => setFees({ ...fees, deposit: toNum(feesDraft.deposit) })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex items-center justify-between"><div>非課税小計(法定費用)</div><div className="font-semibold">{yen(nonTaxable)}</div></div>
                            <div className="flex items-center justify-between"><div>10%対象合計(値引前)</div><div className="font-semibold">{yen(taxableBase)}</div></div>
                            <div className="flex items-center justify-between"><div>合計(①+②)</div><div className="font-semibold">{yen(nonTaxable + taxableBase)}</div></div>
                            <div className="flex items-center justify-between text-base mt-1">
                                <div className="font-semibold">差引合計</div>
                                <div className="font-bold text-lg">{yen(finalDue)}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => exportExcel()}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 w-full sm:w-auto"
                            >
                                Excel(.xlsx)に出力
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* 設定モーダル */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="font-semibold">事業者情報・税設定</div>
                            <button type="button" className="text-sm px-3 py-1 rounded border" onClick={() => setShowSettings(false)}>閉じる</button>
                        </div>
                        <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
                            <div className="grid gap-2">
                                <div className="font-medium text-slate-700">事業者情報</div>
                                <input className="border rounded-lg px-3 py-2" placeholder="屋号" value={settings.company.name} onChange={(e) => setSettings({ ...settings, company: { ...settings.company, name: (e.target as HTMLInputElement).value } })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="住所" value={settings.company.address} onChange={(e) => setSettings({ ...settings, company: { ...settings.company, address: (e.target as HTMLInputElement).value } })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="電話" value={settings.company.phone} onChange={(e) => setSettings({ ...settings, company: { ...settings.company, phone: (e.target as HTMLInputElement).value } })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="振込（銀行名 支店 種別 口座名義 など）" value={settings.company.bank} onChange={(e) => setSettings({ ...settings, company: { ...settings.company, bank: (e.target as HTMLInputElement).value } })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="ロゴURL (/logo.png など)" value={settings.company.logoUrl} onChange={(e) => setSettings({ ...settings, company: { ...settings.company, logoUrl: (e.target as HTMLInputElement).value } })} />
                            </div>
                            <div className="grid gap-2">
                                <div className="font-medium text-slate-700">見積情報</div>
                                <input className="border rounded-lg px-3 py-2" placeholder="日付" type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: (e.target as HTMLInputElement).value })} />
                                <input className="border rounded-lg px-3 py-2" placeholder="見積番号" value={meta.invoiceNo} onChange={(e) => setMeta({ ...meta, invoiceNo: (e.target as HTMLInputElement).value })} />
                                <div className="text-xs text-slate-500">※ 税は内税想定。Excelは添付テンプレに準拠。</div>
                            </div>
                        </div>
                        <div className="p-4 border-t text-right">
                            <button type="button" className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm hover:bg-sky-700" onClick={() => setShowSettings(false)}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="max-w-7xl mx-auto px-4 pb-8 mt-4 text-xs text-slate-500"></footer>
        </div>
    );
}
