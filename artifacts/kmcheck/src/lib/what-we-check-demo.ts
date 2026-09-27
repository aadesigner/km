import type { WhatWeCheckMarket } from "./what-we-check-features";
import { demoCarPhotoUrl } from "./demo-car-photos";

export type WwcDemoFinding = {
  labelKey: string;
  valueKey: string;
  tone: "positive" | "negative" | "neutral";
};

export type WwcDemoHistoryRow = {
  date: string;
  primary: string;
  primaryKey?: string;
  detailKey: string;
};

export type WwcMileagePoint = {
  year: string;
  km: number;
  rollback?: boolean;
};

export type WwcAccidentHot = {
  front: boolean;
  left: boolean;
  right: boolean;
  rear: boolean;
};

export type WwcDemoReport = {
  vin: string;
  vehicleTitle: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  engine: string;
  transmission: string;
  fuelKey: string;
  colorKey: string;
  bodyKey: string;
  odometer: number;
  score: string;
  scoreLabelKey: "report_caution" | "report_clean" | "report_risk";
  originKey: string;
  photoUrl: string;
  ownerCount: number;
  findings: Record<"mileage" | "accidents" | "salvage" | "theft", WwcDemoFinding>;
  mileageChart: WwcMileagePoint[];
  mileageRows: WwcDemoHistoryRow[];
  accidentRows: WwcDemoHistoryRow[];
  salvageRows: WwcDemoHistoryRow[];
  theftRows: WwcDemoHistoryRow[];
  salvageNoteKey: string;
  theftNoteKey: string;
  accidentHot: WwcAccidentHot;
  ownerRows: WwcDemoHistoryRow[];
};

const KOREA_DEMO: WwcDemoReport = {
  vin: "KNDPM3AC9K7583241",
  vehicleTitle: "2019 Kia Sportage",
  make: "Kia",
  model: "Sportage",
  year: 2019,
  trim: "GT-Line 2.0 CRDi",
  engine: "2.0 CRDi",
  transmission: "Automatic",
  fuelKey: "wwc_demo_fuel_diesel",
  colorKey: "wwc_demo_color_white",
  bodyKey: "wwc_demo_body_suv",
  odometer: 138_640,
  score: "6.4",
  scoreLabelKey: "report_caution",
  originKey: "country_korea_name",
  photoUrl: demoCarPhotoUrl("kia-sportage.jpg"),
  ownerCount: 3,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_status", tone: "negative" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n3", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2019", km: 18_247 },
    { year: "2020", km: 41_883 },
    { year: "2021", km: 89_417 },
    { year: "2022", km: 64_290, rollback: true },
    { year: "2023", km: 112_084 },
    { year: "2024", km: 138_640 },
  ],
  mileageRows: [
    { date: "2024-03", primary: "138,640 km", detailKey: "wwc_demo_src_encar_list" },
    { date: "2023-08", primary: "112,084 km", detailKey: "wwc_demo_src_kotsa" },
    { date: "2022-03", primary: "64,290 km", detailKey: "wwc_demo_row_rollback" },
    { date: "2021-11", primary: "89,417 km", detailKey: "wwc_demo_row_insurance" },
    { date: "2020-06", primary: "41,883 km", detailKey: "wwc_demo_src_service" },
    { date: "2019-11", primary: "18,247 km", detailKey: "wwc_demo_row_registration" },
  ],
  accidentRows: [
    { date: "2022-06", primary: "", primaryKey: "wwc_demo_event_front", detailKey: "wwc_demo_repair_seoul" },
    { date: "2021-02", primary: "", primaryKey: "wwc_demo_event_left", detailKey: "wwc_demo_repair_busan" },
    { date: "2020-03", primary: "", primaryKey: "wwc_demo_event_right", detailKey: "wwc_demo_repair_incheon" },
  ],
  salvageRows: [
    { date: "2024-03", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_encar_clear" },
    { date: "2023-08", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_kotsa_clear" },
    { date: "2021-11", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_ins_kr" },
    { date: "2019-11", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_reg_kr" },
  ],
  theftRows: [
    { date: "2024-03", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_kr_police" },
    { date: "2022-06", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_kr_ins" },
    { date: "2019-11", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_kr_reg" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note_kr",
  theftNoteKey: "wwc_demo_theft_note_kr",
  accidentHot: { front: true, left: true, right: true, rear: false },
  ownerRows: [
    { date: "2023-01", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2021-07", primary: "", primaryKey: "wwc_demo_owner_fleet", detailKey: "wwc_demo_row_owner_fleet" },
    { date: "2019-11", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const USA_DEMO: WwcDemoReport = {
  vin: "2HKRW2H50JH612847",
  vehicleTitle: "2018 Honda CR-V",
  make: "Honda",
  model: "CR-V",
  year: 2018,
  trim: "EX 1.5T AWD",
  engine: "1.5T",
  transmission: "CVT",
  fuelKey: "wwc_demo_fuel_petrol",
  colorKey: "wwc_demo_color_silver",
  bodyKey: "wwc_demo_body_suv",
  odometer: 142_608,
  score: "6.1",
  scoreLabelKey: "report_caution",
  originKey: "country_usa_name",
  photoUrl: demoCarPhotoUrl("honda-crv.jpg"),
  ownerCount: 3,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_status", tone: "negative" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n3", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2018", km: 12_486 },
    { year: "2019", km: 41_883 },
    { year: "’21", km: 89_417 },
    { year: "’21↓", km: 67_240, rollback: true },
    { year: "2022", km: 98_331 },
    { year: "2024", km: 142_608 },
  ],
  mileageRows: [
    { date: "2024-02", primary: "142,608 km", detailKey: "wwc_demo_src_copart" },
    { date: "2022-06", primary: "98,331 km", detailKey: "wwc_demo_src_nj_title" },
    { date: "2021-09", primary: "67,240 km", detailKey: "wwc_demo_row_rollback" },
    { date: "2021-03", primary: "89,417 km", detailKey: "wwc_demo_row_insurance" },
    { date: "2019-11", primary: "41,883 km", detailKey: "wwc_demo_src_tx_inspect" },
    { date: "2018-08", primary: "12,486 km", detailKey: "wwc_demo_src_tx_title" },
  ],
  accidentRows: [
    { date: "2022-01", primary: "", primaryKey: "wwc_demo_event_right", detailKey: "wwc_demo_repair_side_newark" },
    { date: "2021-07", primary: "", primaryKey: "wwc_demo_event_front", detailKey: "wwc_demo_repair_front_dallas" },
    { date: "2019-04", primary: "", primaryKey: "wwc_demo_event_rear", detailKey: "wwc_demo_repair_rear_houston" },
  ],
  salvageRows: [
    { date: "2024-02", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_copart_none" },
    { date: "2023-06", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_nmvtis" },
    { date: "2021-11", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_fl_clean" },
    { date: "2018-08", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_tx_clean" },
  ],
  theftRows: [
    { date: "2024-02", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_nicb" },
    { date: "2022-01", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_ncic" },
    { date: "2019-04", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_us_ins" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note_us",
  theftNoteKey: "wwc_demo_theft_note_us",
  accidentHot: { front: true, left: false, right: true, rear: true },
  ownerRows: [
    { date: "2022-06", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2019-11", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2018-08", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const CANADA_DEMO: WwcDemoReport = {
  vin: "2T3P1RFV8NW218394",
  vehicleTitle: "2022 Toyota RAV4",
  make: "Toyota",
  model: "RAV4",
  year: 2022,
  trim: "XLE AWD",
  engine: "2.5L",
  transmission: "Automatic",
  fuelKey: "wwc_demo_fuel_petrol",
  colorKey: "wwc_demo_color_grey",
  bodyKey: "wwc_demo_body_suv",
  odometer: 47_918,
  score: "7.8",
  scoreLabelKey: "report_caution",
  originKey: "country_canada_name",
  photoUrl: demoCarPhotoUrl("toyota-rav4.jpg"),
  ownerCount: 2,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_clear", tone: "positive" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n1", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2022", km: 8_214 },
    { year: "2023", km: 21_670 },
    { year: "2024", km: 34_105 },
    { year: "2025", km: 47_918 },
  ],
  mileageRows: [
    { date: "2025-01", primary: "47,918 km", detailKey: "wwc_demo_src_on_mto" },
    { date: "2024-04", primary: "34,105 km", detailKey: "wwc_demo_src_carproof" },
    { date: "2023-09", primary: "21,670 km", detailKey: "wwc_demo_src_service" },
    { date: "2022-11", primary: "8,214 km", detailKey: "wwc_demo_src_qc_saaq" },
  ],
  accidentRows: [
    { date: "2023-11", primary: "", primaryKey: "wwc_demo_event_rear", detailKey: "wwc_demo_repair_toronto" },
  ],
  salvageRows: [
    { date: "2025-01", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_on_clean" },
    { date: "2024-04", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_canada_auc" },
    { date: "2023-02", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_ab_clean" },
    { date: "2022-03", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_on_first" },
  ],
  theftRows: [
    { date: "2025-01", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_cpi" },
    { date: "2023-11", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_opp" },
    { date: "2022-03", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_ca_ins" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note_ca",
  theftNoteKey: "wwc_demo_theft_note_ca",
  accidentHot: { front: false, left: false, right: false, rear: true },
  ownerRows: [
    { date: "2024-01", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2022-03", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const CHINA_DEMO: WwcDemoReport = {
  vin: "LC0C76C45N0123456",
  vehicleTitle: "2023 BYD Han",
  make: "BYD",
  model: "Han",
  year: 2023,
  trim: "EV Premium",
  engine: "Electric",
  transmission: "Automatic",
  fuelKey: "wwc_demo_fuel_electric",
  colorKey: "wwc_demo_color_black",
  bodyKey: "wwc_demo_body_sedan",
  odometer: 28_441,
  score: "8.1",
  scoreLabelKey: "report_clean",
  originKey: "country_china_name",
  photoUrl: demoCarPhotoUrl("byd-han-ev.jpg"),
  ownerCount: 1,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_clear", tone: "positive" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n1", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2023", km: 6_118 },
    { year: "2024", km: 17_902 },
    { year: "2025", km: 28_441 },
  ],
  mileageRows: [
    { date: "2025-02", primary: "28,441 km", detailKey: "wwc_demo_src_china_ins" },
    { date: "2024-07", primary: "17,902 km", detailKey: "wwc_demo_src_service" },
    { date: "2023-09", primary: "6,118 km", detailKey: "wwc_demo_row_registration" },
  ],
  accidentRows: [
    { date: "2024-05", primary: "", primaryKey: "wwc_demo_event_front", detailKey: "wwc_demo_repair_shenzhen" },
  ],
  salvageRows: [
    { date: "2025-02", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_cn_clear" },
    { date: "2024-05", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_cn_ins" },
    { date: "2023-04", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_cn_reg" },
  ],
  theftRows: [
    { date: "2025-02", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_cn_police" },
    { date: "2023-04", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_cn_ins" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note",
  theftNoteKey: "wwc_demo_theft_note",
  accidentHot: { front: true, left: false, right: false, rear: false },
  ownerRows: [
    { date: "2023-04", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const JAPAN_DEMO: WwcDemoReport = {
  vin: "JTDKN3DU5A0123456",
  vehicleTitle: "2021 Toyota Prius",
  make: "Toyota",
  model: "Prius",
  year: 2021,
  trim: "S",
  engine: "1.8 Hybrid",
  transmission: "CVT",
  fuelKey: "wwc_demo_fuel_hybrid",
  colorKey: "wwc_demo_color_white",
  bodyKey: "wwc_demo_body_hatch",
  odometer: 61_273,
  score: "7.6",
  scoreLabelKey: "report_caution",
  originKey: "country_japan_name",
  photoUrl: demoCarPhotoUrl("toyota-prius.jpg"),
  ownerCount: 2,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_clear", tone: "positive" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n1", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2021", km: 9_440 },
    { year: "2022", km: 28_106 },
    { year: "2023", km: 44_812 },
    { year: "2024", km: 61_273 },
  ],
  mileageRows: [
    { date: "2024-10", primary: "61,273 km", detailKey: "wwc_demo_src_japan_auction" },
    { date: "2023-11", primary: "44,812 km", detailKey: "wwc_demo_src_japan_shaken" },
    { date: "2022-08", primary: "28,106 km", detailKey: "wwc_demo_src_service" },
    { date: "2021-05", primary: "9,440 km", detailKey: "wwc_demo_row_registration" },
  ],
  accidentRows: [
    { date: "2023-03", primary: "", primaryKey: "wwc_demo_event_rear", detailKey: "wwc_demo_repair_osaka" },
  ],
  salvageRows: [
    { date: "2024-10", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_jp_auction" },
    { date: "2023-11", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_jp_shaken" },
    { date: "2021-05", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_jp_reg" },
  ],
  theftRows: [
    { date: "2024-10", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_jp_police" },
    { date: "2021-05", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_jp_ins" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note",
  theftNoteKey: "wwc_demo_theft_note",
  accidentHot: { front: false, left: false, right: false, rear: true },
  ownerRows: [
    { date: "2023-04", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2021-05", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const UAE_DEMO: WwcDemoReport = {
  vin: "WDDWF4KB0KR123456",
  vehicleTitle: "2019 Mercedes-Benz C200",
  make: "Mercedes-Benz",
  model: "C-Class",
  year: 2019,
  trim: "C200 Avantgarde",
  engine: "2.0 Turbo",
  transmission: "Automatic",
  fuelKey: "wwc_demo_fuel_petrol",
  colorKey: "wwc_demo_color_black",
  bodyKey: "wwc_demo_body_sedan",
  odometer: 76_504,
  score: "7.2",
  scoreLabelKey: "report_caution",
  originKey: "country_uae_name",
  photoUrl: demoCarPhotoUrl("mercedes-c-class.jpg"),
  ownerCount: 2,
  findings: {
    mileage: { labelKey: "mock_label_mileage", valueKey: "wwc_preview_mileage_clear", tone: "positive" },
    accidents: { labelKey: "mock_label_accidents", valueKey: "wwc_preview_accidents_n1", tone: "negative" },
    salvage: { labelKey: "mock_label_salvage", valueKey: "wwc_preview_salvage_status", tone: "positive" },
    theft: { labelKey: "mock_label_stolen", valueKey: "wwc_preview_theft_status", tone: "positive" },
  },
  mileageChart: [
    { year: "2019", km: 11_208 },
    { year: "2021", km: 34_771 },
    { year: "2023", km: 55_940 },
    { year: "2025", km: 76_504 },
  ],
  mileageRows: [
    { date: "2025-01", primary: "76,504 km", detailKey: "wwc_demo_src_uae_rta" },
    { date: "2023-06", primary: "55,940 km", detailKey: "wwc_demo_src_service" },
    { date: "2021-04", primary: "34,771 km", detailKey: "wwc_demo_row_insurance" },
    { date: "2019-09", primary: "11,208 km", detailKey: "wwc_demo_row_registration" },
  ],
  accidentRows: [
    { date: "2022-08", primary: "", primaryKey: "wwc_demo_event_front", detailKey: "wwc_demo_repair_dubai" },
  ],
  salvageRows: [
    { date: "2025-01", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_uae_rta" },
    { date: "2022-08", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_uae_ins" },
    { date: "2019-09", primary: "", primaryKey: "wwc_preview_salvage_status", detailKey: "wwc_demo_salvage_uae_reg" },
  ],
  theftRows: [
    { date: "2025-01", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_uae_police" },
    { date: "2019-09", primary: "", primaryKey: "wwc_preview_theft_status", detailKey: "wwc_demo_theft_uae_ins" },
  ],
  salvageNoteKey: "wwc_demo_salvage_note",
  theftNoteKey: "wwc_demo_theft_note",
  accidentHot: { front: true, left: false, right: false, rear: false },
  ownerRows: [
    { date: "2022-01", primary: "", primaryKey: "wwc_demo_owner_private", detailKey: "wwc_demo_row_owner_private" },
    { date: "2019-09", primary: "", primaryKey: "wwc_demo_owner_dealer", detailKey: "wwc_demo_row_owner_dealer" },
  ],
};

const MARKET_DEMOS: Record<WhatWeCheckMarket, WwcDemoReport> = {
  korea: KOREA_DEMO,
  usa: USA_DEMO,
  canada: CANADA_DEMO,
  china: CHINA_DEMO,
  japan: JAPAN_DEMO,
  uae: UAE_DEMO,
};

export function getWhatWeCheckDemoReport(market?: WhatWeCheckMarket): WwcDemoReport {
  if (!market) return KOREA_DEMO;
  return MARKET_DEMOS[market] ?? KOREA_DEMO;
}
