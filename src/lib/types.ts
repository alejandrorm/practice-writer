export interface CorrectionItem {
  id: string
  originalText: string
  correctedText: string
  correctionType: string
  explanation: string | null
  wasAccepted: boolean | null
  createdAt: string
}
