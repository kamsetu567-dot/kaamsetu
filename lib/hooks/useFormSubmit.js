'use client';
import { useState, useRef } from 'react';

export default function useFormSubmit({ onSubmit, onSuccess, onError } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const submittingRef = useRef(false);

  async function submit(data) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await onSubmit(data);
      setSuccess(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const userMessage = translateError(err);
      setError(userMessage);
      onError?.(userMessage, err);
      throw err;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function reset() {
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
    submittingRef.current = false;
  }

  return { submit, isSubmitting, error, success, reset };
}

function translateError(err) {
  const msg = err?.message || '';

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'इंटरनेट कनेक्शन चेक करें / Please check your internet connection';
  }
  if (msg.includes('timed out') || msg.includes('AbortError')) {
    return 'Request timeout हो गया। फिर try करें / Request timed out. Please try again';
  }

  const errorMap = {
    'Mobile number already registered': 'यह नंबर पहले से registered है / This number is already registered',
    'OTP verification required before signup': 'पहले मोबाइल verify करें / Please verify your mobile first',
    'Invalid or expired OTP': 'OTP गलत या expire हो गया / OTP is wrong or expired',
    'Worker not found': 'Worker नहीं मिला / Worker not found',
    'Job already taken': 'यह job पहले ले ली गई / This job has already been taken',
    'Unauthorized': 'पहले login करें / Please login first',
    'Server error': 'कुछ गड़बड़ हुई। फिर try करें / Something went wrong. Please try again',
    'mobile and name are required': 'नाम और मोबाइल जरूरी है / Name and mobile are required',
    'Registration updated successfully': null, // not an error
  };

  return errorMap[msg] ?? msg ?? 'कुछ गड़बड़ हुई। फिर try करें / Something went wrong. Please try again';
}
