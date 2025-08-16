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
  // 4輪車検
  { id: "4w_inspection_legal_set", vehicleType: "4輪", cat: "車検", name: "法定点検一式", price: 25000, notes: "点検及び調整、法定費用（印紙代・自賠責保険料・重量税）を含む" },
  { id: "4w_inspection_agency_fee", vehicleType: "4輪", cat: "車検", name: "車検代行費用", price: 10000 },

  // 4輪エンジン系統
  { id: "4w_engine_removal", vehicleType: "4輪", cat: "エンジン系統", name: "エンジン脱着", price: 80000 },
  { id: "4w_engine_full_overhaul", vehicleType: "4輪", cat: "エンジン系統", name: "エンジンフルオーバーホール", price: 200000, notes: "エンジン脱着等は別途" },
  { id: "4w_head_overhaul", vehicleType: "4輪", cat: "エンジン系統", name: "ヘッドオーバーホール", price: 120000, notes: "エンジン脱着等は別途" },
  { id: "4w_valve_stem_seal_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "バルブステムシール交換", price: 2000, notes: "エンジン脱着等は別途、1箇所あたり" },
  { id: "4w_cam_chain_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "カムチェーン交換", price: 24000, notes: "エンジン脱着等は別途" },
  { id: "4w_head_cover_gasket_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "ヘッドカバーパッキン交換", price: 5000, notes: "エンジン脱着等は別途" },
  { id: "4w_piston_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "ピストン交換", price: 18000, notes: "エンジン脱着等は別途" },
  { id: "4w_crank_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "クランク交換", price: 14000 },
  { id: "4w_various_sensor_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "各種センサー交換", price: 4000 },
  { id: "4w_oil_pump_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "オイルポンプ交換", price: 5000, notes: "オイルパン脱着等は別途" },
  { id: "4w_water_pump_replacement_engine", vehicleType: "4輪", cat: "エンジン系統", name: "ウォーターポンプ交換", price: 5000, notes: "補器類脱着等は別途" },
  { id: "4w_spark_plug_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "スパークプラグ交換", price: 1500, notes: "1本あたり" },
  { id: "4w_direct_coil_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "ダイレクトコイル交換", price: 2000, notes: "1本あたり" },
  { id: "4w_turbine_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "タービン交換", price: 14000, notes: "エキゾースト等脱着は別途" },
  { id: "4w_intake_manifold_removal", vehicleType: "4輪", cat: "エンジン系統", name: "インマニ脱着", price: 15000 },
  { id: "4w_engine_mount_replacement", vehicleType: "4輪", cat: "エンジン系統", name: "エンジンマウント交換", price: 30000 },

  // 4輪ミッション系統
  { id: "4w_transmission_removal", vehicleType: "4輪", cat: "ミッション系統", name: "トランスミッション脱着", price: 60000, notes: "ミッション脱着は別途" },
  { id: "4w_mission_overhaul", vehicleType: "4輪", cat: "ミッション系統", name: "ミッションオーバーホール", price: 150000, notes: "ミッション脱着は別途" },
  { id: "4w_mt_mission_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "MTミッション交換", price: 60000 },
  { id: "4w_clutch_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "クラッチ交換", price: 15000, notes: "ミッション脱着は別途" },
  { id: "4w_front_seal_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "フロントシール交換", price: 4000, notes: "ミッション脱着は別途" },
  { id: "4w_rear_seal_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "リアシール交換", price: 4000, notes: "ミッション脱着は別途" },
  { id: "4w_mission_oil_change", vehicleType: "4輪", cat: "ミッション系統", name: "ミッションオイル交換", price: 2000 },
  { id: "4w_atf_change", vehicleType: "4輪", cat: "ミッション系統", name: "ATF交換", price: 4000 },
  { id: "4w_at_mission_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "ATミッション交換", price: 65000 },
  { id: "4w_mission_mount_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "ミッションマウント交換", price: 8000 },
  { id: "4w_propeller_shaft_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "プロペラシャフト交換", price: 3500 },
  { id: "4w_spider_yoke_overhaul", vehicleType: "4輪", cat: "ミッション系統", name: "スパイダヨークオーバーホール", price: 4000, notes: "1箇所あたり" },
  { id: "4w_differential_overhaul", vehicleType: "4輪", cat: "ミッション系統", name: "デフオーバーホール", price: 20000 },
  { id: "4w_differential_mount_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "デフマウント交換", price: 8000 },
  { id: "4w_differential_seal_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "デフシール交換", price: 6000 },
  { id: "4w_drive_shaft_seal_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "ドライブシャフトシール交換", price: 4000, notes: "1箇所あたり" },
  { id: "4w_drive_shaft_bearing_replacement", vehicleType: "4輪", cat: "ミッション系統", name: "ドライブシャフトベアリング交換", price: 20000, notes: "1箇所あたり" },

  // 4輪ブレーキ系統
  { id: "4w_brake_pad_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキパッド交換", price: 3000, notes: "1箇所あたり" },
  { id: "4w_brake_rotor_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキローター交換", price: 5000, notes: "1箇所あたり" },
  { id: "4w_brake_fluid_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキフルード交換", price: 4000 },
  { id: "4w_brake_caliper_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキキャリパ交換", price: 8000, notes: "1箇所あたり" },
  { id: "4w_brake_caliper_overhaul", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキキャリパーオーバーホール", price: 10000, notes: "1箇所あたり" },
  { id: "4w_brake_shoe_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキシュー交換", price: 7000, notes: "1箇所あたり" },
  { id: "4w_wheel_cylinder_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ホイールシリンダ交換", price: 8000, notes: "1箇所あたり" },
  { id: "4w_wheel_cylinder_overhaul", vehicleType: "4輪", cat: "ブレーキ系統", name: "ホイールシリンダーオーバーホール", price: 8500, notes: "1箇所あたり" },
  { id: "4w_shoe_hold_pin_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "シューホールドピン交換", price: 4000, notes: "1箇所あたり" },
  { id: "4w_brake_drum_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキドラム交換", price: 3500, notes: "1箇所あたり" },
  { id: "4w_master_cylinder_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "マスターシリンダ交換", price: 8000 },
  { id: "4w_master_cylinder_overhaul", vehicleType: "4輪", cat: "ブレーキ系統", name: "マスターシリンダオーバーホール", price: 8500 },
  { id: "4w_brake_hose_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキホース交換", price: 3500, notes: "1箇所あたり" },
  { id: "4w_brake_servo_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "ブレーキサーボ交換（倍力装置）", price: 15000 },
  { id: "4w_back_plate_replacement", vehicleType: "4輪", cat: "ブレーキ系統", name: "バックプレート交換", price: 8000, notes: "1箇所あたり" },

  // 4輪サスペンション系統
  { id: "4w_tie_rod_end_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "タイロッドエンド交換", price: 8000, notes: "1箇所あたり" },
  { id: "4w_tie_rod_end_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "タイロッドエンドブーツ交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_steering_rack_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ステアリングラックブーツ交換", price: 15000 },
  { id: "4w_steering_rack_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ステアリングラック交換", price: 35000 },
  { id: "4w_lower_arm_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ロアアーム交換", price: 18000, notes: "1箇所あたり" },
  { id: "4w_lower_arm_bush_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ロアアームブッシュ交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_lower_arm_end_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ロアアームエンドブーツ交換", price: 5000, notes: "1箇所あたり" },
  { id: "4w_upper_arm_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "アッパーアーム交換", price: 18000, notes: "1箇所あたり" },
  { id: "4w_upper_arm_bush_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "アッパーアームブッシュ交換", price: 20000, notes: "1箇所あたり" },
  { id: "4w_upper_arm_end_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "アッパーアームエンドブーツ交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_control_arm_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "コントロールアーム交換", price: 12000, notes: "1箇所あたり" },
  { id: "4w_lower_member_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ロアメンバー交換", price: 30000 },
  { id: "4w_stabilizer_link_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "スタビライザーリンク交換", price: 9000 },
  { id: "4w_stabilizer_bush_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "スタビライザーブッシュ交換", price: 8000 },
  { id: "4w_shock_absorber_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ショックアブソーバー交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_strut_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ストラット交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_strut_upper_mount_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ストラットアッパーマウント交換", price: 18000, notes: "1箇所あたり" },
  { id: "4w_knuckle_arm_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ナックルアーム交換", price: 22000, notes: "1箇所あたり" },
  { id: "4w_hub_bearing_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ハブベアリング交換", price: 25000, notes: "1箇所あたり" },
  { id: "4w_drive_shaft_replacement_suspension", vehicleType: "4輪", cat: "サスペンション系統", name: "ドライブシャフト交換", price: 35000, notes: "1箇所あたり" },
  { id: "4w_drive_shaft_inner_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ドライブシャフトインナーブーツ交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_drive_shaft_outer_boot_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ドライブシャフトアウターブーツ交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_ball_nut_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ボールナット交換", price: 20000 },
  { id: "4w_ball_nut_overhaul", vehicleType: "4輪", cat: "サスペンション系統", name: "ボールナットオーバーホール", price: 25000 },
  { id: "4w_drag_link_replacement", vehicleType: "4輪", cat: "サスペンション系統", name: "ドラッグリンク交換", price: 15000 },
  { id: "4w_drag_link_overhaul", vehicleType: "4輪", cat: "サスペンション系統", name: "ドラッグリンクオーバーホール", price: 15000 },

  // 4輪電装品系統
  { id: "4w_battery_replacement", vehicleType: "4輪", cat: "電装品系統", name: "バッテリー交換", price: 2500 },
  { id: "4w_alternator_replacement", vehicleType: "4輪", cat: "電装品系統", name: "オルタネータ交換", price: 20000 },
  { id: "4w_headlight_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ヘッドライトバルブ交換", price: 1500, notes: "1箇所あたり" },
  { id: "4w_headlight_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ヘッドライト交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_blinker_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ウインカーバルブ交換", price: 1500, notes: "1箇所あたり" },
  { id: "4w_blinker_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ウインカー交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_brake_lamp_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ブレーキランプバルブ交換", price: 1500, notes: "1箇所あたり" },
  { id: "4w_back_lamp_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "バックランプバルブ交換", price: 1500, notes: "1箇所あたり" },
  { id: "4w_tail_lamp_unit_replacement", vehicleType: "4輪", cat: "電装品系統", name: "テールランプユニット交換", price: 15000, notes: "1箇所あたり" },
  { id: "4w_high_mount_brake_lamp_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "ハイマウントブレーキランプバルブ交換", price: 1500 },
  { id: "4w_various_bulb_replacement", vehicleType: "4輪", cat: "電装品系統", name: "各種電球交換", price: 1500, notes: "1箇所あたり" },
  { id: "4w_back_buzzer_installation", vehicleType: "4輪", cat: "電装品系統", name: "バックブザー取り付け", price: 5000 },
  { id: "4w_etc_installation", vehicleType: "4輪", cat: "電装品系統", name: "ETC取り付け", price: 12000 },
  { id: "4w_drive_recorder_installation", vehicleType: "4輪", cat: "電装品系統", name: "ドライブレコーダー取り付け", price: 12000 },
  { id: "4w_car_navigation_installation", vehicleType: "4輪", cat: "電装品系統", name: "カーナビゲーション取り付け", price: 12000 },
  { id: "4w_speaker_installation", vehicleType: "4輪", cat: "電装品系統", name: "スピーカー取り付け", price: 8000, notes: "1箇所あたり" },
  { id: "4w_back_camera_installation", vehicleType: "4輪", cat: "電装品系統", name: "バックカメラ取り付け", price: 12000 },
  { id: "4w_radar_installation", vehicleType: "4輪", cat: "電装品系統", name: "レーダー取り付け", price: 12000 },

  // 4輪エアコン系統
  { id: "4w_aircon_gas_charge", vehicleType: "4輪", cat: "エアコン系統", name: "エアコンガスチャージ", price: 2000 },
  { id: "4w_compressor_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "コンプレッサー交換", price: 14000 },
  { id: "4w_compressor_clutch_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "コンプレッサークラッチ交換", price: 18000 },
  { id: "4w_condenser_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "コンデンサー交換", price: 14000 },
  { id: "4w_aircon_hose_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "エアコンホース交換", price: 12000 },
  { id: "4w_liquid_tank_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "リキッドタンク交換", price: 14000 },
  { id: "4w_expansion_valve_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "エキスパンションバルブ交換", price: 12000 },
  { id: "4w_evaporator_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "エバポレーター交換", price: 36000 },
  { id: "4w_flow_box_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "フローボックス交換", price: 30000 },
  { id: "4w_heater_core_replacement", vehicleType: "4輪", cat: "エアコン系統", name: "ヒーターコア交換", price: 36000 },
  { id: "4w_heater_hose_replacement_36000", vehicleType: "4輪", cat: "エアコン系統", name: "ヒーターホース交換", price: 36000 },
  { id: "4w_heater_hose_replacement_4000", vehicleType: "4輪", cat: "エアコン系統", name: "ヒーターホース交換", price: 4000 },

  // 4輪冷却系統
  { id: "4w_radiator_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエター交換", price: 14000 },
  { id: "4w_radiator_fan_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターファン交換", price: 10000 },
  { id: "4w_radiator_fan_motor_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターファンモーター交換", price: 12000 },
  { id: "4w_coupling_replacement", vehicleType: "4輪", cat: "冷却系統", name: "カップリング交換", price: 8000 },
  { id: "4w_fan_shroud_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ファンシュラウド交換", price: 14000 },
  { id: "4w_radiator_upper_hose_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターアッパーホース交換", price: 2000 },
  { id: "4w_radiator_lower_hose_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターロアホース交換", price: 2000 },
  { id: "4w_radiator_bypass_hose_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターバイパスホース交換", price: 2000 },
  { id: "4w_radiator_cap_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターキャップ交換", price: 1000 },
  { id: "4w_radiator_sub_tank_replacement", vehicleType: "4輪", cat: "冷却系統", name: "ラジエターサブタンク交換", price: 6000 },
  { id: "4w_water_pump_replacement_cooling", vehicleType: "4輪", cat: "冷却系統", name: "ウォーターポンプ交換", price: 24000 },
  { id: "4w_thermostat_replacement", vehicleType: "4輪", cat: "冷却系統", name: "サーモスタット交換", price: 8000 },
  { id: "4w_motor_controller_replacement", vehicleType: "4輪", cat: "冷却系統", name: "モーターコントローラ交換", price: 5000 },

  // 4輪燃料系統
  { id: "4w_injector_replacement", vehicleType: "4輪", cat: "燃料系統", name: "インジェクター交換", price: 4000, notes: "1箇所あたり" },
  { id: "4w_fuel_pump_replacement", vehicleType: "4輪", cat: "燃料系統", name: "燃料ポンプ交換", price: 20000 },
  { id: "4w_fuel_tank_replacement", vehicleType: "4輪", cat: "燃料系統", name: "燃料タンク交換", price: 24000 },
  { id: "4w_fuel_tank_cleaning", vehicleType: "4輪", cat: "燃料系統", name: "燃料タンク洗浄", price: 28000 },
  { id: "4w_fuel_hose_replacement", vehicleType: "4輪", cat: "燃料系統", name: "燃料ホース交換", price: 7000, notes: "1本あたり" },
  { id: "4w_fuel_filter_replacement", vehicleType: "4輪", cat: "燃料系統", name: "燃料フィルタ交換", price: 8000 },
  { id: "4w_pulsation_damper_replacement", vehicleType: "4輪", cat: "燃料系統", name: "パルセーションダンパ交換", price: 4000 },
  { id: "4w_pressure_regulator_replacement", vehicleType: "4輪", cat: "燃料系統", name: "プレッシャーレギュレータ交換", price: 4000 },

  // 4輪タイヤ系統
  { id: "4w_tire_change", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤ交換", price: 1500, notes: "1本あたり" },
  { id: "4w_tire_balancing", vehicleType: "4輪", cat: "タイヤ系統", name: "バランス取り", price: 1500, notes: "1本あたり" },
  { id: "4w_tire_rotation", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤローテーション", price: 2500 },
  { id: "4w_puncture_repair", vehicleType: "4輪", cat: "タイヤ系統", name: "パンク修理", price: 2000, notes: "1箇所あたり" },
  { id: "4w_waste_tire_disposal", vehicleType: "4輪", cat: "タイヤ系統", name: "廃タイヤ処分", price: 500, notes: "1本あたり" },
  { id: "4w_tire_replacement_mount", vehicleType: "4輪", cat: "タイヤ系統", name: "タイヤ履き替え", price: 4500 },

  // 2輪車検
  { id: "2w_inspection_legal_set", vehicleType: "2輪", cat: "車検", name: "法定点検一式", price: 24000, notes: "点検及び調整、法定費用（印紙代・自賠責保険料・重量税）を含む" },
  { id: "2w_inspection_agency_fee", vehicleType: "2輪", cat: "車検", name: "車検代行費用", price: 10000 },

  // 2輪タイヤ系統
  { id: "2w_tire_change_matched_wheel_front", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 合わせホイール（フロント）", price: 5700, bringIn: 11400, notes: "ホイールバランス取れません" },
  { id: "2w_tire_change_matched_wheel_rear", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 合わせホイール（リア）", price: 6800, bringIn: 13600, notes: "ホイールバランス取れません、同時リヤスプロケット交換は無料" },
  { id: "2w_tire_change_wheel_bring_in_matched_wheel_front_rear", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 ホイール持込合わせホイール（前後とも）", price: 4000, bringIn: 8000, notes: "ホイールバランス取れません" },
  { id: "2w_tire_change_scooter_front_domestic_under_125cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターフロント 国産（～125ｃｃ未満）", price: 4000, bringIn: 8000, notes: "ホイールバランス無し" },
  { id: "2w_tire_change_scooter_front_import_under_125cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターフロント 外車（～125ｃｃ未満）", price: 6000, bringIn: 12000, notes: "ホイールバランス無し" },
  { id: "2w_tire_change_scooter_front_domestic_over_126cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターフロント 国産（ビックスクーター126ｃｃ以上）", price: 4400, bringIn: 8800, notes: "ホイールバランスはサービス（取れるものに限る）" },
  { id: "2w_tire_change_scooter_front_import_over_126cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターフロント 外車（ビックスクーター126ｃｃ以上）", price: 6600, bringIn: 13200, notes: "ホイールバランスはサービス（取れるものに限る）" },
  { id: "2w_tire_change_scooter_rear_domestic_under_125cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターリア 国産（～125cc未満）", price: 5000, bringIn: 10000, notes: "マフラー、メットイン脱着含む、カウル脱着除く、ホイールバランス取れません" },
  { id: "2w_tire_change_scooter_rear_import_under_125cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターリア 外車（～125cc未満）", price: 7500, bringIn: 15000, notes: "マフラー、メットイン脱着含む、カウル脱着除く、ホイールバランス取れません" },
  { id: "2w_tire_change_scooter_rear_domestic_over_126cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターリア 国産（ビックスクーター126ｃｃ以上）", price: 5500, bringIn: 11000, notes: "マフラー脱着が必要な車両は保安基準適合マフラー以外は作業不可" },
  { id: "2w_tire_change_scooter_rear_import_over_126cc", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 スクーターリア 外車（ビックスクーター126ｃｃ以上）", price: 8200, bringIn: 16400, notes: "マフラー脱着が必要な車両は保安基準適合マフラー以外は作業不可" },
  { id: "2w_tire_change_front_domestic", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 フロント 国産", price: 4400, bringIn: 8800, notes: "ホイールバランスはサービス" },
  { id: "2w_tire_change_front_import_aftermarket_harley_except", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 フロント 外車/社外ホイール装着車 ハーレー以外", price: 6600, bringIn: 13200, notes: "ホイールバランスはサービス" },
  { id: "2w_tire_change_rear_domestic", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 リア 国産", price: 5500, bringIn: 11000, notes: "ホイールバランスはサービス" },
  { id: "2w_tire_change_rear_import_aftermarket_harley_except", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 リア 外車/社外ホイール装着車 ハーレー以外", price: 8200, bringIn: 16400, notes: "ホイールバランスはサービス" },
  { id: "2w_tire_change_wheel_bring_in_domestic", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 ホイール持込 国産", price: 2700, bringIn: 5400, notes: "ホイールバランスはサービス" },
  { id: "2w_tire_change_wheel_bring_in_import", vehicleType: "2輪", cat: "タイヤ系統", name: "タイヤ交換 ホイール持込 外車", price: 4000, bringIn: 8000, notes: "ホイールバランスはサービス" },

  // 2輪タイヤ ハーレー
  { id: "2w_harley_front_tire_change", vehicleType: "2輪", cat: "タイヤ ハーレー", name: "ハーレーフロントタイヤ交換", price: 8800, bringIn: 17600 },
  { id: "2w_harley_rear_tire_change", vehicleType: "2輪", cat: "タイヤ ハーレー", name: "ハーレーリアタイヤ交換", price: 11000, bringIn: 22000 },
  { id: "2w_harley_rear_tire_change_touring", vehicleType: "2輪", cat: "タイヤ ハーレー", name: "ハーレーリアタイヤ 交換ツーリング", price: 11000, bringIn: 22000 },

  // 2輪タイヤ その他
  { id: "2w_air_valve_single_replacement", vehicleType: "2輪", cat: "タイヤ その他", name: "エアバルブ単品交換", price: 0, notes: "タイヤ交換と同額; 部品代無料（当社指定品に限る）" },
  { id: "2w_tire_disposal_1pc", vehicleType: "2輪", cat: "タイヤ その他", name: "タイヤ処分（1本）", price: 400, bringIn: 400, notes: "廃タイヤ持ち込みの場合" },
  { id: "2w_nitrogen_gas_filling_1pc", vehicleType: "2輪", cat: "タイヤ その他", name: "窒素ガス充填（１本）", price: 700 },
  { id: "2w_nitrogen_gas_refill_1pc", vehicleType: "2輪", cat: "タイヤ その他", name: "窒素ガス補充（１本）", price: 350 },
  { id: "2w_tire_tube_1pc", vehicleType: "2輪", cat: "タイヤ その他", name: "タイヤチューブ（1本）", price: 0, notes: "タイヤ交換と同額" },
  { id: "2w_tire_tube_at_tire_change", vehicleType: "2輪", cat: "タイヤ その他", name: "タイヤチューブ（タイヤ交換時）", price: 0, notes: "タイヤ交換と同額; タイヤ交換と同時場合は0円" },
  { id: "2w_puncture_inspection", vehicleType: "2輪", cat: "タイヤ その他", name: "パンク点検", price: 0 },
  { id: "2w_puncture_repair_1loc", vehicleType: "2輪", cat: "タイヤ その他", name: "パンク修理（1ヶ所）", price: 2500 },
  { id: "2w_wheel_bearing_replacement_front", vehicleType: "2輪", cat: "タイヤ その他", name: "ホイールベアリング交換 フロント", price: 8400, bringIn: 16800, notes: "タイヤと同時交換の場合はタイヤ工賃+ベアリング1個につき3,300円" },
  { id: "2w_wheel_bearing_replacement_rear", vehicleType: "2輪", cat: "タイヤ その他", name: "ホイールベアリング交換 リア", price: 9600, bringIn: 19200, notes: "Rスプロケットベアリングは別途3,300円; タイヤと同時交換の場合はタイヤ工賃+ベアリング1個につき3,300円" },
  { id: "2w_wheel_bearing_replacement_wheel_bring_in", vehicleType: "2輪", cat: "タイヤ その他", name: "ホイールベアリング交換（ホイール持ち込み）", price: 3300, bringIn: 6600, notes: "ベアリング1個につき3,300円" },
  { id: "2w_wheel_bring_in_balance", vehicleType: "2輪", cat: "タイヤ その他", name: "ホイール持込バランス", price: 800, notes: "タイヤ交換時バランスはサービス" },

  // 2輪潤滑・冷却系統
  { id: "2w_llc_replacement_126cc_up", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ＬＬＣ交換 126cc～", price: 8600, bringIn: 17200, notes: "クーラント液代金、カウル、タンク脱着は含みます。車種により大きく時間変動(エア抜き必要)" },
  { id: "2w_llc_replacement_under_125cc", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ＬＬＣ交換 ～125cc", price: 5500, bringIn: 11000, notes: "クーラント液代金、カウル、タンク脱着は含みます。車種により大きく時間変動(エア抜き必要)" },
  { id: "2w_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "オイル交換", price: 1100, bringIn: 2200, notes: "パーツの脱着が必要な場合は別途工賃が掛かります。" },
  { id: "2w_oil_element_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "オイル＋エレメント交換", price: 1980, bringIn: 3960, notes: "パーツの脱着が必要な場合は別途工賃が掛かります。DCTフィルター＋880円" },
  { id: "2w_oil_cooler_installation", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "オイルクーラー取り付け", price: 16500, bringIn: 33000, notes: "カウル、マフラー脱着は含みません。（オイル代別途必要）" },
  { id: "2w_gear_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ギアオイル交換", price: 1320, bringIn: 2640, notes: "カウル脱着は別途" },
  { id: "2w_water_temp_gauge_installation", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "水温計取り付け", price: 9900, bringIn: 19800, notes: "タンク、カウル脱着、LLC交換は別途＋8,600円(原付＋5,500円)" },
  { id: "2w_flushing", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "フラッシング", price: 1000, bringIn: 2000 },
  { id: "2w_oil_temp_gauge_installation", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "油温計取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着は別途" },
  { id: "2w_radiator_replacement_cooling", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ラジエター交換", price: 24800, bringIn: 49600, notes: "タンク脱着は含む; カウル脱着は別途" },
  { id: "2w_harley_engine_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ハーレーエンジンオイル交換", price: 1100, bringIn: 2200, notes: "カウル脱着は別途" },
  { id: "2w_harley_oil_element_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ハーレーオイルエレメント交換", price: 1980, bringIn: 3960, notes: "カウル脱着は別途" },
  { id: "2w_harley_primary_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ハーレープライマリーオイル交換", price: 1320, bringIn: 2640, notes: "カウル脱着は別途" },
  { id: "2w_harley_transmission_oil_change", vehicleType: "2輪", cat: "潤滑・冷却系統", name: "ハーレートランスミッションオイル交換", price: 1320, bringIn: 2640, notes: "カウル脱着は別途" },

  // 2輪4stエンジン修理系統
  { id: "2w_4st_engine_removal", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジン脱着", price: 52000, notes: "カウル脱着は別途" },
  { id: "2w_4st_engine_full_overhaul", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジンフルオーバーホール", price: 200000, notes: "シングルエンジンは120,000円; エンジン脱着等は別途" },
  { id: "2w_4st_engine_top_overhaul", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "エンジン腰上オーバーホール", price: 100000, notes: "シングルエンジンは60,000円; エンジン脱着等は別途" },
  { id: "2w_4st_head_overhaul", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ヘッドオーバーホール", price: 60000, notes: "シングルエンジンは40,000円; エンジン脱着等は別途" },
  { id: "2w_4st_valve_stem_seal_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "バルブステムシール交換", price: 0, notes: "エンジン脱着等は別途" },
  { id: "2w_4st_cam_chain_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "カムチェーン交換", price: 0, notes: "エンジン脱着等は別途" },
  { id: "2w_4st_head_cover_gasket_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ヘッドカバーパッキン交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_piston_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ピストン交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_crank_overhaul", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "クランクオーバーホール", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_crank_balancing", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "クランクバランス取り", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_various_sensor_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "各種センサー交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_oil_pump_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "オイルポンプ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_water_pump_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ウォーターポンプ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_spark_plug_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "スパークプラグ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_direct_coil_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ダイレクトコイル交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_4st_transmission_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "トランスミッション交換", price: 0, notes: "エンジン脱着等は別途" },
  { id: "2w_4st_clutch_basket_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "クラッチバスケット交換", price: 0 },
  { id: "2w_4st_pickup_pulse_rotor_replacement", vehicleType: "2輪", cat: "4stエンジン修理系統", name: "ピックアップパルスローター交換", price: 0 },

  // 2輪2stエンジン修理系統
  { id: "2w_2st_engine_removal", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジン脱着", price: 31200, notes: "レーサー等シングルエンジンは8,000円; カウル脱着は別途" },
  { id: "2w_2st_engine_full_overhaul", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジンフルオーバーホール", price: 32500, notes: "レーサー等シングルエンジンは24,000円; エンジン脱着等は別途" },
  { id: "2w_2st_engine_top_overhaul", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "エンジン腰上オーバーホール", price: 16900, notes: "レーサー等シングルエンジンは12,000円; エンジン脱着等は別途" },
  { id: "2w_2st_head_cover_gasket_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "ヘッドカバーパッキン交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_piston_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "ピストン交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_crank_overhaul", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "クランクオーバーホール", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_crank_balancing", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "クランクバランス取り", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_various_sensor_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "各種センサー交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_oil_pump_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "オイルポンプ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_water_pump_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "ウォーターポンプ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_spark_plug_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "スパークプラグ交換", price: 0, notes: "カウル脱着等は別途" },
  { id: "2w_2st_transmission_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "トランスミッション交換", price: 0, notes: "エンジン脱着等は別途" },
  { id: "2w_2st_clutch_basket_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "クラッチバスケット交換", price: 0 },
  { id: "2w_2st_pickup_pulse_rotor_replacement", vehicleType: "2輪", cat: "2stエンジン修理系統", name: "ピックアップパルスローター交換", price: 0 },

  // 2輪吸排気系統
  { id: "2w_air_element_replacement", vehicleType: "2輪", cat: "吸排気系統", name: "エアエレメント交換", price: 2500, bringIn: 5000, notes: "カウル、タンク脱着は別途" },
  { id: "2w_carburetor_oh_under_125cc", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH ～125cc", price: 9900, notes: "タンク脱着込み; キャブレター脱着込み; 同調/CO・HC測定込み; 連結部分解別途; 車種により対応不可の場合あり; 状態により追加料金掛かる場合あり" },
  { id: "2w_carburetor_oh_single", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH シングル", price: 14900, notes: "タンク脱着込み; キャブレター脱着込み; 同調/CO・HC測定込み; 連結部分解別途; 車種により対応不可の場合あり; 状態により追加料金掛かる場合あり" },
  { id: "2w_carburetor_oh_2_cylinder", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH 2気筒", price: 24800, notes: "タンク脱着込み; キャブレター脱着込み; 同調/CO・HC測定込み; 連結部分解別途; 車種により対応不可の場合あり; 状態により追加料金掛かる場合あり" },
  { id: "2w_carburetor_oh_3_cylinder_up", vehicleType: "2輪", cat: "吸排気系統", name: "キャブレターOH 3気筒以上", price: 33000, notes: "タンク脱着込み; キャブレター脱着込み; 同調/CO・HC測定込み; 連結部分解別途; 車種により対応不可の場合あり; 状態により追加料金掛かる場合あり" },
  { id: "2w_muffler_replacement_2_cylinder_up", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 2気筒以上", price: 14900, bringIn: 29800, notes: "カウル脱着は別途; 排気デバイスは別途" },
  { id: "2w_muffler_replacement_single_scooter", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 シングル・スクーター", price: 6600, bringIn: 13200, notes: "カウル脱着は別途; 排気デバイスは別途" },
  { id: "2w_muffler_replacement_slip_on", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 スリップオン", price: 5000, bringIn: 10000, notes: "カウル脱着は別途; 排気デバイスは別途" },
  { id: "2w_muffler_replacement_special_v_center", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー交換 特殊（V型、センター出し）", price: 29700, bringIn: 59400, notes: "カウル脱着は別途; 排気デバイスは別途" },
  { id: "2w_muffler_removal", vehicleType: "2輪", cat: "吸排気系統", name: "マフラー脱着", price: 0, notes: "交換工賃と同額; ガスケット別途; 保安基準違反は作業不可" },

  // 2輪駆動系統
  { id: "2w_drive_system_removal_under_125cc", vehicleType: "2輪", cat: "駆動系統", name: "駆動系脱着（～125ccまで）", price: 6600, bringIn: 13200, notes: "カウル脱着は別途; プーリー側、クラッチ側どちらか片方。(同時の場合は＋2,500円)" },
  { id: "2w_drive_system_removal_over_126cc", vehicleType: "2輪", cat: "駆動系統", name: "駆動系脱着（126cc以上）", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; プーリー側、クラッチ側どちらか片方。(同時の場合は＋2,500円)" },
  { id: "2w_sprocket_replacement_1loc", vehicleType: "2輪", cat: "駆動系統", name: "スプロケット交換（１箇所）", price: 6600, bringIn: 13200, notes: "カウル脱着は別途; マフラー脱着は別途" },
  { id: "2w_sprocket_replacement_front_rear_chain", vehicleType: "2輪", cat: "駆動系統", name: "スプロケット交換（前後）＋チェーン", price: 14900, bringIn: 29800, notes: "カウル脱着は別途; クリップタイプは12,100円" },
  { id: "2w_sprocket_stud_bolt_re_tighten_1pc", vehicleType: "2輪", cat: "駆動系統", name: "スプロケットスタッドボルト打ち換え（1本）", price: 1300, bringIn: 2600, notes: "カウル脱着は別途; スプロケット交換含む" },
  { id: "2w_chain_replacement_clip_joint", vehicleType: "2輪", cat: "駆動系統", name: "チェーン交換（クリップジョイント）", price: 3800, bringIn: 7600, notes: "カウル脱着は別途" },
  { id: "2w_chain_replacement_crimp_joint", vehicleType: "2輪", cat: "駆動系統", name: "チェーン交換（カシメジョント）", price: 6600, bringIn: 13200, notes: "カウル脱着は別途" },
  { id: "2w_chain_adjustment", vehicleType: "2輪", cat: "駆動系統", name: "チェーン調整", price: 2500, notes: "清掃、注油は別料金; カウル脱着は別途" },
  { id: "2w_chain_cleaning_lubrication", vehicleType: "2輪", cat: "駆動系統", name: "チェーン清掃/注油", price: 3300, notes: "カウル脱着は別途; チェーン調整は別料金" },
  { id: "2w_chain_cleaning_lubrication_reikish", vehicleType: "2輪", cat: "駆動系統", name: "チェーン清掃/注油 レイキッシュ", price: 4000, notes: "カウル脱着は別途; チェーン調整は別料金" },
  { id: "2w_chain_lubrication_only", vehicleType: "2輪", cat: "駆動系統", name: "チェーン注油のみ", price: 1700, notes: "カウル脱着は別途; 清掃は別料金" },
  { id: "2w_chain_lubrication_only_reikish", vehicleType: "2輪", cat: "駆動系統", name: "チェーン注油のみ レイキッシュ", price: 2400, notes: "カウル脱着は別途; 清掃は別料金" },
  { id: "2w_drive_belt_replacement_under_125cc", vehicleType: "2輪", cat: "駆動系統", name: "ドライブベルト交換 ～125cc", price: 6600, bringIn: 13200, notes: "カウル脱着は別途" },
  { id: "2w_drive_belt_replacement_over_126cc", vehicleType: "2輪", cat: "駆動系統", name: "ドライブベルト交換 126cc～", price: 9900, bringIn: 19800, notes: "カウル脱着は別途" },
  { id: "2w_hub_damper_replacement", vehicleType: "2輪", cat: "駆動系統", name: "ハブダンパー交換", price: 0, notes: "タイヤ交換と同額" },
  { id: "2w_clutch_plate_replacement", vehicleType: "2輪", cat: "駆動系統", name: "クラッチプレート交換", price: 14900, bringIn: 29800, notes: "カウル脱着は別途; ガスケットは別途" },
  { id: "2w_clutch_fluid_replacement_fluid_not_included", vehicleType: "2輪", cat: "駆動系統", name: "クラッチフルード交換（フルード代別）", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_clutch_hose_replacement", vehicleType: "2輪", cat: "駆動系統", name: "クラッチホース交換", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; ブレーキフルード代込み" },
  { id: "2w_clutch_lever_replacement", vehicleType: "2輪", cat: "駆動系統", name: "クラッチレバー交換", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_clutch_wire_replacement", vehicleType: "2輪", cat: "駆動系統", name: "クラッチワイヤー交換", price: 4100, bringIn: 8200, notes: "タンク、カウル脱着は別途" },
  { id: "2w_crankcase_cover_replacement", vehicleType: "2輪", cat: "駆動系統", name: "クランクケースカバー交換", price: 5000, bringIn: 10000, notes: "カウル加工は別途; ガスケット別途" },

  // 2輪ブレーキ系統 (重複が多いので、IDとnotesで区別)
  { id: "2w_caliper_replacement_single", vehicleType: "2輪", cat: "ブレーキ系統", name: "キャリパー交換（シングル）", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; ブレーキフルード代込み; 純正は6,100円" },
  { id: "2w_caliper_replacement_double", vehicleType: "2輪", cat: "ブレーキ系統", name: "キャリパー交換（ダブル）", price: 11600, bringIn: 23200, notes: "カウル脱着は別途; ブレーキフルード代込み; 純正は8,600円" },
  { id: "2w_single_piston_caliper_oh", vehicleType: "2輪", cat: "ブレーキ系統", name: "片押しキャリパーＯＨ", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; 片押しキャリパー（1個）; ブレーキフルード代込み; 状態により大きく時間変動" },
  { id: "2w_opposed_piston_caliper_oh", vehicleType: "2輪", cat: "ブレーキ系統", name: "対向キャリパーＯＨ", price: 11600, bringIn: 23200, notes: "カウル脱着は別途; 対向キャリパー（1個）; ブレーキフルード代込み; 状態により大きく時間変動" },
  { id: "2w_caliper_cleaning", vehicleType: "2輪", cat: "ブレーキ系統", name: "キャリパー清掃", price: 2640, notes: "カウル脱着は別途; ピストン清掃、グリスアップ" },
  { id: "2w_disc_rotor_replacement_1pc", vehicleType: "2輪", cat: "ブレーキ系統", name: "ディスクローター交換（ブレーキローター）1枚", price: 0, notes: "タイヤ交換と同額" },
  { id: "2w_brake_shoe_replacement_brake", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキシュー交換", price: 0, notes: "タイヤ交換と同額; タイヤと同時交換の場合1,500円; カムOHはプラス1,500円" },
  { id: "2w_brake_pad_replacement_1caliper", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキパッド交換（１キャリパー）", price: 2640, bringIn: 5280, notes: "清掃含む; マフラー・カウル脱着別途; ホイール脱着は別途" },
  { id: "2w_brake_fluid_replacement_1line_fluid_not_included", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキフルード交換（１ライン）フルード代別", price: 2500, bringIn: 5000, notes: "カウル脱着は別途; ブレーキフルード代別" },
  { id: "2w_brake_fluid_replacement_1line_fluid_included", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキフルード交換(１ライン) フルード代込", price: 2900, notes: "カウル脱着は別途; ブレーキフルード代込" },
  { id: "2w_brake_hose_replacement_single", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキホース交換（シングル）", price: 6600, bringIn: 13200, notes: "カウル脱着は別途; 付帯パーツ脱着別途; ブレーキフルード別途; ABS車作業不可の場合有り; ABS付きはABS無しの2倍（付帯パーツ脱着別途）" },
  { id: "2w_brake_hose_replacement_double", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキホース交換（ダブル）", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; 付帯パーツ脱着別途; ブレーキフルード別途; ABS車作業不可の場合有り; ABS付きはABS無しの2倍（付帯パーツ脱着別途）" },
  { id: "2w_brake_hose_replacement_rear", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキホース交換（リア）", price: 6600, bringIn: 13200, notes: "カウル脱着は別途; 付帯パーツ脱着別途; ブレーキフルード別途; ABS車作業不可の場合有り; ABS付きはABS無しの2倍（付帯パーツ脱着別途）" },
  { id: "2w_brake_lever_replacement_1pc", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキレバー交換（1本）", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_brake_rotor_replacement_1pc", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキローター交換（１枚）", price: 0, notes: "タイヤ交換と同額; ダブルディスクの場合は＋1,700円; ローターボルトは必ず交換" },
  { id: "2w_brake_rotor_replacement_1pc_tire_simultaneous", vehicleType: "2輪", cat: "ブレーキ系統", name: "ブレーキローター交換（１枚）タイヤ同時交換", price: 1700, bringIn: 3400, notes: "タイヤ交換と同額; ローターボルトは必ず交換" },
  { id: "2w_master_cylinder_installation_replacement", vehicleType: "2輪", cat: "ブレーキ系統", name: "マスターシリンダー取付(交換)", price: 7400, bringIn: 14800, notes: "カウル脱着は別途; ブレーキフルード代込み" },
  { id: "2w_master_cylinder_oh_clutch", vehicleType: "2輪", cat: "ブレーキ系統", name: "マスターシリンダーＯＨ（クラッチ）", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; ブレーキフルード代込み; 状態により大きく時間が異なります" },
  { id: "2w_master_cylinder_oh_brake", vehicleType: "2輪", cat: "ブレーキ系統", name: "マスターシリンダーＯＨ（ブレーキ）", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; ブレーキフルード代込み; 状態により大きく時間が異なります" },

  // 2輪サスペンション系統
  { id: "2w_fork_oh_upright_no_cartridge", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークOH（正立カートリッジ無）", price: 24800, bringIn: 49600, notes: "カウル脱着は別途; フォーク単体持込の場合のサービス工賃は16,500円; 状態により大きく時間変動" },
  { id: "2w_fork_oh_inverted_upright_cartridge_type", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークOH（倒立・正立カートリッジ式）", price: 29700, bringIn: 59400, notes: "カウル脱着は別途; フォーク単体持込の場合のサービス工賃は21,400円; 状態により大きく時間変動" },
  { id: "2w_fork_oil_change_upright", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークオイル交換（正立）", price: 19800, bringIn: 39600, notes: "カウル脱着は別途" },
  { id: "2w_fork_oil_change_inverted", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークオイル交換（倒立）", price: 19800, bringIn: 39600, notes: "カウル脱着は別途" },
  { id: "2w_fork_spring_replacement_upright", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークスプリング交換（正立）", price: 19800, bringIn: 39600, notes: "カウル脱着は別途" },
  { id: "2w_fork_spring_replacement_inverted", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークスプリング交換（倒立）", price: 19800, bringIn: 39600, notes: "カウル脱着は別途" },
  { id: "2w_fork_boot_replacement", vehicleType: "2輪", cat: "サスペンション系統", name: "フォークブーツ交換", price: 13200, bringIn: 26400, notes: "カウル脱着は別途" },
  { id: "2w_rear_shock_replacement_twin", vehicleType: "2輪", cat: "サスペンション系統", name: "リヤショック交換（ツイン）", price: 7400, bringIn: 14800, notes: "カウル脱着は別途" },
  { id: "2w_rear_shock_replacement_mono", vehicleType: "2輪", cat: "サスペンション系統", name: "リヤショック交換（モノ）", price: 14900, bringIn: 29800, notes: "カウル、タンク脱着は別途" },
  { id: "2w_lowering_bracket_installation_suspension", vehicleType: "2輪", cat: "サスペンション系統", name: "ローダウンブラケット取り付け（サスペンション用ブラケット）", price: 5000, bringIn: 10000, notes: "カウル脱着・加工は別途" },

  // 2輪車体・外装系統
  { id: "2w_inner_fender_removal", vehicleType: "2輪", cat: "車体・外装系統", name: "インナーフェンダー脱着", price: 3300, bringIn: 6600, notes: "タイヤ脱着は含みません。（リアフェンダーの事）" },
  { id: "2w_cowl_removal_1loc", vehicleType: "2輪", cat: "車体・外装系統", name: "カウル脱着（１箇所）", price: 900, notes: "フルカウル左右各900円、アッパー5,400円、アンダー900円、リヤ左右各900円; ビッグスクーター：フロント7,200円、サイド1,800円、ステップ3,600円、リヤ4,500円（シート含む）" },
  { id: "2w_rear_carrier_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "リアキャリア取り付け", price: 5000, bringIn: 10000, notes: "穴あけ加工、カウル脱着は別途" },
  { id: "2w_rear_box_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "リヤBOX取り付け", price: 4100, bringIn: 8200, notes: "ストップランプ付きは別途＋1,500円; すでにキャリアが付いている物への取付" },
  { id: "2w_grab_bar_installation_tandem_grip", vehicleType: "2輪", cat: "車体・外装系統", name: "グラブバー取り付け（タンデムグリップ）", price: 5000, bringIn: 10000, notes: "カウル脱着&加工は別途" },
  { id: "2w_side_stand_replacement", vehicleType: "2輪", cat: "車体・外装系統", name: "サイドスタンド交換", price: 3300, bringIn: 6600, notes: "カウル脱着＆加工は別途" },
  { id: "2w_side_bag_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "サイドバッグ取り付け", price: 4100, bringIn: 8200, notes: "カウル脱着は別途" },
  { id: "2w_sub_frame_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "サブフレーム取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着＆加工は別途" },
  { id: "2w_sissy_bar_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "シーシーバー取り付け", price: 5000, bringIn: 11000, notes: "カウル脱着＆加工は別途" },
  { id: "2w_seat_removal", vehicleType: "2輪", cat: "車体・外装系統", name: "シート脱着", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_seat_cowl_removal", vehicleType: "2輪", cat: "車体・外装系統", name: "シートカウル脱着", price: 5000, bringIn: 10000 },
  { id: "2w_seat_cover_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "シートカバー取り付け", price: 2500, bringIn: 5000, notes: "ビックスクーターは5,000円" },
  { id: "2w_screen_removal", vehicleType: "2輪", cat: "車体・外装系統", name: "スクリーン脱着", price: 3300, bringIn: 6600, notes: "カウル脱着は別途" },
  { id: "2w_step_replacement_1pc", vehicleType: "2輪", cat: "車体・外装系統", name: "ステップ交換（１個）", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_step_board_replacement", vehicleType: "2輪", cat: "車体・外装系統", name: "ステップボード交換", price: 5000, bringIn: 10000, notes: "電飾付きは＋9,900円" },
  { id: "2w_stem_bearing_replacement", vehicleType: "2輪", cat: "車体・外装系統", name: "ステムベアリング交換", price: 24800, bringIn: 49600, notes: "カウル脱着は別途" },
  { id: "2w_center_stand_replacement", vehicleType: "2輪", cat: "車体・外装系統", name: "センタースタンド交換", price: 4100, bringIn: 8200, notes: "カウル脱着＆加工は別途" },
  { id: "2w_center_stand_stopper_replacement", vehicleType: "2輪", cat: "車体・外装系統", name: "センタースタンドストッパー交換", price: 2500, bringIn: 5000, notes: "カウル脱着＆加工は別途" },
  { id: "2w_stand_lubrication_1loc", vehicleType: "2輪", cat: "車体・外装系統", name: "スタンド注油（1箇所）", price: 800, notes: "サイドスタンド、センタースタンド共に1箇所の値段" },
  { id: "2w_tank_removal", vehicleType: "2輪", cat: "車体・外装系統", name: "タンク脱着", price: 2500, bringIn: 5000 },
  { id: "2w_tank_pad_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "タンクパット取り付け", price: 1700, bringIn: 3400 },
  { id: "2w_tandem_bar_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "タンデムバー取り付け", price: 5000, bringIn: 10000, notes: "カウル脱着、加工別途" },
  { id: "2w_back_step_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "バックステップ取り付け", price: 24800, bringIn: 49600, notes: "カウル脱着は別途; ピストンロッド交換含む" },
  { id: "2w_back_rest_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "バックレスト取り付け", price: 5000, bringIn: 11000, notes: "カウル脱着は別途" },
  { id: "2w_bikini_cowl_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "ビキニカウル取り付け", price: 5000, bringIn: 11000 },
  { id: "2w_fenderless_kit_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "フェンダーレスキット取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着は別途" },
  { id: "2w_front_fender", vehicleType: "2輪", cat: "車体・外装系統", name: "フロントフェンダー", price: 5000, bringIn: 10000 },
  { id: "2w_mirror_replacement_1pc", vehicleType: "2輪", cat: "車体・外装系統", name: "ミラー交換（1個）", price: 800, bringIn: 1600, notes: "カウル脱着は別途; 保安基準違反は作業不可" },
  { id: "2w_reflector_installation", vehicleType: "2輪", cat: "車体・外装系統", name: "リフレクター取り付け（反射板）", price: 1700, bringIn: 3400, notes: "カウル脱着は別途" },

  // 2輪リアボックス系統
  { id: "2w_universal_top_case_fitting_installation", vehicleType: "2輪", cat: "リアボックス系統", name: "汎用トップケース用フィッティング取付", price: 4100, bringIn: 8200, notes: "すでにリアキャリアが付いている物に取り付ける場合" },
  { id: "2w_vehicle_specific_top_case_fitting_installation", vehicleType: "2輪", cat: "リアボックス系統", name: "車種別トップケース用フィッティング取付", price: 5800, bringIn: 11600, notes: "穴あけ加工、カウル脱着は別途" },
  { id: "2w_vehicle_specific_side_case_fitting_installation", vehicleType: "2輪", cat: "リアボックス系統", name: "車種別サイドケース用フィッティング取付", price: 9100, bringIn: 18200, notes: "穴あけ加工、カウル脱着は別途" },
  { id: "2w_vehicle_specific_top_side_case_fitting_installation", vehicleType: "2輪", cat: "リアボックス系統", name: "車種別トップケース＋サイドケース用フィッティング取付", price: 11600, bringIn: 23200, notes: "穴あけ加工、カウル脱着は別途" },

  // 2輪ハンドル系統
  { id: "2w_grip_replacement_1unit", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップ交換（1台）", price: 3300, bringIn: 6600, notes: "カウル脱着は別途; アクセルホルダー加工は別途＋1,500円; バーエンド脱着＋1,200円" },
  { id: "2w_grip_end_replacement_1unit", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップエンド交換（１台）", price: 2500, bringIn: 5000, notes: "カウル脱着は別途; バーエンドキャップ（1台）と同作業" },
  { id: "2w_grip_heater_installation_naked_american", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップヒーター取り付け ネイキッド・アメリカン", price: 14000, bringIn: 28000, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_grip_heater_installation_under_125cc_scooter", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップヒーター取り付け ～125ccスクーター", price: 14900, bringIn: 29800, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_grip_heater_installation_big_scooter_cowl", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップヒーター取り付け ビッグスクーター・カウル付き", price: 16500, bringIn: 33000, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_grip_heater_add_relay", vehicleType: "2輪", cat: "ハンドル系統", name: "グリップヒーター 追加リレー", price: 5000, bringIn: 10000, notes: "カウル脱着は別途" },
  { id: "2w_separate_handle_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "セパレートハンドル取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; トップブリッジ脱着は6,100円; 穴あけ加工別途; 加工必要な場合大きく時間が異なります" },
  { id: "2w_bar_end_cap_installation_1unit", vehicleType: "2輪", cat: "ハンドル系統", name: "バーエンドキャップ取り付け（1台）", price: 2500, bringIn: 5000, notes: "グリップエンド（1台）と同作業" },
  { id: "2w_bar_handle_single", vehicleType: "2輪", cat: "ハンドル系統", name: "バーハンドル（単品）", price: 7400, bringIn: 14800, notes: "車種専用（穴あけ）; 穴あけ加工＋1,500円; 穴あけ加工必要な場合大きく時間が異なります" },
  { id: "2w_bar_handle_bracket_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "バーハンドル＋ブラケット取り付け", price: 10700, bringIn: 21400, notes: "バーハンドル交換7,400円+チューニングパーツ取付3,300円" },
  { id: "2w_bar_handle_bracket_installation_post", vehicleType: "2輪", cat: "ハンドル系統", name: "バーハンドルブラケット取り付け（ポスト）", price: 3300, bringIn: 6600, notes: "カウル脱着は別途" },
  { id: "2w_high_throttle_kit_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "ハイスロキット取り付け", price: 12400, bringIn: 24800, notes: "カウル、タンク脱着別途" },
  { id: "2w_handle_up_spacer_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "ハンドルアップスペーサー取り付け", price: 2500, bringIn: 5000, notes: "カウル脱着は別途" },
  { id: "2w_handle_guard_installation_knuckle_guard_left_right", vehicleType: "2輪", cat: "ハンドル系統", name: "ハンドルガード取り付け（ナックルガード）左右", price: 5000, bringIn: 10000, notes: "カウル脱着・加工は別途" },
  { id: "2w_handle_brace_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "ハンドルブレース取り付け", price: 1700, bringIn: 3400, notes: "カウル脱着は別途" },
  { id: "2w_smartphone_holder_installation", vehicleType: "2輪", cat: "ハンドル系統", name: "スマホホルダー取り付け", price: 1700, bringIn: 3400, notes: "電源取り出しタイプは9,900円" },
  { id: "2w_brake_cable_replacement_front", vehicleType: "2輪", cat: "ハンドル系統", name: "ブレーキケーブル交換（フロント）", price: 4100, bringIn: 8200, notes: "カウル脱着は別途" },
  { id: "2w_brake_cable_replacement_rear", vehicleType: "2輪", cat: "ハンドル系統", name: "ブレーキケーブル交換（リア）", price: 4100, bringIn: 8200, notes: "カウル脱着は別途" },
  { id: "2w_wire_lubrication_1loc", vehicleType: "2輪", cat: "ハンドル系統", name: "ワイヤー注油作業(1個所)", price: 3300, notes: "カウル脱着は別途" },

  // 2輪電装品系統
  { id: "2w_etc_installation_cowl_scooter", vehicleType: "2輪", cat: "電装品系統", name: "ETC取り付け カウル付き・スクーター", price: 15840, bringIn: 31680, notes: "カウル、タンク脱着を含む; 取り外しは半額、再取り付けは通常工賃" },
  { id: "2w_etc_installation_naked", vehicleType: "2輪", cat: "電装品系統", name: "ETC取り付け ネイキッド", price: 9240, bringIn: 18480, notes: "タンク脱着を含む; 取り外しは半額、再取り付けは通常工賃" },
  { id: "2w_etc_installation_offroad_american", vehicleType: "2輪", cat: "電装品系統", name: "ETC取り付け オフ車・アメリカン", price: 12540, bringIn: 25080, notes: "カウル、タンク脱着を含む; 取り外しは半額、再取り付けは通常工賃" },
  { id: "2w_etc_setup", vehicleType: "2輪", cat: "電装品系統", name: "ETC セットアップ", price: 2750 },
  { id: "2w_fi_controller_installation", vehicleType: "2輪", cat: "電装品系統", name: "ＦＩコントローラー取り付け", price: 14900, bringIn: 29800, notes: "Fまわりのカウル脱着を含む。（汎用商品は作業不可）" },
  { id: "2w_switch_box_installation_1pc", vehicleType: "2輪", cat: "電装品系統", name: "スイッチボックス取り付け（1個）", price: 3300, bringIn: 6600, notes: "カウル脱着は別途" },
  { id: "2w_voltmeter_installation", vehicleType: "2輪", cat: "電装品系統", name: "電圧計取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着は別途; 加工は別途" },
  { id: "2w_power_outlet_accessory_only", vehicleType: "2輪", cat: "電装品系統", name: "電源取り出し アクセサリーのみ ネイキッド・スクーター・アメリカン・カウル付き", price: 8800, bringIn: 17600, notes: "タンク・カウル脱着含む; ナビと同時の場合は半額" },
  { id: "2w_power_outlet_battery_power_naked", vehicleType: "2輪", cat: "電装品系統", name: "電源取り出し バッテリー電源取り出しあり ネイキッド", price: 11000, bringIn: 22000, notes: "タンク・カウル脱着含む; ナビと同時の場合は半額" },
  { id: "2w_power_outlet_battery_power_scooter_cowl", vehicleType: "2輪", cat: "電装品系統", "name": "電源取り出し バッテリー電源取り出しあり スクーター・カウル付き", price: 18700, bringIn: 37400, notes: "タンク・カウル脱着含む; ナビと同時の場合は半額" },
  { id: "2w_anti_theft_installation", vehicleType: "2輪", cat: "電装品系統", name: "盗難防止機取り付け", price: 9900, bringIn: 19800, notes: "タンク、カウル脱着は別途; センサー取付け、配線加工は別途" },
  { id: "2w_drive_recorder_installation_naked", vehicleType: "2輪", cat: "電装品系統", name: "ドライブレコーダー取付（ネイキッド）", price: 12900, bringIn: 25800, notes: "カメラの個数により時間・金額が異なります; 本体（モニター/一体型）12,900円～; カメラ1つにつき6,100円; GPS1,500円; 外装脱着含む" },
  { id: "2w_drive_recorder_installation_american_offroad", vehicleType: "2輪", cat: "電装品系統", name: "ドライブレコーダー取付（アメリカン・オフロード）", price: 16500, bringIn: 33000, notes: "カメラの個数により時間・金額が異なります; 本体（モニター/一体型）16,500円～; カメラ1つにつき6,100円; GPS1,500円; 外装脱着含む" },
  { id: "2w_drive_recorder_installation_cowl_scooter", vehicleType: "2輪", cat: "電装品系統", name: "ドライブレコーダー取付（カウル付・スクーター）", price: 19800, bringIn: 39600, notes: "カメラの個数により時間・金額が異なります; 本体（モニター/一体型）19,800円～; カメラ1つにつき6,100円; GPS1,500円; 外装脱着含む" },
  { id: "2w_navi_installation", vehicleType: "2輪", cat: "電装品系統", name: "ナビ取り付け", price: 11600, bringIn: 23200, notes: "カウル、タンク脱着含む" },
  { id: "2w_battery_replacement_electrical", vehicleType: "2輪", cat: "電装品系統", name: "バッテリー交換", price: 1650, bringIn: 3300, notes: "カウル、タンク、エアクリーナーボックス、マフラー脱着別途" },
  { id: "2w_battery_charging", vehicleType: "2輪", cat: "電装品系統", name: "バッテリー充電", price: 1650, notes: "バッテリー単体持込の場合; 車載状態の時は別途脱着工賃が必要; 状態により大きく時間が異なります" },
  { id: "2w_fuse_replacement_1loc", vehicleType: "2輪", cat: "電装品系統", name: "ヒューズ交換（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル、タンク脱着別途" },
  { id: "2w_fog_lamp_installation", vehicleType: "2輪", cat: "電装品系統", name: "フォグランプ取り付け", price: 13200, bringIn: 26400, notes: "カウル脱着・加工は別途" },
  { id: "2w_plug_replacement_1pc", vehicleType: "2輪", cat: "電装品系統", name: "プラグ交換（1本）", price: 1000, bringIn: 2000, notes: "カウル、タンク脱着別途; 車種により大きく時間が異なります" },
  { id: "2w_plug_cap_replacement_1pc", vehicleType: "2輪", cat: "電装品系統", name: "プラグキャップ交換（1個）", price: 1000, bringIn: 2000, notes: "カウル、タンク脱着別途" },
  { id: "2w_plug_cord_replacement_1pc", vehicleType: "2輪", cat: "電装品系統", name: "プラグコード交換（1本）", price: 1700, bringIn: 3400, notes: "カウル、タンク脱着別途" },
  { id: "2w_horn_replacement", vehicleType: "2輪", cat: "電装品系統", name: "ホーン交換", price: 3300, bringIn: 6600, notes: "カウル、外装脱着は別途" },
  { id: "2w_hot_grip_installation_naked_american", vehicleType: "2輪", cat: "電装品系統", name: "ホットグリップ取り付け ネイキッド・アメリカン", price: 14000, bringIn: 28000, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_hot_grip_installation_under_125cc_scooter", vehicleType: "2輪", cat: "電装品系統", name: "ホットグリップ取り付け ～125ccスクーター", price: 14900, bringIn: 29800, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_hot_grip_installation_big_scooter_cowl", vehicleType: "2輪", cat: "電装品系統", name: "ホットグリップ取り付け ビッグスクーター・カウル付き", price: 16500, bringIn: 33000, notes: "巻きタイプは2,500円マイナス; アクセルホルダー加工は別途＋1,500円" },
  { id: "2w_hot_grip_add_relay", vehicleType: "2輪", cat: "電装品系統", name: "ホットグリップ追加リレー", price: 5000, bringIn: 10000, notes: "カウル脱着は別途" },
  { id: "2w_radar_installation_electrical", vehicleType: "2輪", cat: "電装品系統", name: "レーダー取り付け", price: 9900, bringIn: 19800, notes: "カウル、タンク脱着・加工は別途" },

  // 2輪ライト・ウインカー系統
  { id: "2w_blinker_replacement_1loc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ウィンカー交換（１ヶ所）", price: 3300, bringIn: 6600, notes: "カウル脱着は別途" },
  { id: "2w_blinker_tail_bulb_replacement_1loc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ウィンカー/テール バルブ交換（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着は別途" },
  { id: "2w_blinker_tail_lens_replacement_1loc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ウィンカー/テール レンズ交換（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着は別途" },
  { id: "2w_blinker_relay_replacement", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ウィンカーリレー交換", price: 1700, bringIn: 3400, notes: "カウル脱着は別途" },
  { id: "2w_led_headlight_replacement_address_v125", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト交換（アドレスV125）", price: 7400, bringIn: 14800, notes: "カウル脱着含む" },
  { id: "2w_led_headlight_replacement_pcx125", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト交換（PCX125）", price: 14000, bringIn: 28000, notes: "カウル脱着含む" },
  { id: "2w_led_headlight_replacement_ape_monkey", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト交換（APE・モンキー）", price: 7400, bringIn: 14800, notes: "タンク脱着含む" },
  { id: "2w_led_headlight_replacement_naked", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト 交換ネイキッド", price: 5000, bringIn: 10000, notes: "カウル脱着、加工含む" },
  { id: "2w_led_headlight_replacement_cowl_scooter_1light", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト交換カウル付き・スクーター1灯", price: 11600, bringIn: 23200, notes: "カウル脱着、加工含む" },
  { id: "2w_led_headlight_replacement_cowl_scooter_2lights", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト交換カウル付き・スクーター2灯", price: 14900, bringIn: 29800, notes: "カウル脱着、加工含む" },
  { id: "2w_led_headlight_replacement_no_harness", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "LEDヘッドライト 交換ハーネス無し", price: 1700, bringIn: 3400, notes: "ライジングα等; カウル脱着、加工は別途" },
  { id: "2w_tail_lamp_assy_replacement", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "テールランプASSY 交換", price: 9900, bringIn: 19800, notes: "ビッグスクーター; カウル脱着は別途" },
  { id: "2w_tail_lamp_bulb_replacement", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "テールランプ球交換", price: 800, bringIn: 1600, notes: "カウル脱着は別途" },
  { id: "2w_tail_lens_replacement_1loc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "テールレンズ交換（1ヶ所）", price: 800, bringIn: 1600, notes: "カウル脱着は別途" },
  { id: "2w_number_plate_bulb_replacement", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ナンバー球交換", price: 800, bringIn: 1600, notes: "カウル脱着は別途" },
  { id: "2w_number_lamp_installation_aftermarket", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ナンバーランプ取り付け（後付）", price: 5800, bringIn: 11600, notes: "カウル脱着・加工は別途" },
  { id: "2w_brake_bulb_replacement_1pc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ブレーキ球交換（1個）", price: 800, bringIn: 1600, notes: "カウル、タンク脱着別途" },
  { id: "2w_headlight_kit_installation", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ヘッドライトキット取り付け", price: 7400, bringIn: 14800, notes: "カウル脱着は別途" },
  { id: "2w_headlight_stay_installation", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ヘッドライトステー取り付け", price: 5000, bringIn: 10000, notes: "トップブリッジ、カウル脱着は別途" },
  { id: "2w_headlight_bulb_replacement_1pc", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ヘッドライトバルブ交換（1個）", price: 1700, bringIn: 3400, notes: "カウル脱着は別途" },
  { id: "2w_headlight_bulb_replacement_moped_scooter", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ヘッドライトバルブ交換（原付スクーター）", price: 2500, bringIn: 5000, notes: "左右ミラー、ヘッドライトカバー脱着含む" },
  { id: "2w_headlight_booster_installation", vehicleType: "2輪", cat: "ライト・ウインカー系統", name: "ヘッドライトブースター取り付け", price: 9900, bringIn: 19800, notes: "カウル脱着は別途" },

  // 2輪溶接修理
  { id: "2w_welding_repair_1loc", vehicleType: "2輪", cat: "溶接修理", name: "溶接修理(１箇所）", price: 10000, notes: "パーツ脱着は別途" },
  { id: "2w_reinforcement_welding", vehicleType: "2輪", cat: "溶接修理", name: "補強溶接", price: 13000, notes: "パーツ脱着は別途" },
  { id: "2w_frame_gusset_welding_1loc", vehicleType: "2輪", cat: "溶接修理", name: "フレームガセット溶接（１箇所）", price: 13000, notes: "パーツ脱着は別途" },
  { id: "2w_muffler_welding_1loc", vehicleType: "2輪", cat: "溶接修理", name: "マフラー溶接(1箇所）", price: 5000, notes: "パーツ脱着は別途" },

  // 2輪その他作業
  { id: "2w_other_domestic_vehicle", vehicleType: "2輪", cat: "その他作業", name: "国産車", price: 10000, notes: "1時間あたり" },
  { id: "2w_other_import_vehicle", vehicleType: "2輪", cat: "その他作業", name: "輸入車", price: 15000, notes: "1時間あたり" },
  { id: "2w_other_special_vehicle", vehicleType: "2輪", cat: "その他作業", name: "特殊車両", price: 20000, notes: "1時間あたり" },

  // 2輪レーシングサービス
  { id: "2w_racing_mechanic_accompany_1day", vehicleType: "2輪", cat: "レーシングサービス", name: "メカニック帯同（1日）", price: 33000, notes: "交通費別途; ピットクルーライセンス登録込み" },
  { id: "2w_racing_data_logging", vehicleType: "2輪", cat: "レーシングサービス", name: "データロギング", price: 11000 },
  { id: "2w_racing_machine_setup", vehicleType: "2輪", cat: "レーシングサービス", name: "マシンセットアップ", price: 11000 },
  { id: "2w_racing_full_pack_1day", vehicleType: "2輪", cat: "レーシングサービス", name: "上記フルパック（1日）", price: 44000 }
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
                                        <div key={key} className="grid grid-cols-12 gap-2">
                                            {/* モバイル: 1行で表示、デスクトップ: ラベルと入力欄を分離 */}
                                            <span className="col-span-6 sm:col-span-12">{label}</span>

                                            {/* 左入力：自賠責=「金額」／その他=「単価」 */}
                                            <input
                                                type="text" inputMode="decimal"
                                                className="col-span-3 sm:col-span-5 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "金額" : "単価"}
                                                value={legalDraft[key].unit}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], unit: e.target.value.replace(/[^\d,.]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: toNum(legalDraft[key].unit), qty: p[key].qty } }))}
                                            />

                                            {/* 右入力：自賠責=「ヶ月」／その他=「個数」 */}
                                            <input
                                                type="text" inputMode="decimal"
                                                className="col-span-3 sm:col-span-3 w-full border rounded px-2 py-1 text-right"
                                                placeholder={isJibai ? "ヶ月" : "個数"}
                                                value={legalDraft[key].qty}
                                                onChange={(e) => setLegalDraft((p) => ({ ...p, [key]: { ...p[key], qty: e.target.value.replace(/[^\d,.]/g, '') } }))}
                                                onBlur={() => setLegal((p) => ({ ...p, [key]: { unit: p[key].unit, qty: toNum(legalDraft[key].qty) } }))}
                                            />

                                            <div className="col-span-12 sm:col-span-4 text-right font-medium">
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
