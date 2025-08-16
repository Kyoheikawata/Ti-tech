# Ti-tech Moto Invoice

バイク整備・車検向けの見積/請求 Excel を生成する Next.js アプリ。

* フロント: Next.js (App Router) + Tailwind
* 出力: ExcelJS + 既存テンプレート `public/templates/shaken_template.xlsx`
* デプロイ: Vercel（推奨）

---

## フォルダ構成

```
Ti-tech/
├─ app/
│  ├─ page.tsx                # 入口 (<AppClient /> を描画)
│  ├─ AppClient.tsx           # UI: 明細/法定費用/手入力部品/出力ボタン
│  └─ api/
│     └─ export/
│        └─ route.ts          # Excel 生成API（ExcelJS）
│
├─ public/
│  ├─ templates/
│  │  └─ shaken_template.xlsx # Excelテンプレ（F列は D×E の共有数式）
│  └─ logo.png                # 見積書ロゴ（任意）
│
├─ next.config.(js|ts)        # 必要に応じて ESLint/最適化設定
├─ package.json
├─ tsconfig.json
└─ .eslintrc.*                # Lint ルール
```

---

## 必要環境

* Node.js 18+（LTS 推奨）
* npm / pnpm / yarn のいずれか
* GitHub アカウント（Vercel 連携時）

---

## 初回セットアップ

```bash
# 依存関係
npm i

# 開発起動
npm run dev
# http://localhost:3000 を開く
```

### 重要ファイル

* テンプレ: `public/templates/shaken_template.xlsx`

  * **F列は D×E の共有数式**（壊さない）
  * 列順: A=メーカー / B=品名・作業名 / C=部品番号 / D=単価 / E=個数 / F=金額
* ロゴ: `public/logo.png`（任意。無い場合は自動スキップ）

---

## 使い方（アプリ）

1. 画面上部の **設定** で事業者情報・ドキュメント種別（見積/請求）を入力
2. 左ペインで顧客・車両情報を入力
3. 中央ペインの **品目一覧** から追加、または **手入力部品** で自由入力

   * 手入力部品: メーカー/品目/部品番号/金額(円)/個数 を行追加で複数登録
   * 日本語 IME 合成中の数値重複を防止済み
4. **法定費用（非課税）**

   * **自賠責**: 金額のみを計上（掛け算しない）。月数はラベル表示に使用
   * **重量税/印紙**: 単価×個数で計上
   * 画面の非課税小計は Excel と一致
5. 右ペインで金額を確認し、**Excel(.xlsx)に出力** をクリック

---

## Excel 出力の仕様（route.ts）

* タイトル: `meta.docTitle` を **A1** に反映（車検見積書/請求書/整備…etc）
* 法定費用:

  * 自賠責 → **D9=金額 / E9=1（0円なら0）**、ラベルを `自賠責保険{月数}ヶ月` に書換
  * 重量税・印紙 → 従来どおり 単価×個数
* 明細（A15\:F36）:

  * **A=メーカー / B=品名 / C=部品番号 / D=単価 / E=個数 / F=金額**
  * **F列はテンプレの共有数式を尊重**（原則クリア/上書きしない）
  * もしテンプレに式が無い行があれば、フォールバックで `D{r}*E{r}` を注入可（実装済/任意）
* 通貨表示: `moneyFmt = '"¥"#,##0;-"¥"#,##0'`

  * "¥"を出したくない → `"#,##0"` に変更、または `numFmt` を適用しない

---

## デプロイ（Vercel）

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

---

## トラブルシュート

* **ESLint: `no-explicit-any` / `ban-ts-comment` でビルド失敗**

  * デプロイ時（Vercel）に ESLint がエラー扱い→ビルド停止することがあります。
  * 対策:

    * `any` を使わず **unknown + 型ガード** で回避。例: 日本語IMEの合成判定

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
