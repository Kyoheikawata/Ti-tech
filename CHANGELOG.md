# Ti-Tech見積書・請求書ビルダー 修正記録

## 2025年8月16日の修正

### 1. 手入力部品の小数点入力対応

**問題**: 手入力部品の個数入力で、小数点がキーボードに表示されるが入力できない

**修正内容**:
- `CustomPart`型に`unitDraft`と`qtyDraft`フィールドを追加
- 入力中は文字列として保持し、フォーカスアウト時に数値変換する方式に変更
- `onChange`で文字列をそのまま保持、`onBlur`で`toDecimalSafe`関数を使って数値変換
- プレースホルダーを「例: 2.5」に更新

**影響ファイル**: `app/AppClient.tsx`

### 2. ホームページアイコン設定

**問題**: faviconが設定されていない

**修正内容**:
- `app/layout.tsx`のmetadataにfaviconの設定を追加
- `/logo.png`をicon、shortcut、apple-touch-iconとして設定
- タイトルも「Ti-Tech見積書・請求書ビルダー」に変更

**影響ファイル**: `app/layout.tsx`

### 3. 全体的な小数点入力対応

**問題**: 手入力部品以外でも小数点入力ができない

**修正内容**:
- 法定費用の入力フィールド: `inputMode="numeric"` → `inputMode="decimal"`
- 調整値引き・預り金入力: `inputMode="numeric"` → `inputMode="decimal"`
- 品目追加時の個数入力: `min={0.1}` `step={0.1}`追加
- 見積プレビューの個数入力: `min={0.1}` `step={0.1}`追加
- 正規表現を`/[^\d,]/g`から`/[^\d,.]/g`に変更して小数点を許可

**影響ファイル**: `app/AppClient.tsx`

### 4. 手入力部品の入力値保持修正

**問題**: 手入力部品でフォーカスアウト時に入力した数字が消える

**修正内容**:
- `onBlur`で`unitDraft: ""`と`qtyDraft: ""`を`undefined`に変更
- `updateQty`、`addItem`関数の最小値を0.1に変更

**影響ファイル**: `app/AppClient.tsx`

### 5. Excel出力の計算修正

**問題**: 合計①+②の計算が間違っている（例: ①12,000 + ②10,000 = 22,000 が 13,000 になる）

**修正内容**:
- 自賠責保険の計算で`L9 = jbUnit * jbQtyXls`を`L9 = jbUnit`に修正
- 合計①+②を正しく計算してExcelの合計セルに直接設定
- デバッグログを追加して計算過程を可視化

**影響ファイル**: `app/api/export/route.ts`

### 6. Excel表示の改善

**修正内容**:
- 「小計」を「小計（税込）②」に変更
- 走行距離の数字を中央揃いに設定
- 名前の位置を既存の「様」セルに設定し、既存の書式を保持

**影響ファイル**: `app/api/export/route.ts`

### 7. Excel個数表示の小数点対応

**問題**: 個数で小数点以下が表示されない（例: 11.2 → 11）

**修正内容**:
- 新しい数値フォーマット`qtyFmt = '0.#;-0.#;0'`を定義
- すべての個数セル（E列）のフォーマットを変更
- 小数点があれば表示、なければ整数表示（例: 11.2 → "11.2"、11.0 → "11"）

**影響ファイル**: `app/api/export/route.ts`

### 8. Excel法定費用セルの表示改善

**問題**: 10,000円など桁数が大きい金額がセルからはみ出る

**修正内容**:
- D列（単価）: 最小12文字幅
- E列（個数）: 最小8文字幅
- F列（合計）: 最小12文字幅
- セル内配置を改善（金額は右寄せ、個数は中央寄せ、縦中央配置）

**影響ファイル**: `app/api/export/route.ts`

## 技術的詳細

### 型定義の追加
```typescript
type CustomPart = { 
  maker: string; 
  name: string; 
  partNo: string; 
  unit: number; 
  qty: number; 
  unitDraft?: string; 
  qtyDraft?: string; 
};
```

### 小数点処理関数
```typescript
const toDecimalSafe = (raw: string, decimalPlaces: number = 1) => {
  // 全角数字を半角に変換
  // 数字と小数点以外を削除
  // 複数の小数点を処理
  // 小数点以下の桁数を制限
}
```

### Excel数値フォーマット
```typescript
const moneyFmt = '"¥"#,##0;-"¥"#,##0';     // 金額表示
const qtyFmt = '0.#;-0.#;0';               // 個数表示（小数点対応）
```

## 今後の改善予定

- [ ] より詳細な入力検証の追加
- [ ] パフォーマンスの最適化
- [ ] レスポンシブデザインの改善
- [ ] エラーハンドリングの強化

---

**更新者**: Claude Code Assistant  
**更新日**: 2025年8月16日