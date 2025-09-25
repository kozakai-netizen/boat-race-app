declare global {
  interface Window {
    gtag: (
      command: string,
      event: string,
      parameters?: {
        duration?: number
        target?: number
        within_target?: boolean
        race_id?: string
        [key: string]: string | number | boolean | undefined
      }
    ) => void
  }
}

export {}