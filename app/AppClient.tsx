"use client";
import React, { useEffect, useMemo, useState } from "react";




// ---- 型定義（アプリ用） ----
type ServiceDef = {
    id: string;
    vehicleType: '2輪' | '4輪';  // 車種タイプ（2輪・4輪）
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

type Fees = { discount: number; deposit: number };
type FeesDraft = { discount: string; deposit: string };
type CustomPart = { maker: string; name: string; partNo: string; unit: number; qty: number; unitDraft?: string; qtyDraft?: string };
// ---- サンプル品目（税込） ----
const SERVICES: readonly ServiceDef[] = [
    // 4輪車サービス
    { id: "4w_inspection", vehicleType: "4輪", cat: "車検（４輪）", name: "法定点検一式", price: 25000, notes: "点検および調整、法定費用含む" },
    { id: "4w_inspection_agency", vehicleType: "4輪", cat: "車検（４輪）", name: "車検代行費用", price: 10000 },
    
    // 4輪エンジン系統
    { id: "4w_engine_removal", vehicleType: "4輪", cat: "エンジン系統", name: "エンジン脱着", price: 80000 },
    { id: "4w_engine_overhaul", vehicleType: "4輪", cat: "エンジン系統", name: "エンジンフルオーバーホール", price: 200000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_head_overhaul", vehicleType: "4輪", cat: "エンジン系統", name: "ヘッドオーバーホール", price: 120000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_valve_stem_seal", vehicleType: "4輪", cat: "エンジン系統", name: "バルブステムシール交換", price: 2000, notes: "1箇所あたり、別途エンジン脱着等が必要" },
    { id: "4w_cam_chain", vehicleType: "4輪", cat: "エンジン系統", name: "カムチェーン交換", price: 24000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_head_cover_gasket", vehicleType: "4輪", cat: "エンジン系統", name: "ヘッドカバーパッキン交換", price: 5000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_piston", vehicleType: "4輪", cat: "エンジン系統", name: "ピストン交換", price: 18000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_crank", vehicleType: "4輪", cat: "エンジン系統", name: "クランク交換", price: 14000, notes: "別途エンジン脱着等が必要" },
    { id: "4w_sensor", vehicleType: "4輪", cat: "エンジン系統", name: "各種センサー交換", price: 4000 },
    { id: "4w_oil_pump", vehicleType: "4輪", cat: "エンジン系統", name: "オイルポンプ交換", price: 5000, notes: "別途オイルパン脱着等が必要" },
    { id: "4w_water_pump", vehicleType: "4輪", cat: "エンジン系統", name: "ウォーターポンプ交換", price: 5000, notes: "別途補器類脱着等が必要" },
    { id: "4w_spark_plug", vehicleType: "4輪", cat: "エンジン系統", name: "スパークプラグ交換", price: 1500, notes: "1本あたり" },
    { id: "4w_direct_coil", vehicleType: "4輪", cat: "エンジン系統", name: "ダイレクトコイル交換", price: 2000, notes: "1本あたり" },
    { id: "4w_turbin", vehicleType: "4輪", cat: "エンジン系統", name: "タービン交換", price: 14000, notes: "別途エキゾースト等脱着が必要" },
    { id: "4w_intake_manifold", vehicleType: "4輪", cat: "エンジン系統", name: "インマニ脱着", price: 15000 },
    { id: "4w_engine_mount", vehicleType: "4輪", cat: "エンジン系統", name: "エンジンマウント交換", price: 30000 },

    // 4輪ミッション系統
    { id: "4w_transmission_removal", vehicleType: "4輪", cat: "ミッション系統", name: "トランスミッション脱着", price: 60000, notes: "別途ミッション脱着が必要" },
    { id: "4w_transmission_overhaul", vehicleType: "4輪", cat: "ミッション系統", name: "ミッションオーバーホール", price: 150000, notes: "別途ミッション脱着が必要" },
    { id: "4w_mt_transmission", vehicleType: "4輪", cat: "ミッション系統", name: "MTミッション交換", price: 60000 },
    { id: "4w_clutch", vehicleType: "4輪", cat: "ミッション系統", name: "クラッチ交換", price: 15000, notes: "別途ミッション脱着が必要" },
    { id: "4w_front_seal", vehicleType: "4輪", cat: "ミッション系統", name: "フロントシール交換", price: 4000, notes: "別途ミッション脱着が必要" },
    { id: "4w_rear_seal", vehicleType: "4輪", cat: "ミッション系統", name: "リアシール交換", price: 4000, notes: "別途ミッション脱着が必要" },
    { id: "4w_mission_oil", vehicleType: "4輪", cat: "ミッション系統", name: "ミッションオイル交換", price: 2000 },
    { id: "4w_atf", vehicleType: "4輪", cat: "ミッション系統", name: "ATF交換", price: 4000 },
    { id: "4w_at_transmission", vehicleType: "4輪", cat: "ミッション系統", name: "ATミッション交換", price: 65000 },

    // 4輪タイヤ系統
    { id: "4w_tire_change", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤ交換", price: 1500, notes: "1本あたり" },
    { id: "4w_tire_balance", vehicleType: "4輪", cat: "タイヤ系統", name: "バランス取り", price: 1500, notes: "1本あたり" },
    { id: "4w_tire_rotation", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤローテーション", price: 2500 },
    { id: "4w_puncture_repair", vehicleType: "4輪", cat: "タイヤ系統", name: "パンク修理", price: 2000, notes: "1箇所あたり" },
    { id: "4w_tire_disposal", vehicleType: "4輪", cat: "タイヤ系統", name: "廃タイヤ処分", price: 500, notes: "1本あたり" },
    { id: "4w_tire_mount", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤ履き替え", price: 4500 },

    // 2輪車サービス
    { id: "2w_inspection", vehicleType: "2輪", cat: "車検（２輪）", name: "法定点検一式", price: 24000, notes: "点検および調整、法定費用含む" },
    { id: "2w_inspection_agency", vehicleType: "2輪", cat: "車検（２輪）", name: "車検代行費用", price: 10000 },

    // 2輪タイヤ系統
    { id: "2w_tire_front_cast", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 合わせホイール（フロント）", price: 5700, bringIn: 11400, notes: "ホイールバランス取れません" },
    { id: "2w_tire_rear_cast", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 合わせホイール（リア）", price: 6800, bringIn: 13600, notes: "同時リヤスプロケット交換無料" },
    { id: "2w_tire_front_domestic", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換フロント 国産", price: 4400, bringIn: 8800, notes: "ホイールバランスサービス" },
    { id: "2w_tire_front_import", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換フロント 外車", price: 6600, bringIn: 13200, notes: "ホイールバランスサービス" },
    { id: "2w_tire_rear_domestic", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換リア 国産", price: 5500, bringIn: 11000, notes: "ホイールバランスサービス" },
    { id: "2w_tire_rear_import", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換リア 外車", price: 8200, bringIn: 16400, notes: "ホイールバランスサービス" },
    { id: "2w_tire_puncture", vehicleType: "2輪", cat: "タイヤ系統", name: "パンク修理", price: 2500, notes: "1ヶ所" },
    
    // 2輪潤滑・冷却系統
    { id: "2w_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "オイル交換", price: 1100, bringIn: 2200, notes: "パーツ脱着必要時は別途工賃" },
    { id: "2w_oil_element", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "オイル＋エレメント交換", price: 1980, bringIn: 3960, notes: "DCTフィルター+880円" },
    { id: "2w_llc_126", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "LLC交換 126cc～", price: 8600, bringIn: 17200, notes: "カウル、タンク脱着含む" },
    { id: "2w_llc_125", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "LLC交換 ～125cc", price: 5500, bringIn: 11000, notes: "カウル、タンク脱着含む" },
    
    // 2輪エンジン修理（4st）
    { id: "2w_4st_engine_removal", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジン脱着", price: 52000, notes: "カウル脱着別途" },
    { id: "2w_4st_engine_full_oh", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジンフルオーバーホール", price: 200000, notes: "シングル120,000円、別途エンジン脱着等必要" },
    { id: "2w_4st_engine_upper_oh", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジン腰上オーバーホール", price: 100000, notes: "シングル60,000円、別途エンジン脱着等必要" },
    { id: "2w_4st_head_oh", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ヘッドオーバーホール", price: 60000, notes: "シングル40,000円、別途エンジン脱着等必要" },

    // 2輪エンジン修理（2st）
    { id: "2w_2st_engine_removal", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジン脱着", price: 31200, notes: "レーサー等シングル8,000円、カウル脱着別途" },
    { id: "2w_2st_engine_full_oh", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジンフルオーバーホール", price: 32500, notes: "レーサー等シングル24,000円、別途エンジン脱着等必要" },
    { id: "2w_2st_engine_upper_oh", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジン腰上オーバーホール", price: 16900, notes: "レーサー等シングル12,000円、別途エンジン脱着等必要" },

    // 2輪吸排気系統
    { id: "2w_air_element", vehicleType: "2輪", cat: "吸排気系統", name: "エアエレメント交換", price: 2500, bringIn: 5000, notes: "カウル、タンク脱着別途" },
    { id: "2w_carb_oh_125", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH ～125cc", price: 9900, notes: "タンク脱着込み、同調/CO・HC測定込み" },
    { id: "2w_carb_oh_single", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH シングル", price: 14900, notes: "タンク脱着込み、同調/CO・HC測定込み" },
    { id: "2w_carb_oh_twin", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH 2気筒", price: 24800, notes: "タンク脱着込み、同調/CO・HC測定込み" },
    { id: "2w_carb_oh_multi", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH 3気筒以上", price: 33000, notes: "タンク脱着込み、同調/CO・HC測定込み" },
    { id: "2w_muffler_twin", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 2気筒以上", price: 14900, bringIn: 29800, notes: "カウル脱着別途" },
    { id: "2w_muffler_single", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 シングル・スクーター", price: 6600, bringIn: 13200, notes: "カウル脱着別途" },
    { id: "2w_muffler_slipon", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 スリップオン", price: 5000, bringIn: 10000, notes: "カウル脱着別途" },

    // 2輪ブレーキ系統
    { id: "2w_brake_pad", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキパッド交換", price: 2640, bringIn: 5280, notes: "1キャリパー、清掃含む" },
    { id: "2w_brake_fluid", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキフルード交換", price: 2900, notes: "1ライン、フルード代込み" },
    { id: "2w_brake_hose_single", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキホース交換（シングル）", price: 6600, bringIn: 13200, notes: "カウル脱着別途" },
    { id: "2w_brake_hose_double", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキホース交換（ダブル）", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },
    { id: "2w_caliper_single", vehicleType: "2輪", cat: "ブレーキ系統", name: "キャリパー交換（シングル）", price: 9900, bringIn: 19800, notes: "純正6,100円、ブレーキフルード代込み" },
    { id: "2w_caliper_double", vehicleType: "2輪", cat: "ブレーキ系統", name: "キャリパー交換（ダブル）", price: 11600, bringIn: 23200, notes: "純正8,600円、ブレーキフルード代込み" },

    // その他作業・一般工賃
    { id: "general_domestic", vehicleType: "2輪", cat: "その他作業", name: "国産車（1時間）", price: 10000 },
    { id: "general_import", vehicleType: "2輪", cat: "その他作業", name: "輸入車（1時間）", price: 15000 },
    { id: "general_special", vehicleType: "2輪", cat: "その他作業", name: "特殊車両（1時間）", price: 20000 },

    // レーシングサービス
    { id: "racing_mechanic", vehicleType: "2輪", cat: "レーシングサービス", name: "メカニック帯同（1日）", price: 33000, notes: "交通費別途、ピットクルーライセンス登録込み" },
    { id: "racing_data", vehicleType: "2輪", cat: "レーシングサービス", name: "データロギング", price: 11000 },
    { id: "racing_setup", vehicleType: "2輪", cat: "レーシングサービス", name: "マシンセットアップ", price: 11000 },
    { id: "racing_full", vehicleType: "2輪", cat: "レーシングサービス", name: "上記フルパック（1日）", price: 44000 }
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
// 未使用のため削除
// const toIntSafe = (raw: string) => {
//     if (typeof raw !== "string") return 0;
//     const half = raw.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
//     const cleaned = half.replace(/[^\d]/g, "");
//     return cleaned ? Number(cleaned) : 0;
// };
const toDecimalSafe = (raw: string, decimalPlaces: number = 1) => {
    if (typeof raw !== "string") return 0;
    // 全角数字を半角に変換
    const half = raw.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
                    .replace(/．/g, '.'); // 全角ピリオドも半角に
    // 数字と小数点以外を削除
    const cleaned = half.replace(/[^\d.]/g, "");
    // 複数の小数点がある場合は最初の1つだけ残す
    const parts = cleaned.split('.');
    const formatted = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    
    const num = Number(formatted);
    if (!Number.isFinite(num)) return 0;
    
    // 小数点以下の桁数を制限
    return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
};
// 未使用のため削除
// const asInput = (n: number) => (Number.isFinite(n) ? String(n) : "");

function isComposingNative(ev: unknown): boolean {
    const obj = ev as { isComposing?: boolean };
    return obj?.isComposing === true;
}
export default function AppClient() {
    //自由部品入力
    const [customParts, setCustomParts] = useState<CustomPart[]>([
        { maker: "", name: "", partNo: "", unit: 0, qty: 0 },
    ]);
    // 検索・選択
    const [q, setQ] = useState("");
    const [vehicleType, setVehicleType] = useState<'2輪' | '4輪' | 'ALL'>('ALL');
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
    const [meta, setMeta] = useState({
        date: todayISO(),
        invoiceNo: "INV-" + todayISO().replaceAll("-", "") + "-001",
        docTitle: "車検見積書", // ★追加：初期タイトル
        remarks: "",  
    });
    // 事業者情報
    const [settings, setSettings] = useState({
        company: {
            name: "Ti-tech",
            address: "大阪府大阪狭山市大野台6-12-8  589-0023",
            phone: "06-1234-5678",
            bank: "三井住友銀行 ○○支店 普通 1234567 名前",
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
const [fees, setFees] = useState<Fees>({ discount: 0, deposit: 0 });
const [feesDraft, setFeesDraft] = useState<FeesDraft>({ discount: "", deposit: "" });
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
        (SERVICES as readonly ServiceDef[])
            .filter((x) => vehicleType === "ALL" || x.vehicleType === vehicleType)
            .forEach((x) => s.add(x.cat));
        return Array.from(s);
    }, [vehicleType]);
    
    const filtered = useMemo<ServiceDef[]>(() => {
        const kw = q.trim().toLowerCase();
        return (SERVICES as readonly ServiceDef[])
            .filter((s) => 
                (vehicleType === "ALL" || s.vehicleType === vehicleType) &&
                (cat === "ALL" || s.cat === cat) && 
                (!kw || (s.name + s.cat).toLowerCase().includes(kw))
            );
    }, [q, vehicleType, cat]);
    
    // 車種タイプが変更されたときにカテゴリをリセット
    useEffect(() => {
        setCat("ALL");
    }, [vehicleType]);
    
    const itemsSubtotal = useMemo(() => items.reduce((a, b) => a + b.price * b.qty, 0), [items]);

    // 計算
    const jibaiLine = legal.jibaiseki24m.unit > 0 ? legal.jibaiseki24m.unit : 0;
    const legalTotal = jibaiLine
        + legal.weightTax.unit * legal.weightTax.qty
        + legal.stamp.unit * legal.stamp.qty;        // ① 非課税
    const nonTaxable = legalTotal;                                    // ①

    const customSubtotal = useMemo(
        () => customParts.reduce((a, p) => a + (p.unit || 0) * (p.qty || 0), 0),
        [customParts]
    );
    // 課税対象合計を変更
const taxableBase = itemsSubtotal + customSubtotal; // ②: 課税ベースは品目+手入力部品のみ
const taxableAfterDiscount = Math.max(0, taxableBase - Math.max(0, fees.discount || 0));
const grandTotal = nonTaxable + taxableAfterDiscount; // ①+②（値引き後）
const finalDue = Math.max(0, grandTotal - Math.max(0, fees.deposit || 0));

// 追加: 内消費税（テンプレの方針に合わせ「内税方式」で参考表示）
const taxRate = settings.tax.rate ?? 0.10;
const internalTax = Math.floor(taxableAfterDiscount * taxRate / (1 + taxRate));


    // 追加・削除
    function addItem(svc: ServiceDef) {
        const usingBringIn = !!useBringIn[svc.id];
        const price = (usingBringIn && typeof svc.bringIn === "number") ? svc.bringIn : svc.price;
        const qn = Math.max(0.1, Number(qtyDraft[svc.id] || 1));
        setItems((prev) => {
            const idx = prev.findIndex((p) => p.id === svc.id && p.price === price);
            if (idx !== -1) { const next = [...prev]; next[idx] = { ...next[idx], qty: next[idx].qty + qn }; return next; }
            return [...prev, { id: svc.id, name: svc.name, price, qty: qn, notes: svc.notes || "", cat: svc.cat }];
        });
        setQtyDraft((d) => ({ ...d, [svc.id]: 1 }));
    }
    function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }
    function updateQty(i: number, v: string) {
        const n = Math.max(0.1, Number(v || 0.1));
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
            const payload = { client, vehicle, items, legal, fees, settings, meta, customParts }; // ★ここを追加
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
                    <div className="font-semibold">Ti-Tech見積書・請求書ビルダー</div>
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
                                                type="text" inputMode="decimal"
                                                className="col-span-3 sm:col-span-3 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "金額" : "単価"}
                                                value={legalDraft[key].unit}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], unit: e.target.value.replace(/[^\d,.]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: toNum(legalDraft[key].unit), qty: p[key].qty } }))}
                                            />

                                            {/* 右入力：自賠責=「金額」／その他=「個数」 */}
                                            <input
                                                type="text" inputMode="decimal"
                                                className="col-span-3 sm:col-span-2 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "ヶ月" : "個数"}
                                                value={legalDraft[key].qty}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], qty: e.target.value.replace(/[^\d,.]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: p[key].unit, qty: toNum(legalDraft[key].qty) } }))}
                                            />

                                            <div className="col-span-12 sm:col-span-2 text-right">
                                                {key === "jibaiseki24m" && yen(legal.jibaiseki24m.unit)} {/* ← ×qtyしない */}
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
                        
                        <div className="mt-3 text-sm font-semibold mb-1">車種タイプ</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(['ALL', '2輪', '4輪'] as const).map((vt) => (
                                <button
                                    key={vt}
                                    type="button"
                                    onClick={() => setVehicleType(vt)}
                                    className={`px-3 py-1.5 rounded-full border text-xs ${vehicleType === vt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-100"}`}
                                >
                                    {vt === 'ALL' ? '全て' : vt}
                                </button>
                            ))}
                        </div>
                        
                        <div className="text-sm font-semibold mb-1">カテゴリー</div>
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
                                        <div className="flex-1">
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-slate-500">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">{s.vehicleType}</span>
                                                {s.cat}
                                            </div>
                                            {s.notes && <div className="text-xs text-blue-600 mt-1">{s.notes}</div>}
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
                                                <span>部品持込</span>
                                            </label>
                                        )}
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input type="number" inputMode="decimal" min={0.1} step={0.1} value={qtyDraft[s.id] ?? 1} onChange={(e) => setQtyDraft({ ...qtyDraft, [s.id]: (e.target as HTMLInputElement).value })} className="w-24 border rounded-lg px-3 py-1.5 text-sm" />
                                            <button type="button" onClick={() => addItem(s)} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700">追加</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* === 手入力部品 === */}
                    <div className="bg-white rounded-2xl shadow-sm border p-3 mt-4">
                        <div className="text-sm font-semibold mb-2">手入力部品</div>

                        {/* 列見出しでガイドを明確化 - デスクトップのみ表示 */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] text-slate-500 mb-1 px-1">
                            <div className="col-span-2">メーカー</div>
                            <div className="col-span-3">品目</div>
                            <div className="col-span-3">部品番号</div>
                            <div className="col-span-2 text-right">金額(円)</div>
                            <div className="col-span-1 text-right">個数</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="grid gap-3">
                            {customParts.map((p, idx) => (
                                <div key={idx} className="border rounded-xl p-3">
                                    {/* スマホ用：縦並びレイアウト */}
                                    <div className="grid grid-cols-1 gap-2 sm:hidden">
                                        <div>
                                            <label className="text-[10px] text-slate-500">メーカー</label>
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                placeholder="例: NGK"
                                                value={p.maker}
                                                onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, maker: e.target.value } : x))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500">品目</label>
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                placeholder="例: スパークプラグ"
                                                value={p.name}
                                                onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500">部品番号</label>
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                placeholder="例: DPR8EA-9"
                                                value={p.partNo}
                                                onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, partNo: e.target.value } : x))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500">金額(円)</label>
                                                <input
                                                    className="w-full border rounded px-2 py-1 text-right text-sm"
                                                    inputMode="decimal"
                                                    placeholder="例: 1500"
                                                    value={p.unitDraft ?? (p.unit ? String(p.unit) : "")}
                                                    onChange={(e) => {
                                                        if (isComposingNative(e.nativeEvent)) return;
                                                        setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unitDraft: e.target.value } : x));
                                                    }}
                                                    onBlur={(e) => {
                                                        const n = toDecimalSafe(e.target.value, 1);
                                                        setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unit: n, unitDraft: undefined } : x));
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500">個数</label>
                                                <input
                                                    className="w-full border rounded px-2 py-1 text-right text-sm"
                                                    inputMode="decimal"
                                                    placeholder="例: 2.5"
                                                    value={p.qtyDraft ?? (p.qty ? String(p.qty) : "")}
                                                    onChange={(e) => {
                                                        if (isComposingNative(e.nativeEvent)) return;
                                                        setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qtyDraft: e.target.value } : x));
                                                    }}
                                                    onBlur={(e) => {
                                                        const n = Math.max(0, toDecimalSafe(e.target.value, 1));
                                                        setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qty: n, qtyDraft: undefined } : x));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCustomParts(cs => cs.filter((_, i) => i !== idx))}
                                            className="w-full text-xs px-3 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                        >
                                            削除
                                        </button>
                                    </div>

                                    {/* デスクトップ用：横並びレイアウト */}
                                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                                        <input
                                            className="col-span-2 border rounded px-2 py-1 text-sm"
                                            placeholder="例: NGK"
                                            value={p.maker}
                                            onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, maker: e.target.value } : x))}
                                        />
                                        <input
                                            className="col-span-3 border rounded px-2 py-1 text-sm"
                                            placeholder="例: スパークプラグ"
                                            value={p.name}
                                            onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                        />
                                        <input
                                            className="col-span-3 border rounded px-2 py-1 text-sm"
                                            placeholder="例: DPR8EA-9"
                                            value={p.partNo}
                                            onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, partNo: e.target.value } : x))}
                                        />
                                        <input
                                            className="col-span-2 border rounded px-2 py-1 text-right text-sm"
                                            inputMode="decimal"
                                            placeholder="例: 1500"
                                            value={p.unitDraft ?? (p.unit ? String(p.unit) : "")}
                                            onChange={(e) => {
                                                if (isComposingNative(e.nativeEvent)) return;
                                                setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unitDraft: e.target.value } : x));
                                            }}
                                            onBlur={(e) => {
                                                const n = toDecimalSafe(e.target.value, 1);
                                                setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unit: n, unitDraft: undefined } : x));
                                            }}
                                        />
                                        <input
                                            className="col-span-1 border rounded px-2 py-1 text-right text-sm"
                                            inputMode="decimal"
                                            placeholder="例: 2.5"
                                            value={p.qtyDraft ?? (p.qty ? String(p.qty) : "")}
                                            onChange={(e) => {
                                                if (isComposingNative(e.nativeEvent)) return;
                                                setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qtyDraft: e.target.value } : x));
                                            }}
                                            onBlur={(e) => {
                                                const n = Math.max(0, toDecimalSafe(e.target.value, 1));
                                                setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qty: n, qtyDraft: undefined } : x));
                                            }}
                                        />
                                        <div className="col-span-1 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setCustomParts(cs => cs.filter((_, i) => i !== idx))}
                                                className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50"
                                onClick={() => setCustomParts(cs => [...cs, { maker: "", name: "", partNo: "", unit: 0, qty: 0 }])}
                            >＋ 行を追加</button>
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
                                    <input type="number" inputMode="decimal" min={0.1} step={0.1} value={it.qty} onChange={(e) => updateQty(idx, (e.target as HTMLInputElement).value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm" />
                                    <div className="w-28 text-right text-sm font-semibold">{yen(it.price * it.qty)}</div>
                                    <button type="button" onClick={() => removeItem(idx)} className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100">削除</button>
                                </div>
                            ))}
                            {customParts.map((it, idx) => (
                                <div key={`cp_${idx}`} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm break-words">
                                            {it.name} {it.maker && `（${it.maker}）`} {it.partNo && `P/N:${it.partNo}`}
                                        </div>
                                        <div className="text-xs text-slate-500">部品 / 単価 {yen(it.unit)}</div>
                                    </div>
                                    <input type="number" inputMode="decimal" min={0} step={0.1} value={it.qty}
                                        onChange={(e) => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qty: Math.max(0, Number(e.target.value || 0)) } : x))}
                                        className="w-20 border rounded-lg px-3 py-1.5 text-sm" />
                                    <div className="w-28 text-right text-sm font-semibold">{yen((it.unit || 0) * (it.qty || 0))}</div>
                                    <button type="button"
                                        onClick={() => setCustomParts(cs => cs.filter((_, i) => i !== idx))}
                                        className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100">削除</button>
                                </div>
                            ))}

                        </div>

                        {/* 技術料など（課税） 単価/個数 */}
                        <div className="mt-4 grid gap-2 text-sm">


                            {/* 値引き・預り金（金額） */}
                            <div className="grid grid-cols-12 items-center gap-2">
                                <span className="col-span-6 sm:col-span-5">調整値引き</span>
                                <input
                                    type="text" inputMode="decimal"
                                    className="col-span-6 sm:col-span-7 w-full border rounded px-3 py-1.5 text-right"
                                    value={feesDraft.discount}
                                    onChange={(e) => setFeesDraft({ ...feesDraft, discount: e.target.value.replace(/[^\d,.]/g, '') })}
                                    onBlur={() => setFees({ ...fees, discount: toNum(feesDraft.discount) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid grid-cols-12 items-center gap-2">
                                <span className="col-span-6 sm:col-span-5">預り金</span>
                                <input
                                    type="text" inputMode="decimal"
                                    className="col-span-6 sm:col-span-7 w-full border rounded px-3 py-1.5 text-right"
                                    value={feesDraft.deposit}
                                    onChange={(e) => setFeesDraft({ ...feesDraft, deposit: e.target.value.replace(/[^\d,.]/g, '') })}
                                    onBlur={() => setFees({ ...fees, deposit: toNum(feesDraft.deposit) })}
                                    placeholder="0"
                                />
                            </div>

 <div className="flex items-center justify-between">
  <div>非課税小計（法定費用）</div>
  <div className="font-semibold">{yen(nonTaxable)}</div>
</div>
<div className="flex items-center justify-between">
  <div>内消費税（{Math.round(taxRate*100)}%）</div>
  <div className="font-semibold">{yen(internalTax)}</div>
</div>
<div className="flex items-center justify-between">
  <div>税込合計</div>
  <div className="font-semibold">{yen(grandTotal)}</div>
</div>
<div className="mt-4">
  <div className="text-sm font-semibold mb-1">備考（Excelに出力）</div>
  <textarea
    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[90px]"
    placeholder="例：工賃は込み、オイルは持込品、納車希望日○/○ など"
    value={meta.remarks || ""}
    onChange={(e) => setMeta({ ...meta, remarks: e.target.value })}
  />
</div>
<div className="flex items-center justify-between text-base mt-1">
  <div className="font-semibold">差引合計（預り金差引後）</div>
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
                                <select
                                    className="border rounded-lg px-3 py-2"
                                    value={meta.docTitle}
                                    onChange={(e) => setMeta({ ...meta, docTitle: (e.target as HTMLSelectElement).value })}
                                >
                                    <option>車検見積書</option>
                                    <option>車検請求書</option>
                                    <option>整備見積書</option>
                                    <option>整備請求書</option>
                                    <option>レーシングサービス見積書</option>
                                    <option>レーシングサービス請求書</option>
                                </select>
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
