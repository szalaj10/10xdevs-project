import { useCallback } from "react";

export function useAuthValidation() {
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Hasło musi mieć co najmniej 8 znaków");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const validatePasswordMatch = useCallback((password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  }, []);

  return {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
  };
}
