# Ti-Tech 見積書・請求書ビルダー

バイク・自動車整備向けの見積書/請求書を Excel 形式で生成する Web アプリケーション。
モバイル・デスクトップ両対応で、小数点入力や細かな UI 調整を含む使いやすさを追求。

## 🚀 主な機能

- **見積書・請求書の作成**: 車検、一般整備、修理などに対応
- **Excel(.xlsx)出力**: テンプレートベースの美しいフォーマット
- **品目管理**: プリセット品目と手入力部品の両方に対応
- **法定費用計算**: 自賠責保険、重量税、印紙代の自動計算
- **小数点対応**: 0.1個などの少量部品にも対応（モバイル対応済み）
- **レスポンシブデザイン**: スマートフォン・タブレット・PCすべてで快適に利用可能

## 🛠 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **Excel生成**: ExcelJS
- **デプロイ**: Vercel
- **状態管理**: React Hooks (useState, useEffect, useMemo)

## 📁 プロジェクト構成

```
moto-invoice/
├─ app/
│  ├─ page.tsx                # メインページ（AppClientをレンダリング）
│  ├─ AppClient.tsx           # メインUIコンポーネント（1800行超の中核ファイル）
│  ├─ layout.tsx              # アプリケーションレイアウト、メタデータ設定
│  └─ api/
│     └─ export/
│        └─ route.ts          # Excel生成API（POST /api/export）
│
├─ public/
│  ├─ templates/
│  │  └─ shaken_template.xlsx # Excelテンプレート（F列は D×E の共有数式）
│  └─ logo.png                # ロゴ画像（favicon、Excel内ロゴ）
│
├─ CHANGELOG.md               # 詳細な変更履歴
├─ README.md                  # このファイル
├─ package.json               # 依存関係
├─ tsconfig.json              # TypeScript設定
└─ next.config.js             # Next.js設定
```

## 💻 必要環境

- **Node.js**: 18.0.0 以上（LTS 推奨）
- **パッケージマネージャー**: npm / pnpm / yarn
- **ブラウザ**: Chrome, Safari, Firefox, Edge の最新版
- **GitHub アカウント**: Vercel デプロイ時に必要

## 🚀 セットアップ

### 開発環境の構築

```bash
# リポジトリのクローン
git clone https://github.com/your-org/moto-invoice.git
cd moto-invoice

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ブラウザで開く
# http://localhost:3000
```

### ビルドとデプロイ

```bash
# プロダクションビルド
npm run build

# ビルド結果の確認
npm run start

# Vercelへのデプロイ（自動）
git push origin main
```

## 📝 使い方

### 基本的な作業フロー

1. **初期設定**
   - 画面上部の「設定」ボタンから事業者情報を入力
   - ドキュメントタイプ（見積書/請求書など）を選択

2. **顧客・車両情報の入力**（左サイドパネル）
   - 顧客名、電話番号、メールアドレス、住所
   - 車両情報（登録番号、車種、型式、車台番号など）
   - 走行距離、初年度登録、次回車検日

3. **品目の追加**（中央パネル）
   - **プリセット品目**: カテゴリから選択して追加
   - **手入力部品**: メーカー、品名、部品番号、単価、個数を自由入力
   - 小数点対応（0.1個など少量にも対応）

4. **法定費用の設定**（左サイドパネル下部）
   - **自賠責保険**: 金額と月数を入力（金額のみ計上）
   - **重量税**: 単価×個数で自動計算
   - **印紙代**: 単価×個数で自動計算

5. **調整と確認**（右サイドパネル）
   - 課税対象額、非課税額の確認
   - 調整値引き、預り金の入力
   - 備考欄への追記
   - 合計金額の確認

6. **Excel出力**
   - 「Excel(.xlsx)に出力」ボタンをクリック
   - 自動的にフォーマット済みのExcelファイルがダウンロード

## 🎯 主要コンポーネント詳細

### AppClient.tsx（メインUIコンポーネント）

アプリケーションの中核となる1800行超のTypeScriptコンポーネント。以下の機能を実装：

- **状態管理**: 顧客、車両、品目、法定費用、設定などすべての状態を管理
- **入力検証**: 日本語IME対応、小数点入力、全角半角変換
- **レスポンシブUI**: Tailwind CSSによる3カラムレイアウト
- **リアルタイム計算**: 課税・非課税の自動計算、消費税計算

#### 主要な型定義

```typescript
type CustomPart = { 
  maker: string; 
  name: string; 
  partNo: string; 
  unit: number; 
  qty: number; 
  unitDraft?: string;  // 入力中の文字列保持用
  qtyDraft?: string;   // 入力中の文字列保持用
};

type Legal = Record<LegalKey, QtyUnit>;
type LegalKey = "jibaiseki24m" | "weightTax" | "stamp";
```

### route.ts（Excel生成API）

ExcelJSを使用してテンプレートベースのExcel生成を行う：

- **テンプレート処理**: `shaken_template.xlsx`を読み込み、データを挿入
- **数式保護**: F列の共有数式を保持しながらデータ更新
- **フォーマット**: 通貨表示、小数点表示、セル幅調整
- **動的レイアウト**: 備考の長さに応じたロゴ位置調整

#### Excel出力仕様

- **A1**: ドキュメントタイトル（見積書/請求書など）
- **A15-F36**: 明細行（最大22行）
  - A列: メーカー名
  - B列: 品名・作業名
  - C列: 部品番号
  - D列: 単価
  - E列: 個数（小数点対応）
  - F列: 金額（D×E の共有数式）
- **法定費用**:
  - 自賠責: D9=金額, E9=1（0円なら0）、ラベルを `自賠責保険{月数}ヶ月` に変更
  - 重量税・印紙: 単価×個数で計算
- **数値フォーマット**:
  ```typescript
  const moneyFmt = '"¥"#,##0;-"¥"#,##0';     // 金額
  const qtyFmt = '0.###;-0.###;0';           // 個数（小数3桁まで）
  ```

## 🔧 技術的な特徴

### モバイル対応の工夫

- **inputMode="decimal"**: モバイルで小数点キーボードを表示
- **Draft State Pattern**: 入力中は文字列、確定時に数値変換
- **タッチ最適化**: ボタンサイズ、タップ領域の調整

### パフォーマンス最適化

- **useMemo**: 計算結果のメモ化で再計算を最小化
- **条件付きレンダリング**: 必要な要素のみレンダリング
- **遅延ローカルストレージ**: 設定の非同期保存

### エラー処理

- **型安全**: TypeScriptによる厳密な型チェック
- **入力検証**: 不正な値の自動修正
- **フォールバック**: テンプレート読み込み失敗時の処理

## 🚢 デプロイ（Vercel）

### 初回

1. Vercel に GitHub 連携 → 本リポジトリを Import
2. Framework: **Next.js** / Build Command: `next build` / Output: 自動
3. Deploy

### 以降の更新

```bash
git add app/AppClient.tsx app/api/export/route.ts
git commit -m "feat: update invoice excel output & ui"
git push origin main
# → Vercel が自動デプロイ
```

## 🐛 トラブルシューティング

### よくあるエラーと対処法

#### ビルドエラー

**ESLint: `no-explicit-any` / `ban-ts-comment`**
- **問題**: TypeScript の厳密な型チェックでビルド失敗
- **対策**: `any` を使わず `unknown + 型ガード` で回避

```ts
function isComposingNative(ev: unknown): boolean {
  const obj = ev as { isComposing?: boolean };
  return obj?.isComposing === true;
}
// 使用例
<input onChange={(e)=>{ if (isComposingNative(e.nativeEvent)) return; /* ... */ }} />
```

```
- DOM の値は `(e.target as HTMLInputElement).value` のように **具体型キャスト**
- コメント抑制が必要な場合は **`@ts-expect-error`** を使う（`@ts-ignore` は非推奨）
- 最終手段: `next.config.*` で `eslint.ignoreDuringBuilds=true`（本番では非推奨）
```

* **Invalid hook call**：

  * `AppClient.tsx` の先頭は **`"use client"`**（BOM/空行/コメントより最上位）
  * 開発中に page も `"use client"` にすると切り分けが容易
  * `npm ls react react-dom` で 2重インストールを確認
* **Shared Formula master must exist...**（共有数式エラー）

  * F列をクリア/上書きしていないか確認。**A〜Eのみ**を初期化
  * テンプレの F列の共有範囲が途切れていないか確認
* **¥ が勝手に付く**

  * `moneyFmt` の指定による表示。`"#,##0"` 等に変更
* **全角入力で金額がダブる/NaN**

  * IME合成中は `onChange` を無視し、`onCompositionEnd` で確定値を反映
  * `toIntSafe` で全角→半角/カンマ除去
* **500 の原因が掴めない**

  * 一時的に `POST` 全体を `try/catch` で包み、`{ error, stack }` を返して原因を特定
* **テンプレパス ENOENT**

  * `public/templates/shaken_template.xlsx` の配置とファイル名を確認

---

## よく調整するポイント

* ドキュメント種別の選択肢: `AppClient.tsx` の `<select>`
* 通貨フォーマット: `route.ts` の `moneyFmt`
* 画像の貼付位置: `route.ts` の `ws.addImage(imgId, "A42:A46")`
* テンプレ差し替え: `public/templates/shaken_template.xlsx`

---

## スクリプト

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 開発メモ（仕様の肝）

* **自賠責**は UI/Excel ともに**金額のみ**を計上。月数はラベル表示に用いる
* **F列**はテンプレの**共有数式**を壊さない（原則未タッチ）
* 手入力部品は **メーカー/品名/部品番号/単価/個数** を列で分離して出力

---

## 2025-08-15 改修: 技術料3項目の廃止・備考(A37)対応・内消費税方式への統一

### 目的
- **廃止**: 「部品交換技術料」「車検代行料」「車検整備基本料」を UI/Excel 出力から削除する。
- **代替**: これらの自由記述は **備考** に入力し、Excel テンプレート上の **A37** に書き込む。
- **計算**: 旧「10%対象合計」をやめ、Excel テンプレート（`public/templates/shaken_template.xlsx`）の **内消費税** 計算に従う（`route.ts` で独自計算しない）。
- **注意**: 明細の **F列（共有数式）** は壊さない。明細初期化は **A〜Eのみ** クリアする。

> テンプレート名は `shaken_template.xlsx` に統一。F列は D×E の共有数式前提。

---

### 変更ファイル
- `app/api/export/route.ts`
- `app/AppClient.tsx`（または `AppClient.tsx`）

---

### 変更詳細（#1 形式）

#### 1) `route.ts` の型定義を簡素化（技術料3項目を撤去）

今こうなっているはず:
```ts
type FeeKey = "partsExchangeTech" | "proxy" | "basic";
type Fees = Record<FeeKey, QtyUnit> & {{ discount: number; deposit: number }};
type Meta = {{ date: string; invoiceNo: string; docTitle?: string }};
type ExportPayload = {{
  client: Client; vehicle: Vehicle; items: Item[]; legal: Legal; fees: Fees; settings: Settings; meta: Meta;
  customParts?: CustomPart[];
}};
```

これを **値引き/預り金のみ** にしてください（備考を `Meta` に追加）:
```ts
type Fees = {{ discount: number; deposit: number }};

type Meta = {{ date: string; invoiceNo: string; docTitle?: string; remarks?: string }};

type ExportPayload = {{
  client: Client;
  vehicle: Vehicle;
  items: Item[];
  legal: Legal;
  fees: Fees;           // ← 3項目は廃止
  settings: Settings;
  meta: Meta;           // ← remarks を受け取る
  customParts?: CustomPart[];
}};
```

---

#### 2) 技術料の書き込み（`D37:E39`）を撤去

今こうなっているはず:
```ts
// 5) 技術料（D/Eのみ）
ws.getCell("D37").value = toNum(data.fees.partsExchangeTech.unit); ws.getCell("D37").numFmt = moneyFmt;
ws.getCell("E37").value = toNum(data.fees.partsExchangeTech.qty);  ws.getCell("E37").numFmt = "0";
ws.getCell("D38").value = toNum(data.fees.proxy.unit);             ws.getCell("D38").numFmt = moneyFmt;
ws.getCell("E38").value = toNum(data.fees.proxy.qty);              ws.getCell("E38").numFmt = "0";
ws.getCell("D39").value = toNum(data.fees.basic.unit);             ws.getCell("D39").numFmt = moneyFmt;
ws.getCell("E39").value = toNum(data.fees.basic.qty);              ws.getCell("E39").numFmt = "0";
```

これを **丸ごと削除** してください。  
（`writeAmountF("調整値引き" / "預り金")` は引き続き使用）

---

#### 3) 備考を **A37** に直接書き込む

今こうなっているはず（備考の転記なし）:

これを追加してください:
```ts
// 備考（UI入力）をテンプレート A37 に記入
ws.getCell("A37").value = data.meta?.remarks ?? "";
ws.getCell("A37").alignment = {{ wrapText: true, vertical: "top" }};
```

> テンプレート上で A37 が備考欄。見出しを別セルに保ちたい場合は適宜セルを変更。

---

#### 4) 明細クリアで **F列は触らない**（共有数式保護）

今こうなっているはず:
```ts
for (let r = START; r <= END; r++) {{
  ws.getRow(r).hidden = false;
  ["A","B","C","D","E"].forEach(col => {{ ws.getCell(`${{col}}${{r}}`).value = null; }});
  // F列（共有数式）は触らない
}}
```

このままで OK（A〜Eのみクリア）。F列はテンプレの式に任せる。

---

#### 5) `AppClient.tsx` に備考を追加し、ペイロードに含める

今こうなっているはず:
```ts
const [meta, setMeta] = useState({
  date: todayISO(),
  invoiceNo: "INV-" + todayISO().replaceAll("-", "") + "-001",
  docTitle: "車検見積書",
});
```

これを **remarks 付き** にしてください:
```ts
const [meta, setMeta] = useState({
  date: todayISO(),
  invoiceNo: "INV-" + todayISO().replaceAll("-", "") + "-001",
  docTitle: "車検見積書",
  remarks: "", // ★ 追加
});
```

UI（右ペイン）に追記済みの例:
```tsx
<div className="mt-4">
  <div className="text-sm font-semibold mb-1">備考（Excelに出力）</div>
  <textarea
    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[90px]"
    placeholder="例：工賃は込み、オイルは持込品、納車希望日○/○ など"
    value={meta.remarks || ""}
    onChange={(e) => setMeta({ ...meta, remarks: e.target.value })}
  />
</div>
```

ペイロードは次の通り（変更なし）:
```ts
const payload = { client, vehicle, items, legal, fees, settings, meta, customParts };
```

---

### 計算ポリシー
- UI は参考として **内消費税** を表示してもよいが、**最終計算は Excel テンプレ側の式に準拠**。
- `route.ts` では「10%対象合計」などを **再定義しない**。テンプレの「内消費税」欄で自動計算。

---

### テスト手順（チェックリスト）
1. UI から「部品交換技術料 / 車検代行料 / 車検整備基本料」の入力欄が消えていること。
2. 「調整値引き」「預り金」の入力が Excel 出力に反映されること（該当ラベル行 F 列）。
3. 備考に入力 → 出力した Excel の **A37** に複数行で反映（折返し有効）。
4. 明細クリア時に **F列の式が保持** され、セル E×D に応じて F が自動計算されること。
5. Excel 側で **内消費税** がテンプレートの式どおりに算出され、旧「10%対象合計」は出力に現れないこと。
6. 500 エラー（`partsExchangeTech` 未定義）は発生しないこと。

---

### 既知の注意点
- テンプレートのパスは `public/templates/shaken_template.xlsx`（名称・配置を変更しないこと）。
- 既存のロゴ画像がある場合は `route.ts` で再配置しているため、画像差し替え時は `public/logo.png` を置換。
- ブラウザのローカルストレージに保存された旧設定が残っていると UI 表示に差異が出る場合あり。必要に応じてクリア。

---

## 2025年8月16日の追加改修

### 小数点入力対応

**問題**: スマートフォンで小数点キーボードが表示されるが、実際に小数点を入力できない

**修正内容**:
- 手入力部品の金額・個数入力で小数点入力を可能に
- 法定費用、調整値引き、預り金でも小数点入力に対応
- 品目追加・編集時の個数入力で小数点対応（最小値0.1、ステップ0.1）
- `inputMode="numeric"` → `inputMode="decimal"` に変更
- 入力中は文字列として保持し、フォーカスアウト時に数値変換する方式を採用

```typescript
// 手入力部品の型定義を拡張
type CustomPart = { 
  maker: string; 
  name: string; 
  partNo: string; 
  unit: number; 
  qty: number; 
  unitDraft?: string;  // 入力中の文字列を保持
  qtyDraft?: string;   // 入力中の文字列を保持
};
```

### Excel出力の表示改善

**修正内容**:
1. **個数の小数点表示対応**
   - 新しい数値フォーマット `qtyFmt = '0.#;-0.#;0'` を定義
   - 小数点があれば表示、なければ整数表示（例: 11.2 → "11.2"、11.0 → "11"）

2. **法定費用セルの表示改善**
   - セル幅の自動調整（D列・F列: 12文字、E列: 8文字）
   - セル内配置の改善（金額は右寄せ、個数は中央寄せ、縦中央配置）
   - 大きな金額（10,000円など）でもセルからはみ出ない

3. **計算ロジックの修正**
   - 合計①+②の計算を正確に実行
   - Excel出力時にサーバーサイドで正しい計算値を直接設定
   - デバッグログを追加して計算過程を可視化

4. **表示ラベルの改善**
   - 「小計」→「小計（税込）②」に変更
   - 走行距離の数字を中央揃いに設定
   - 名前の位置を既存の「様」セルに設定し、既存の書式を保持

### ホームページアイコン設定

**修正内容**:
- `app/layout.tsx`でfaviconの設定を追加
- `/logo.png`をicon、shortcut、apple-touch-iconとして設定
- ページタイトルを「Ti-Tech見積書・請求書ビルダー」に変更

```typescript
export const metadata: Metadata = {
  title: "Ti-Tech見積書・請求書ビルダー",
  description: "Ti-Tech見積書・請求書ビルダー",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};
```

### 技術的詳細

#### 小数点処理関数
```typescript
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
```

#### Excel数値フォーマット定義
```typescript
const moneyFmt = '"¥"#,##0;-"¥"#,##0';     // 金額表示
const qtyFmt = '0.#;-0.#;0';               // 個数表示（小数点対応）
```

### 修正対象ファイル
- `app/AppClient.tsx`: UI改善、小数点入力対応
- `app/layout.tsx`: favicon設定
- `app/api/export/route.ts`: Excel出力改善、計算修正、表示調整

### 動作確認ポイント
1. スマートフォンで小数点キーボードが表示され、実際に小数点入力ができること
2. 手入力部品でフォーカスアウト後も入力値が保持されること
3. Excel出力で個数の小数点が正しく表示されること（11.2 → "11.2"）
4. 法定費用で大きな金額でもセルからはみ出ないこと
5. 合計①+②の計算が正確であること（例: ①12,000 + ②10,000 = 22,000）
6. ブラウザタブにlogo.pngのアイコンが表示されること

---

## 📊 最新のアップデート（2025年8月16日）

### 🎯 主要な改善点

#### 1. モバイル小数点入力完全対応
- **課題**: モバイルで小数点キーボードが表示されるが入力不可
- **解決**: `inputMode="decimal"` + Draft State Pattern で完全対応
- **効果**: 0.1個などの少量部品入力が可能に

#### 2. デスクトップ表示最適化
- **課題**: 法定費用で大きな金額（10,000円）がボックスからはみ出し  
- **解決**: 入力レイアウトを改行式に変更、十分な幅を確保
- **効果**: 視認性向上、入力ミス削減

#### 3. Excel計算精度の完全修正
- **課題**: 合計①+②の計算が不正確（例: 12,000+10,000=13,000）
- **解決**: 値引き前の課税対象額を使用する正しい計算式に修正
- **効果**: 100% 正確な金額計算を実現

#### 4. ブランディング強化
- favicon設定で企業アイデンティティ向上
- ページタイトル統一で SEO 改善
- Excel出力フォーマットの細かな調整

### 🔧 技術的革新ポイント

```typescript
// Draft State Pattern による安全な数値入力
type CustomPart = { 
  unit: number; qty: number;
  unitDraft?: string;  // 入力中の一時保存
  qtyDraft?: string;   // 確定時に数値変換
};

// 小数点対応フォーマット
const qtyFmt = '0.###;-0.###;0';  // 最大3桁小数表示
```

### 📱 対応済み機能一覧
- ✅ モバイル小数点入力（0.1〜999.999）
- ✅ デスクトップ大きな金額表示（10,000円以上）  
- ✅ Excel出力の100%正確な計算
- ✅ レスポンシブデザイン全画面対応
- ✅ 日本語IME完全対応
- ✅ ブラウザfavicon設定
- ✅ TypeScript型安全性
