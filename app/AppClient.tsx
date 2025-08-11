"use client";
import React, { useEffect, useMemo, useState } from "react";




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
type CustomPart = { maker: string; name: string; partNo: string; unit: number; qty: number };
// ---- サンプル品目（税込） ----
const SERVICES: readonly ServiceDef[] = [
    // エンジン系統
    { id: "engine_remove_4st", cat: "エンジン系統", name: "エンジン脱着（4ストローク）", price: 52000, bringIn: 104000, notes: "カウル脱着別途" },
    { id: "engine_remove_2st", cat: "エンジン系統", name: "エンジン脱着（2ストローク）", price: 31200, bringIn: 62400, notes: "カウル脱着別途" },
    { id: "engine_remove_single", cat: "エンジン系統", name: "エンジン脱着（レーサー等シングル）", price: 8000, bringIn: 16000, notes: "カウル脱着別途" },
    { id: "engine_full_oh_4st", cat: "エンジン系統", name: "エンジンフルオーバーホール（4ストローク）", price: 200000, bringIn: 400000, notes: "エンジン脱着等別途" },
    { id: "engine_full_oh_single", cat: "エンジン系統", name: "エンジンフルオーバーホール（シングル）", price: 120000, bringIn: 240000, notes: "エンジン脱着等別途" },
    { id: "engine_full_oh_2st", cat: "エンジン系統", name: "エンジンフルオーバーホール（2ストローク）", price: 32500, bringIn: 65000, notes: "エンジン脱着等別途" },
    { id: "engine_full_oh_2st_single", cat: "エンジン系統", name: "エンジンフルオーバーホール（2スト・レーサー等シングル）", price: 24000, bringIn: 48000, notes: "エンジン脱着等別途" },
    { id: "engine_top_oh_4st", cat: "エンジン系統", name: "エンジン腰上オーバーホール（4ストローク）", price: 100000, bringIn: 200000, notes: "エンジン脱着等別途" },
    { id: "engine_top_oh_single", cat: "エンジン系統", name: "エンジン腰上オーバーホール（シングル）", price: 60000, bringIn: 120000, notes: "エンジン脱着等別途" },
    { id: "engine_top_oh_2st", cat: "エンジン系統", name: "エンジン腰上オーバーホール（2ストローク）", price: 16900, bringIn: 33800, notes: "エンジン脱着等別途" },
    { id: "engine_top_oh_2st_single", cat: "エンジン系統", name: "エンジン腰上オーバーホール（2スト・レーサー等シングル）", price: 12000, bringIn: 24000, notes: "エンジン脱着等別途" },
    { id: "engine_head_oh_4st", cat: "エンジン系統", name: "ヘッドオーバーホール（4ストローク）", price: 60000, bringIn: 120000, notes: "エンジン脱着等別途" },
    { id: "engine_head_oh_single", cat: "エンジン系統", name: "ヘッドオーバーホール（シングル）", price: 40000, bringIn: 80000, notes: "エンジン脱着等別途" },

    // サスペンション系統
    { id: "susp_fork_oh_std", cat: "サスペンション系統", name: "フォークOH（正立カートリッジ無）", price: 24800, bringIn: 49600, notes: "フォーク単体持込16500円、カウル脱着別途" },
    { id: "susp_fork_oh_cart", cat: "サスペンション系統", name: "フォークOH（倒立・正立カートリッジ式）", price: 29700, bringIn: 59400, notes: "フォーク単体持込21400円、カウル脱着別途" },
    { id: "susp_fork_oil", cat: "サスペンション系統", name: "フォークオイル交換", price: 19800, bringIn: 39600, notes: "カウル脱着別途" },
    { id: "susp_fork_spring", cat: "サスペンション系統", name: "フォークスプリング交換", price: 19800, bringIn: 39600, notes: "カウル脱着別途" },
    { id: "susp_fork_boots", cat: "サスペンション系統", name: "フォークブーツ交換", price: 13200, bringIn: 26400, notes: "カウル脱着別途" },
    { id: "susp_rear_twin", cat: "サスペンション系統", name: "リヤショック交換（ツイン）", price: 7400, bringIn: 14800, notes: "カウル脱着別途" },
    { id: "susp_rear_mono", cat: "サスペンション系統", name: "リヤショック交換（モノ）", price: 14900, bringIn: 29800, notes: "カウル、タンク脱着別途" },
    { id: "susp_lowdown", cat: "サスペンション系統", name: "ローダウンブラケット取り付け", price: 5000, bringIn: 10000, notes: "カウル脱着・加工別途" },

    // タイヤ・ホイール系統
    { id: "tire_valve", cat: "タイヤ・ホイール系統", name: "エアバルブ単品交換", price: 0, notes: "タイヤ交換と同額、当社指定品部品代無料" },
    { id: "tire_disposal", cat: "タイヤ・ホイール系統", name: "タイヤ処分（1本）", price: 400 },
    { id: "tire_nitrogen", cat: "タイヤ・ホイール系統", name: "窒素ガス充填（1本）", price: 700 },
    { id: "tire_nitrogen_refill", cat: "タイヤ・ホイール系統", name: "窒素ガス補充（1本）", price: 350 },
    { id: "tire_puncture_check", cat: "タイヤ・ホイール系統", name: "パンク点検", price: 0 },
    { id: "tire_puncture_repair", cat: "タイヤ・ホイール系統", name: "パンク修理（1ヶ所）", price: 2500 },
    { id: "wheel_bearing_f", cat: "タイヤ・ホイール系統", name: "ホイールベアリング フロント", price: 8400, bringIn: 16800, notes: "タイヤ同時交換時+3300円/個" },
    { id: "wheel_bearing_r", cat: "タイヤ・ホイール系統", name: "ホイールベアリング リア", price: 9600, bringIn: 19200, notes: "Rスプロケットベアリング別途3300円" },
    { id: "wheel_bearing_bring", cat: "タイヤ・ホイール系統", name: "ホイールベアリング（ホイール持込）", price: 3300, bringIn: 6600, notes: "ベアリング1個につき" },
    { id: "wheel_balance", cat: "タイヤ・ホイール系統", name: "ホイール持込バランス", price: 800, notes: "タイヤ交換時サービス" },
    { id: "tire_harley_f", cat: "タイヤ・ホイール系統", name: "ハーレータイヤ交換（フロント）", price: 8800, bringIn: 17600 },
    { id: "tire_harley_r", cat: "タイヤ・ホイール系統", name: "ハーレータイヤ交換（リア）", price: 11000, bringIn: 22000 },
    { id: "tire_split_f", cat: "タイヤ・ホイール系統", name: "タイヤ交換 合わせホイール（フロント）", price: 5700, bringIn: 11400, notes: "バランス不可" },
    { id: "tire_split_r", cat: "タイヤ・ホイール系統", name: "タイヤ交換 合わせホイール（リア）", price: 6800, bringIn: 13600, notes: "バランス不可、同時Rスプロケ交換無料" },
    { id: "tire_split_bring", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ホイール持込合わせホイール", price: 4000, bringIn: 8000, notes: "バランス不可" },
    { id: "tire_scooter_f_125", cat: "タイヤ・ホイール系統", name: "タイヤ交換 スクーターフロント（国産～125cc）", price: 4000 },
    { id: "tire_scooter_r_125", cat: "タイヤ・ホイール系統", name: "タイヤ交換 スクーターリア（国産～125cc）", price: 5000 },
    { id: "tire_scooter_f_125_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 スクーターフロント（外車～125cc）", price: 6000 },
    { id: "tire_scooter_r_125_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 スクーターリア（外車～125cc）", price: 7500 },
    { id: "tire_big_scooter_f", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ビッグスクーターフロント（国産126cc～）", price: 4400 },
    { id: "tire_big_scooter_r", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ビッグスクーターリア（国産126cc～）", price: 5500 },
    { id: "tire_big_scooter_f_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ビッグスクーターフロント（外車126cc～）", price: 6600 },
    { id: "tire_big_scooter_r_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ビッグスクーターリア（外車126cc～）", price: 8200 },
    { id: "tire_f", cat: "タイヤ・ホイール系統", name: "タイヤ交換 フロント（国産）", price: 4400, notes: "バランスサービス" },
    { id: "tire_r", cat: "タイヤ・ホイール系統", name: "タイヤ交換 リア（国産）", price: 5500, notes: "バランスサービス" },
    { id: "tire_f_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 フロント（外車/社外ホイール）", price: 6600, notes: "バランスサービス" },
    { id: "tire_r_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 リア（外車/社外ホイール）", price: 8200, notes: "バランスサービス" },
    { id: "tire_wheel_bring", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ホイール持込（国産）", price: 2700, notes: "バランスサービス" },
    { id: "tire_wheel_bring_import", cat: "タイヤ・ホイール系統", name: "タイヤ交換 ホイール持込（外車）", price: 4000, notes: "バランスサービス" },

    // ハンドル系統
    { id: "handle_grip", cat: "ハンドル系統", name: "グリップ（1台）", price: 3300, bringIn: 6600, notes: "カウル脱着別途" },
    { id: "handle_grip_end", cat: "ハンドル系統", name: "グリップエンド/バーエンドキャップ（1台）", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "handle_grip_heater_naked", cat: "ハンドル系統", name: "グリップヒーター（ネイキッド・アメリカン）", price: 14000, bringIn: 28000, notes: "巻きタイプ-2500円" },
    { id: "handle_grip_heater_125", cat: "ハンドル系統", name: "グリップヒーター（～125ccスクーター）", price: 14900, bringIn: 29800 },
    { id: "handle_grip_heater_big", cat: "ハンドル系統", name: "グリップヒーター（ビッグスクーター・カウル付）", price: 16500, bringIn: 33000 },
    { id: "handle_grip_heater_relay", cat: "ハンドル系統", name: "グリップヒーター追加リレー", price: 5000, bringIn: 10000, notes: "カウル脱着別途" },
    { id: "handle_separate", cat: "ハンドル系統", name: "セパレートハンドル", price: 9900, bringIn: 19800, notes: "トップブリッジ脱着6100円" },
    { id: "handle_bar", cat: "ハンドル系統", name: "バーハンドル（単品）", price: 7400, bringIn: 14800, notes: "穴あけ加工+1500円" },
    { id: "handle_bar_bracket", cat: "ハンドル系統", name: "バーハンドル＋ブラケット", price: 10700, bringIn: 21400 },
    { id: "handle_bracket", cat: "ハンドル系統", name: "バーハンドルブラケット（ポスト）", price: 3300, bringIn: 6600, notes: "カウル脱着別途" },
    { id: "handle_highthrottle", cat: "ハンドル系統", name: "ハイスロキット", price: 12400, bringIn: 24800, notes: "カウル、タンク脱着別途" },
    { id: "handle_up_spacer", cat: "ハンドル系統", name: "ハンドルアップスペーサー", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "handle_guard", cat: "ハンドル系統", name: "ハンドルガード（ナックルガード）左右", price: 5000, bringIn: 10000, notes: "カウル脱着・加工別途" },
    { id: "handle_brace", cat: "ハンドル系統", name: "ハンドルブレース", price: 1700, bringIn: 3400, notes: "カウル脱着別途" },
    { id: "handle_smartphone", cat: "ハンドル系統", name: "スマホホルダー", price: 1700, bringIn: 3400, notes: "電源取り出しタイプ9900円" },
    { id: "handle_brake_cable_f", cat: "ハンドル系統", name: "ブレーキケーブル（フロント）", price: 4100, bringIn: 8200, notes: "カウル脱着別途" },
    { id: "handle_brake_cable_r", cat: "ハンドル系統", name: "ブレーキケーブル（リア）", price: 4100, bringIn: 8200, notes: "カウル脱着別途" },
    { id: "handle_wire_oil", cat: "ハンドル系統", name: "ワイヤー注油作業（1個所）", price: 3300, notes: "カウル脱着別途" },

    // ブレーキ系統
    { id: "brake_caliper_single", cat: "ブレーキ系統", name: "キャリパー（シングル）", price: 9900, bringIn: 19800, notes: "フルード代込、純正6100円" },
    { id: "brake_caliper_double", cat: "ブレーキ系統", name: "キャリパー（ダブル）", price: 11600, bringIn: 23200, notes: "フルード代込、純正8600円" },
    { id: "brake_caliper_oh_single", cat: "ブレーキ系統", name: "片押しキャリパーOH", price: 9900, bringIn: 19800, notes: "フルード代込" },
    { id: "brake_caliper_oh_opposed", cat: "ブレーキ系統", name: "対向キャリパーOH", price: 11600, bringIn: 23200, notes: "フルード代込" },
    { id: "brake_caliper_clean", cat: "ブレーキ系統", name: "キャリパー清掃", price: 2640, notes: "ピストン清掃、グリスアップ含む" },
    { id: "brake_shoe", cat: "ブレーキ系統", name: "ブレーキシュー交換", price: 0, bringIn: 0,notes: "タイヤ交換と同額、同時交換1500円、カムOH+1500円" },
    { id: "brake_pad", cat: "ブレーキ系統", name: "ブレーキパッド（1キャリパー）", price: 2640, bringIn: 5280, notes: "清掃含む" },
    { id: "brake_fluid", cat: "ブレーキ系統", name: "ブレーキフルード（1ライン）フルード代別", price: 2500, bringIn: 5000, notes: "フルード代込2900円" },
    { id: "brake_hose_single", cat: "ブレーキ系統", name: "ブレーキホース（シングル/リア）", price: 6600, bringIn: 13200, notes: "ABS付き2倍料金" },
    { id: "brake_hose_double", cat: "ブレーキ系統", name: "ブレーキホース（ダブル）", price: 9900, bringIn: 19800, notes: "ABS付き2倍料金" },
    { id: "brake_lever", cat: "ブレーキ系統", name: "ブレーキレバー（1本）", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "brake_rotor", cat: "ブレーキ系統", name: "ブレーキローター（1枚）", price: 0, bringIn: 0,notes: "タイヤ交換と同額、ダブルディスク+1700円" },
    { id: "brake_master", cat: "ブレーキ系統", name: "マスターシリンダー取付(交換)", price: 7400, bringIn: 14800, notes: "フルード代込" },
    { id: "brake_master_oh", cat: "ブレーキ系統", name: "マスターシリンダーOH", price: 9900, bringIn: 19800, notes: "フルード代込" },

    // リアボックス系統
    { id: "box_fitting_general", cat: "リアボックス系統", name: "汎用トップケース用フィッティング取付", price: 4100, bringIn: 8200, notes: "リアキャリア付きに取付" },
    { id: "box_fitting_top", cat: "リアボックス系統", name: "車種別トップケース用フィッティング取付", price: 5800, bringIn: 11600, notes: "穴あけ加工、カウル脱着別途" },
    { id: "box_fitting_side", cat: "リアボックス系統", name: "車種別サイドケース用フィッティング取付", price: 9100, bringIn: 18200, notes: "穴あけ加工、カウル脱着別途" },
    { id: "box_fitting_full", cat: "リアボックス系統", name: "車種別トップ＋サイドケース用フィッティング取付", price: 11600, bringIn: 23200, notes: "穴あけ加工、カウル脱着別途" },

    // レーシングサービス
    { id: "race_mechanic", cat: "レーシングサービス", name: "メカニック帯同（1日）", price: 33000, notes: "交通費別途、ピットクルーライセンス登録含む" },
    { id: "race_data_logging", cat: "レーシングサービス", name: "データロギング", price: 11000 },
    { id: "race_setup", cat: "レーシングサービス", name: "マシンセットアップ", price: 11000 },
    { id: "race_full_pack", cat: "レーシングサービス", name: "フルパック（1日）", price: 44000 },

    // 吸排気系統
    { id: "intake_air", cat: "吸排気系統", name: "エアエレメント交換", price: 2500, bringIn: 5000, notes: "カウル、タンク脱着別途" },
    { id: "intake_carb_oh_125", cat: "吸排気系統", name: "キャブレターOH（～125cc）", price: 9900 },
    { id: "intake_carb_oh_single", cat: "吸排気系統", name: "キャブレターOH（シングル）", price: 14900 },
    { id: "intake_carb_oh_2cyl", cat: "吸排気系統", name: "キャブレターOH（2気筒）", price: 24800 },
    { id: "intake_carb_oh_3cyl", cat: "吸排気系統", name: "キャブレターOH（3気筒以上）", price: 33000 },
    { id: "exhaust_multi", cat: "吸排気系統", name: "マフラー（2気筒以上）", price: 14900, bringIn: 29800, notes: "カウル脱着別途" },
    { id: "exhaust_single", cat: "吸排気系統", name: "マフラー（シングル・スクーター）", price: 6600, bringIn: 13200, notes: "カウル脱着別途" },
    { id: "exhaust_slipon", cat: "吸排気系統", name: "マフラー スリップオン", price: 5000, bringIn: 10000, notes: "カウル脱着別途" },
    { id: "exhaust_special", cat: "吸排気系統", name: "マフラー（V型、センター出し）", price: 29700, bringIn: 59400, notes: "カウル脱着別途" },

    // 溶接修理
    { id: "weld_repair", cat: "溶接修理", name: "溶接修理（1箇所）", price: 10000, notes: "パーツ脱着別途" },
    { id: "weld_reinforce", cat: "溶接修理", name: "補強溶接", price: 13000, notes: "パーツ脱着別途" },
    { id: "weld_frame_gusset", cat: "溶接修理", name: "フレームガセット溶接（1箇所）", price: 13000, notes: "パーツ脱着別途" },
    { id: "weld_muffler", cat: "溶接修理", name: "マフラー溶接（1箇所）", price: 5000, notes: "パーツ脱着別途" },

    // 潤滑・冷却系統
    { id: "cool_llc_126", cat: "潤滑・冷却系統", name: "LLC交換（126cc～）", price: 8600, bringIn: 17200, notes: "クーラント液代、カウル、タンク脱着含む" },
    { id: "cool_llc_125", cat: "潤滑・冷却系統", name: "LLC交換（～125cc）", price: 5500, bringIn: 11000, notes: "クーラント液代、カウル、タンク脱着含む" },
    { id: "oil_change", cat: "潤滑・冷却系統", name: "オイル交換", price: 1100, bringIn: 2200, notes: "パーツ脱着別途" },
    { id: "oil_element", cat: "潤滑・冷却系統", name: "オイル＋エレメント交換", price: 1980, bringIn: 3960, notes: "DCTフィルター+880円" },
    { id: "oil_cooler", cat: "潤滑・冷却系統", name: "オイルクーラー", price: 16500, bringIn: 33000, notes: "オイル代別途" },
    { id: "oil_gear", cat: "潤滑・冷却系統", name: "ギアオイル", price: 1320, bringIn: 2640, notes: "カウル脱着別途" },
    { id: "cool_water_temp", cat: "潤滑・冷却系統", name: "水温計", price: 9900, bringIn: 19800, notes: "LLC交換別途+8600円（原付+5500円）" },
    { id: "oil_flushing", cat: "潤滑・冷却系統", name: "フラッシング", price: 1000, bringIn: 2000 },
    { id: "oil_temp", cat: "潤滑・冷却系統", name: "油温計", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },
    { id: "cool_radiator", cat: "潤滑・冷却系統", name: "ラジエター交換", price: 24800, bringIn: 49600, notes: "タンク脱着含む、カウル脱着別途" },
    { id: "oil_harley_engine", cat: "潤滑・冷却系統", name: "ハーレーエンジンオイル", price: 1100, bringIn: 2200 },
    { id: "oil_harley_element", cat: "潤滑・冷却系統", name: "ハーレーオイルエレメント", price: 1980, bringIn: 3960 },
    { id: "oil_harley_primary", cat: "潤滑・冷却系統", name: "ハーレープライマリーオイル", price: 1320, bringIn: 2640 },
    { id: "oil_harley_trans", cat: "潤滑・冷却系統", name: "ハーレートランスミッションオイル交換", price: 1320, bringIn: 2640 },

    // 車体・外装系統
    { id: "body_inner_fender", cat: "車体・外装系統", name: "インナーフェンダー", price: 3300, bringIn: 6600, notes: "タイヤ脱着含まず" },
    { id: "body_cowl_remove", cat: "車体・外装系統", name: "カウル脱着（1箇所）", price: 900 },
    { id: "body_rear_carrier", cat: "車体・外装系統", name: "リアキャリア取付", price: 5000, bringIn: 10000, notes: "穴あけ加工、カウル脱着別途" },
    { id: "body_rear_box", cat: "車体・外装系統", name: "リヤBOX", price: 4100, bringIn: 8200, notes: "ストップランプ付き+1500円" },
    { id: "body_grab_bar", cat: "車体・外装系統", name: "グラブバー（タンデムグリップ）", price: 5000, bringIn: 10000, notes: "カウル脱着＆加工別途" },
    { id: "body_side_stand", cat: "車体・外装系統", name: "サイドスタンド", price: 3300, bringIn: 6600, notes: "カウル脱着＆加工別途" },
    { id: "body_side_bag", cat: "車体・外装系統", name: "サイドバッグ", price: 4100, bringIn: 8200, notes: "カウル脱着別途" },
    { id: "body_sub_frame", cat: "車体・外装系統", name: "サブフレーム", price: 9900, bringIn: 19800, notes: "カウル脱着＆加工別途" },
    { id: "body_sissy_bar", cat: "車体・外装系統", name: "シーシーバー", price: 5000, bringIn: 11000, notes: "カウル脱着＆加工別途" },
    { id: "body_seat", cat: "車体・外装系統", name: "シート", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "body_seat_cowl", cat: "車体・外装系統", name: "シートカウル", price: 5000, bringIn: 10000 },
    { id: "body_seat_cover", cat: "車体・外装系統", name: "シートカバー", price: 2500, bringIn: 5000, notes: "ビッグスクーター5000円" },
    { id: "body_screen", cat: "車体・外装系統", name: "スクリーン", price: 3300, bringIn: 6600, notes: "カウル脱着別途" },
    { id: "body_step", cat: "車体・外装系統", name: "ステップ（1個）", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "body_step_board", cat: "車体・外装系統", name: "ステップボード", price: 5000, bringIn: 10000, notes: "電飾付き+9900円" },
    { id: "body_stem_bearing", cat: "車体・外装系統", name: "ステムベアリング", price: 24800, bringIn: 49600, notes: "カウル脱着別途" },
    { id: "body_center_stand", cat: "車体・外装系統", name: "センタースタンド", price: 4100, bringIn: 8200, notes: "カウル脱着＆加工別途" },
    { id: "body_center_stand_stopper", cat: "車体・外装系統", name: "センタースタンドストッパー", price: 2500, bringIn: 5000, notes: "カウル脱着＆加工別途" },
    { id: "body_stand_oil", cat: "車体・外装系統", name: "スタンド注油（1箇所）", price: 800 },
    { id: "body_tank_remove", cat: "車体・外装系統", name: "タンク脱着", price: 2500, bringIn: 5000 },
    { id: "body_tank_pad", cat: "車体・外装系統", name: "タンクパット", price: 1700, bringIn: 3400 },
    { id: "body_tandem_bar", cat: "車体・外装系統", name: "タンデムバー", price: 5000, bringIn: 10000, notes: "カウル脱着、加工別途" },
    { id: "body_back_step", cat: "車体・外装系統", name: "バックステップ", price: 24800, bringIn: 49600, notes: "カウル脱着別途" },
    { id: "body_backrest", cat: "車体・外装系統", name: "バックレスト", price: 5000, bringIn: 11000, notes: "カウル脱着別途" },
    { id: "body_bikini_cowl", cat: "車体・外装系統", name: "ビキニカウル", price: 5000, bringIn: 11000 },
    { id: "body_fenderless", cat: "車体・外装系統", name: "フェンダーレスキット", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },
    { id: "body_front_fender", cat: "車体・外装系統", name: "フロントフェンダー", price: 5000, bringIn: 10000 },
    { id: "body_mirror", cat: "車体・外装系統", name: "ミラー（1個）", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "body_reflector", cat: "車体・外装系統", name: "リフレクター（反射板）", price: 1700, bringIn: 3400, notes: "カウル脱着別途" },

    // 車検関連
    { id: "inspect_legal", cat: "車検（２輪）", name: "法定点検一式（2輪）", price: 24000, notes: "点検および調整含む" },
    { id: "inspect_proxy", cat: "車検（２輪）", name: "車検代行費用", price: 10000 },
    { id: "basic_fee", cat: "車検（２輪）", name: "車検整備基本料", price: 19800 },

    // 電装品系統
    { id: "elec_etc_cowl", cat: "電装品系統", name: "ETC（カウル付き・スクーター）", price: 15840, bringIn: 31680, notes: "カウル、タンク脱着含む" },
    { id: "elec_etc_naked", cat: "電装品系統", name: "ETC（ネイキッド）", price: 9240, bringIn: 18480, notes: "カウル、タンク脱着含む" },
    { id: "elec_etc_off", cat: "電装品系統", name: "ETC（オフ車・アメリカン）", price: 12540, bringIn: 25080, notes: "カウル、タンク脱着含む" },
    { id: "elec_etc_setup", cat: "電装品系統", name: "ETC セットアップ", price: 2750 },
    { id: "elec_fi_controller", cat: "電装品系統", name: "FIコントローラー", price: 14900, bringIn: 29800, notes: "F周りカウル脱着含む" },
    { id: "elec_switch_box", cat: "電装品系統", name: "スイッチボックス（1個）", price: 3300, bringIn: 6600, notes: "カウル脱着別途" },
    { id: "elec_voltmeter", cat: "電装品系統", name: "電圧計", price: 9900, bringIn: 19800, notes: "カウル脱着、加工別途" },
    { id: "elec_power_acc", cat: "電装品系統", name: "電源取り出し（アクセサリーのみ）", price: 8800, bringIn: 17600, notes: "ナビ同時半額" },
    { id: "elec_power_batt_naked", cat: "電装品系統", name: "電源取り出し（バッテリー電源・ネイキッド）", price: 11000, bringIn: 22000, notes: "ナビ同時半額" },
    { id: "elec_power_batt_cowl", cat: "電装品系統", name: "電源取り出し（バッテリー電源・スクーター/カウル付）", price: 18700, bringIn: 37400, notes: "ナビ同時半額" },
    { id: "elec_security", cat: "電装品系統", name: "盗難防止機", price: 9900, bringIn: 19800, notes: "センサー、配線加工別途" },
    { id: "elec_dashcam_naked", cat: "電装品系統", name: "ドライブレコーダー（ネイキッド）", price: 12900, bringIn: 25800, notes: "カメラ数により変動" },
    { id: "elec_dashcam_american", cat: "電装品系統", name: "ドライブレコーダー（アメリカン・オフロード）", price: 16500, bringIn: 33000, notes: "カメラ数により変動" },
    { id: "elec_dashcam_cowl", cat: "電装品系統", name: "ドライブレコーダー（カウル付・スクーター）", price: 19800, bringIn: 39600, notes: "カメラ数により変動" },
    { id: "elec_navi", cat: "電装品系統", name: "ナビ", price: 11600, bringIn: 23200, notes: "カウル、タンク脱着含む" },
    { id: "elec_battery", cat: "電装品系統", name: "バッテリー", price: 1650, bringIn: 3300, notes: "脱着別途" },
    { id: "elec_battery_charge", cat: "電装品系統", name: "バッテリー充電", price: 1650, notes: "バッテリー単体持込" },
    { id: "elec_fuse", cat: "電装品系統", name: "ヒューズ（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル、タンク脱着別途" },
    { id: "elec_fog_lamp", cat: "電装品系統", name: "フォグランプ", price: 13200, bringIn: 26400, notes: "カウル脱着・加工別途" },
    { id: "elec_plug", cat: "電装品系統", name: "プラグ（1本）", price: 1000, bringIn: 2000, notes: "カウル、タンク脱着別途" },
    { id: "elec_plug_cap", cat: "電装品系統", name: "プラグキャップ（1個）", price: 1000, bringIn: 2000, notes: "カウル、タンク脱着別途" },
    { id: "elec_plug_cord", cat: "電装品系統", name: "プラグコード（1本）", price: 1700, bringIn: 3400, notes: "カウル、タンク脱着別途" },
    { id: "elec_horn", cat: "電装品系統", name: "ホーン", price: 3300, bringIn: 6600, notes: "カウル、外装脱着別途" },
    { id: "elec_radar", cat: "電装品系統", name: "レーダー", price: 9900, bringIn: 19800, notes: "カウル、タンク脱着・加工別途" },

    // ライト・ウインカー系統
    { id: "light_winker", cat: "ライト・ウインカー系統", name: "ウィンカー（1ヶ所）", price: 3300, bringIn: 6600, notes: "カウル脱着別途" },
    { id: "light_winker_bulb", cat: "ライト・ウインカー系統", name: "ウィンカー/テール バルブ（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "light_winker_lens", cat: "ライト・ウインカー系統", name: "ウィンカー/テール レンズ（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "light_winker_relay", cat: "ライト・ウインカー系統", name: "ウィンカーリレー", price: 1700, bringIn: 3400, notes: "カウル脱着別途" },
    { id: "light_led_ribbon_v125", cat: "ライト・ウインカー系統", name: "LEDリボンヘッドライト（アドレスV125/APE・モンキー）", price: 7400, bringIn: 14800 },
    { id: "light_led_ribbon_pcx", cat: "ライト・ウインカー系統", name: "LEDリボンヘッドライト（PCX125）", price: 14000, bringIn: 28000 },
    { id: "light_led_naked", cat: "ライト・ウインカー系統", name: "LEDヘッドライト（ネイキッド）", price: 5000, bringIn: 10000 },
    { id: "light_led_cowl_1", cat: "ライト・ウインカー系統", name: "LEDヘッドライト（カウル付き・スクーター1灯）", price: 11600, bringIn: 23200 },
    { id: "light_led_cowl_2", cat: "ライト・ウインカー系統", name: "LEDヘッドライト（カウル付き・スクーター2灯）", price: 14900, bringIn: 29800 },
    { id: "light_led_no_harness", cat: "ライト・ウインカー系統", name: "LEDヘッドライト（ハーネス無し）", price: 1700, bringIn: 3400 },
    { id: "light_tail_assy", cat: "ライト・ウインカー系統", name: "テールランプASSY（ビッグスクーター）", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },
    { id: "light_tail_bulb", cat: "ライト・ウインカー系統", name: "テールランプ球", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "light_tail_lens", cat: "ライト・ウインカー系統", name: "テールレンズ（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "light_number_bulb", cat: "ライト・ウインカー系統", name: "ナンバー球", price: 800, bringIn: 1600, notes: "カウル脱着別途" },
    { id: "light_number_lamp", cat: "ライト・ウインカー系統", name: "ナンバーランプ（後付）", price: 5800, bringIn: 11600, notes: "カウル脱着・加工別途" },
    { id: "light_brake_bulb", cat: "ライト・ウインカー系統", name: "ブレーキ球（1個）", price: 800, bringIn: 1600, notes: "カウル、タンク脱着別途" },
    { id: "light_headlight_kit", cat: "ライト・ウインカー系統", name: "ヘッドライトキット", price: 7400, bringIn: 14800, notes: "カウル脱着別途" },
    { id: "light_headlight_stay", cat: "ライト・ウインカー系統", name: "ヘッドライトステー", price: 5000, bringIn: 10000, notes: "トップブリッジ、カウル脱着別途" },
    { id: "light_headlight_bulb", cat: "ライト・ウインカー系統", name: "ヘッドライトバルブ（1個）", price: 1700, bringIn: 3400, notes: "カウル脱着別途" },
    { id: "light_headlight_bulb_scooter", cat: "ライト・ウインカー系統", name: "ヘッドライトバルブ（原付スクーター）", price: 2500, bringIn: 5000, notes: "左右ミラー、ヘッドライトカバー脱着含む" },
    { id: "light_headlight_booster", cat: "ライト・ウインカー系統", name: "ヘッドライトブースター", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },

    // 駆動系統
    { id: "drive_125", cat: "駆動系統", name: "駆動系（～125ccまで）", price: 6600, bringIn: 13200, notes: "プーリー側、クラッチ側片方、同時+2500円" },
    { id: "drive_126", cat: "駆動系統", name: "駆動系（126cc以上）", price: 9900, bringIn: 19800, notes: "プーリー側、クラッチ側片方、同時+2500円" },
    { id: "drive_sprocket", cat: "駆動系統", name: "スプロケット（1箇所）", price: 6600, bringIn: 13200, notes: "カウル、マフラー脱着別途" },
    { id: "drive_sprocket_chain", cat: "駆動系統", name: "スプロケット（前後）＋チェーン", price: 14900, bringIn: 29800, notes: "クリップタイプ12100円" },
    { id: "drive_sprocket_stud", cat: "駆動系統", name: "スプロケットスタッドボルト打ち換え（1本）", price: 1300, bringIn: 2600 },
    { id: "drive_chain_clip", cat: "駆動系統", name: "チェーン（クリップジョイント）", price: 3800, bringIn: 7600, notes: "カウル脱着別途" },
    { id: "drive_chain_rivet", cat: "駆動系統", name: "チェーン（カシメジョイント）", price: 6600, bringIn: 13200, notes: "カウル脱着別途" },
    { id: "drive_chain_adjust", cat: "駆動系統", name: "チェーン調整", price: 2500, notes: "清掃、注油、カウル脱着別途" },
    { id: "drive_chain_clean", cat: "駆動系統", name: "チェーン清掃/注油", price: 3300, notes: "レイキッシュ4000円" },
    { id: "drive_chain_oil", cat: "駆動系統", name: "チェーン注油のみ", price: 1700, notes: "レイキッシュ2400円" },
    { id: "drive_belt_125", cat: "駆動系統", name: "ドライブベルト（～125cc）", price: 6600, bringIn: 13200, notes: "カウル脱着別途" },
    { id: "drive_belt_126", cat: "駆動系統", name: "ドライブベルト（126cc～）", price: 9900, bringIn: 19800, notes: "カウル脱着別途" },
    { id: "drive_hub_damper", cat: "駆動系統", name: "ハブダンパー", price: 0, bringIn: 0,notes: "タイヤ交換と同額" },
    { id: "drive_clutch_plate", cat: "駆動系統", name: "クラッチプレート", price: 14900, bringIn: 29800, notes: "カウル脱着、ガスケット別途" },
    { id: "drive_clutch_fluid", cat: "駆動系統", name: "クラッチフルード（フルード代別）", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "drive_clutch_hose", cat: "駆動系統", name: "クラッチホース", price: 9900, bringIn: 19800, notes: "フルード代込" },
    { id: "drive_clutch_lever", cat: "駆動系統", name: "クラッチレバー", price: 2500, bringIn: 5000, notes: "カウル脱着別途" },
    { id: "drive_clutch_wire", cat: "駆動系統", name: "クラッチワイヤー", price: 4100, bringIn: 8200, notes: "タンク、カウル脱着別途" },
    { id: "drive_crankcase_cover", cat: "駆動系統", name: "クランクケースカバー", price: 5000, bringIn: 10000, notes: "ガスケット別途" },

    // その他作業・一般工賃
    { id: "general_domestic", cat: "その他作業・一般工賃", name: "国産車（1時間）", price: 10000 },
    { id: "general_import", cat: "その他作業・一般工賃", name: "輸入車（1時間）", price: 15000 },
    { id: "general_special", cat: "その他作業・一般工賃", name: "特殊車両（1時間）", price: 20000 }

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
const toIntSafe = (raw: string) => {
    if (typeof raw !== "string") return 0;
    const half = raw.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
    const cleaned = half.replace(/[^\d]/g, "");
    return cleaned ? Number(cleaned) : 0;
};
const asInput = (n: number) => (Number.isFinite(n) ? String(n) : "");

function isComposingNative(ev: unknown): boolean {
    const obj = ev as { isComposing?: boolean };
    return obj?.isComposing === true;
}
export default function AppClient() {
    //自由部品入力
    const [customParts, setCustomParts] = useState<CustomPart[]>([
        { maker: "", name: "", partNo: "", unit: 0, qty: 1 },
    ]);
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
    const [meta, setMeta] = useState({
        date: todayISO(),
        invoiceNo: "INV-" + todayISO().replaceAll("-", "") + "-001",
        docTitle: "車検見積書", // ★追加：初期タイトル
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
    const jibaiLine = legal.jibaiseki24m.unit > 0 ? legal.jibaiseki24m.unit : 0;
    const legalTotal = jibaiLine
        + legal.weightTax.unit * legal.weightTax.qty
        + legal.stamp.unit * legal.stamp.qty;        // ① 非課税
    const extrasTotal = fees.partsExchangeTech.unit * fees.partsExchangeTech.qty
        + fees.proxy.unit * fees.proxy.qty
        + fees.basic.unit * fees.basic.qty;     // 課税
    const nonTaxable = legalTotal;                                    // ①

    const customSubtotal = useMemo(
        () => customParts.reduce((a, p) => a + (p.unit || 0) * (p.qty || 0), 0),
        [customParts]
    );
    // 課税対象合計を変更
    const taxableBase = itemsSubtotal + customSubtotal + extrasTotal;      // ②
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
                                                <span>部品持込</span>
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
                    {/* === 手入力部品 === */}
                    <div className="bg-white rounded-2xl shadow-sm border p-3 mt-4">
                        <div className="text-sm font-semibold mb-2">手入力部品</div>

                        {/* 列見出しでガイドを明確化 */}
                        <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 mb-1 px-1">
                            <div className="col-span-12 sm:col-span-2">メーカー</div>
                            <div className="col-span-12 sm:col-span-3">品目</div>
                            <div className="col-span-12 sm:col-span-3">部品番号</div>
                            <div className="col-span-6 sm:col-span-2 text-right">金額(円)</div>
                            <div className="col-span-6 sm:col-span-1 text-right">個数</div>
                            <div className="col-span-12 sm:col-span-1"></div>
                        </div>

                        <div className="grid gap-3">
                            {customParts.map((p, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded-xl p-3">
                                    <input
                                        className="col-span-12 sm:col-span-2 border rounded px-2 py-1 text-sm"
                                        placeholder="例: NGK"
                                        value={p.maker}
                                        onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, maker: e.target.value } : x))}
                                    />
                                    <input
                                        className="col-span-12 sm:col-span-3 border rounded px-2 py-1 text-sm"
                                        placeholder="例: スパークプラグ"
                                        value={p.name}
                                        onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                    />
                                    <input
                                        className="col-span-12 sm:col-span-3 border rounded px-2 py-1 text-sm"
                                        placeholder="例: DPR8EA-9"
                                        value={p.partNo}
                                        onChange={e => setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, partNo: e.target.value } : x))}
                                    />

                                    {/* 金額(円)：NaN回避 & 全角/記号対策 */}
                                    <input
                                        className="col-span-6 sm:col-span-2 border rounded px-2 py-1 text-right text-sm"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={asInput(p.unit)}
                                        onChange={(e) => {
                                            if (isComposingNative(e.nativeEvent)) return; // 合成中は無視
                                            const n = toIntSafe((e.target as HTMLInputElement).value);
                                            setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unit: n } : x)); // ★unit を更新
                                        }}
                                        onCompositionEnd={(e) => {
                                            const n = toIntSafe((e.target as HTMLInputElement).value);
                                            setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, unit: n } : x)); // ★unit を確定
                                        }}
                                    />


                                    {/* 個数：同様に安全化、0以上 */}
                                    <input
                                        className="col-span-6 sm:col-span-1 border rounded px-2 py-1 text-right text-sm"
                                        inputMode="numeric"
                                        placeholder="1"
                                        value={asInput(p.qty)}
                                        onChange={(e) => {
                                            if (isComposingNative(e.nativeEvent)) return;
                                            const n = Math.max(0, toIntSafe((e.target as HTMLInputElement).value));
                                            setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qty: n } : x)); // ★qty を更新
                                        }}
                                        onCompositionEnd={(e) => {
                                            const n = Math.max(0, toIntSafe((e.target as HTMLInputElement).value));
                                            setCustomParts(cs => cs.map((x, i) => i === idx ? { ...x, qty: n } : x)); // ★qty を確定
                                        }}
                                    />

                                    <div className="col-span-12 sm:col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                            onClick={() => setCustomParts(cs => cs.filter((_, i) => i !== idx))}
                                        >削除</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50"
                                onClick={() => setCustomParts(cs => [...cs, { maker: "", name: "", partNo: "", unit: 0, qty: 1 }])}
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
                                    <input type="number" min={1} value={it.qty} onChange={(e) => updateQty(idx, (e.target as HTMLInputElement).value)} className="w-20 border rounded-lg px-3 py-1.5 text-sm" />
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
                                    <input type="number" min={0} value={it.qty}
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
