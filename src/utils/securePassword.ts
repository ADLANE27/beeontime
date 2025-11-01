/**
 * Password security utilities
 * Provides secure password generation and validation
 */

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Generates a cryptographically secure random password
 * @param length - Desired password length (default: 16)
 * @returns A secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  // Ensure length is within acceptable bounds
  const finalLength = Math.max(PASSWORD_MIN_LENGTH, Math.min(length, PASSWORD_MAX_LENGTH));
  
  const charset = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?'
  };

  // Use crypto.getRandomValues for cryptographically secure randomness
  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const getRandomChar = (chars: string): string => {
    return chars[getRandomInt(chars.length)];
  };

  let password = '';
  
  // Ensure at least one character from each category
  password += getRandomChar(charset.uppercase);
  password += getRandomChar(charset.lowercase);
  password += getRandomChar(charset.numbers);
  password += getRandomChar(charset.symbols);

  // Fill the rest with random characters from all categories
  const allChars = Object.values(charset).join('');
  for (let i = password.length; i < finalLength; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password using Fisher-Yates algorithm with secure randomness
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object containing validation result and error message
 */
export const validatePasswordStrength = (password: string): { 
  valid: boolean; 
  message?: string;
} => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      message: `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères`
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password);

  if (!hasUppercase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une majuscule'
    };
  }

  if (!hasLowercase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une minuscule'
    };
  }

  if (!hasNumber) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre'
    };
  }

  if (!hasSymbol) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial'
    };
  }

  return { valid: true };
};
