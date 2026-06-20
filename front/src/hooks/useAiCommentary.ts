import { useState, useEffect, useRef } from 'react'
import { fetchCommentary, type AiCommentaryPayload } from '../api/ai'

export function useAiCommentary(payload: AiCommentaryPayload | null) {
  const [commentary, setCommentary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const prevKeyRef = useRef<string>('')

  const payloadKey = payload ? JSON.stringify(payload) : null

  useEffect(() => {
    if (!payloadKey) return
    if (payloadKey === prevKeyRef.current) return
    prevKeyRef.current = payloadKey

    let cancelled = false
    setCommentary(null)
    setLoading(true)

    fetchCommentary(payload!)
      .then((text) => { if (!cancelled) setCommentary(text) })
      .catch(() => { /* 실패 시 카드 숨김 */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [payloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { commentary, loading }
}
