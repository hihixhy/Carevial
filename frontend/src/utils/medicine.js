export const MEDICINE_TYPE_LABELS = {
  prescription: '处方药',
  otc: '非处方药',
  healthcare: '保健品'
}
export const MEDICINE_TYPE_VALUES = {
  处方药: 'prescription',
  非处方药: 'otc',
  保健品: 'healthcare'
}

export const medicineTypeLabel = (type) => {
  return MEDICINE_TYPE_LABELS[type] || type || ''
}

export const toMedicineType = (label) => {
  return MEDICINE_TYPE_VALUES[label] || label
}
