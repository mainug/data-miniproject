import { useState, useCallback, useRef } from 'react'
import { fetchCommentary, type AiCommentaryPayload } from '../api/ai'

export function useOnDemandAi(payload: AiCommentaryPayload | null) {
  const [commentary, setCommentary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inflightRef = useRef(false)

  const trigger = useCallback(() => {
    if (!payload || inflightRef.current) return
    inflightRef.current = true
    setOpen(true)
    setCommentary(null)
    setLoading(true)
    fetchCommentary(payload)
      .then((text) => setCommentary(text))
      .catch(() => setCommentary(null))
      .finally(() => {
        inflightRef.current = false
        setLoading(false)
      })
  }, [payload])

  const close = useCallback(() => {
    setOpen(false)
    setCommentary(null)
  }, [])

  return { open, commentary, loading, trigger, close }
}
