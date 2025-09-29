import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

/**
 * キャッシュ再検証API（管理画面用）
 * GET /api/revalidate?tag=results:YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    if (!tag) {
      return NextResponse.json(
        { error: 'tag parameter is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Revalidating cache tag: ${tag}`)

    // キャッシュタグを再検証
    revalidateTag(tag)

    // APIクールダウンもクリア
    if (global.__apiCooldown && tag.startsWith('results:')) {
      const date = tag.replace('results:', '')
      const cooldownKeys = Object.keys(global.__apiCooldown).filter(key =>
        key.includes(date)
      )

      cooldownKeys.forEach(key => {
        delete global.__apiCooldown![key]
      })

      console.log(`🧹 Cleared cooldown for ${cooldownKeys.length} keys`)
    }

    return NextResponse.json({
      success: true,
      tag,
      message: `Cache revalidated for tag: ${tag}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Revalidation failed:', error)
    return NextResponse.json(
      {
        error: 'Revalidation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}