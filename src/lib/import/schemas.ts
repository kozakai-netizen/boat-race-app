import { z } from 'zod'

/**
 * Players CSV import用のZodスキーマ
 */

// プレイヤー行のスキーマ（CSV行データ）
export const PlayersRowSchema = z.object({
  reg_no: z
    .string()
    .or(z.number())
    .transform(v => String(v).trim())
    .refine(v => /^\d+$/.test(v), {
      message: '登録番号は数値で入力してください'
    })
    .refine(v => v.length >= 1 && v.length <= 10, {
      message: '登録番号は1-10桁で入力してください'
    }),

  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(50, '氏名は50文字以内で入力してください')
    .transform(v => v.trim()),

  grade: z.enum(['A1', 'A2', 'B1', 'B2'], {
    message: '級別はA1, A2, B1, B2のいずれかで入力してください'
  }),

  name_kana: z
    .string()
    .optional()
    .nullable()
    .transform(v => {
      if (!v || v.trim() === '') return null
      return v.trim()
    }),

  external_url: z
    .string()
    .optional()
    .nullable()
    .transform(v => {
      if (!v || v.trim() === '') return null
      return v.trim()
    })
    .refine(v => {
      if (v === null) return true
      try {
        new URL(v)
        return v.startsWith('http://') || v.startsWith('https://')
      } catch {
        return false
      }
    }, {
      message: '外部URLは有効なURL（http://またはhttps://）を入力してください'
    })
})

// バリデーション結果の型
export type PlayersRow = z.infer<typeof PlayersRowSchema>

// インポート用のリクエストスキーマ
export const PlayersImportRequestSchema = z.object({
  data: z.array(PlayersRowSchema)
})

export type PlayersImportRequest = z.infer<typeof PlayersImportRequestSchema>

// インポート結果のスキーマ
export const PlayersImportResultSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  successCount: z.number(),
  errorCount: z.number(),
  skipCount: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    reg_no: z.string().optional(),
    name: z.string().optional(),
    message: z.string(),
    field: z.string().optional()
  })),
  duplicates: z.array(z.object({
    row: z.number(),
    reg_no: z.string(),
    existing_name: z.string(),
    new_name: z.string()
  })).optional()
})

export type PlayersImportResult = z.infer<typeof PlayersImportResultSchema>

// CSV行のバリデーション結果
export interface ValidationResult {
  isValid: boolean
  data?: PlayersRow
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * 単一行をバリデーション
 */
export function validatePlayersRow(row: Record<string, string>): ValidationResult {
  try {
    const data = PlayersRowSchema.parse(row)
    return {
      isValid: true,
      data,
      errors: []
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      return {
        isValid: false,
        errors
      }
    }

    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'バリデーションエラーが発生しました'
      }]
    }
  }
}

/**
 * CSV必須ヘッダーの定義
 */
export const REQUIRED_HEADERS = ['reg_no', 'name', 'grade'] as const
export const OPTIONAL_HEADERS = ['name_kana', 'external_url'] as const
export const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const

/**
 * CSVヘッダーの検証
 */
export function validateHeaders(headers: string[]): {
  isValid: boolean
  errors: string[]
  missing: string[]
  extra: string[]
} {
  const errors: string[] = []
  const missing: string[] = []
  const extra: string[] = []

  // 必須ヘッダーのチェック
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      missing.push(required)
      errors.push(`必須列 '${required}' が見つかりません`)
    }
  }

  // 余分なヘッダーのチェック
  for (const header of headers) {
    if (!ALL_HEADERS.includes(header as typeof ALL_HEADERS[number])) {
      extra.push(header)
      errors.push(`不明な列 '${header}' が含まれています`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missing,
    extra
  }
}