export const MEDICINE_TYPE_LABELS = {
  prescription: '处方药',
  otc: '非处方药',
  healthcare: '保健品'
}

export const medicineTypeLabel = (type) => {
  return MEDICINE_TYPE_LABELS[type] || type || ''
}
