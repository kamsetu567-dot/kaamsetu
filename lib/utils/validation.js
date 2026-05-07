export function validateName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'नाम जरूरी है / Name is required';
  }
  if (name.trim().length < 2) {
    return 'नाम कम से कम 2 अक्षर का हो / Name must be at least 2 characters';
  }
  if (name.trim().length > 50) {
    return 'नाम बहुत लंबा है / Name is too long';
  }
  return null;
}

export function validateMobile(mobile) {
  if (!mobile) return 'मोबाइल नंबर जरूरी है / Mobile number is required';
  const cleaned = mobile.toString().replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return '10 अंकों का मोबाइल नंबर डालें / Enter 10 digit mobile number';
  }
  if (!/^[6-9]/.test(cleaned)) {
    return 'मोबाइल नंबर 6-9 से शुरू होना चाहिए / Mobile must start with 6-9';
  }
  return null;
}

export function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} जरूरी है / ${fieldName} is required`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `कम से कम एक ${fieldName} चुनें / Select at least one ${fieldName}`;
  }
  return null;
}

export function validateNumber(value, fieldName, { min = 0, max = Infinity } = {}) {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} जरूरी है / ${fieldName} is required`;
  }
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} number होना चाहिए / ${fieldName} must be a number`;
  if (num < min) return `${fieldName} कम से कम ${min} होना चाहिए / ${fieldName} must be at least ${min}`;
  if (num > max) return `${fieldName} ज़्यादा से ज़्यादा ${max} हो सकता है / ${fieldName} cannot exceed ${max}`;
  return null;
}

export function validateForm(values, schema) {
  const errors = {};
  for (const [field, validator] of Object.entries(schema)) {
    const err = validator(values[field]);
    if (err) errors[field] = err;
  }
  return Object.keys(errors).length === 0 ? null : errors;
}
