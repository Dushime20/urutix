import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom Validators for Governance Module
 * 
 * Provides specialized validation for governance-specific fields.
 */

/**
 * IsValidSeverity
 * 
 * Validates that severity level is appropriate for the violation category.
 */
@ValidatorConstraint({ name: 'isValidSeverity', async: false })
export class IsValidSeverityConstraint implements ValidatorConstraintInterface {
  validate(severity: string, args: ValidationArguments) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Severity must be one of: low, medium, high, critical';
  }
}

export function IsValidSeverity(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSeverityConstraint,
    });
  };
}

/**
 * IsValidDuration
 * 
 * Validates that suspension duration is within acceptable limits.
 * Maximum: 365 days (1 year)
 */
@ValidatorConstraint({ name: 'isValidDuration', async: false })
export class IsValidDurationConstraint implements ValidatorConstraintInterface {
  validate(expiresAt: Date, args: ValidationArguments) {
    if (!expiresAt) return true; // Optional field

    const now = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // 1 year from now

    const expirationDate = new Date(expiresAt);

    // Must be in the future
    if (expirationDate <= now) {
      return false;
    }

    // Must not exceed 1 year
    if (expirationDate > maxDate) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Expiration date must be in the future and not exceed 1 year';
  }
}

export function IsValidDuration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDurationConstraint,
    });
  };
}

/**
 * IsValidEmail
 * 
 * Enhanced email validation with additional checks.
 */
@ValidatorConstraint({ name: 'isValidEmail', async: false })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) return true; // Optional field

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for common disposable email domains
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid email address or disposable email domain';
  }
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailConstraint,
    });
  };
}

/**
 * IsValidPhoneNumber
 * 
 * Validates phone number format (international format).
 */
@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments) {
    if (!phone) return true; // Optional field

    // International phone number format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phone number must be in international format (e.g., +1234567890)';
  }
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}

/**
 * IsValidReason
 * 
 * Validates that reason text is meaningful and not just placeholder text.
 */
@ValidatorConstraint({ name: 'isValidReason', async: false })
export class IsValidReasonConstraint implements ValidatorConstraintInterface {
  validate(reason: string, args: ValidationArguments) {
    if (!reason) return false;

    // Check minimum length
    if (reason.length < 20) {
      return false;
    }

    // Check for placeholder text
    const placeholders = [
      'test',
      'testing',
      'lorem ipsum',
      'asdf',
      'qwerty',
      'placeholder',
    ];

    const lowerReason = reason.toLowerCase();
    for (const placeholder of placeholders) {
      if (lowerReason.includes(placeholder)) {
        return false;
      }
    }

    // Check for meaningful content (at least 3 words)
    const words = reason.trim().split(/\s+/);
    if (words.length < 3) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Reason must be meaningful and contain at least 3 words (minimum 20 characters)';
  }
}

export function IsValidReason(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidReasonConstraint,
    });
  };
}

/**
 * IsValidEvidence
 * 
 * Validates that evidence object contains meaningful data.
 */
@ValidatorConstraint({ name: 'isValidEvidence', async: false })
export class IsValidEvidenceConstraint implements ValidatorConstraintInterface {
  validate(evidence: any, args: ValidationArguments) {
    if (!evidence) return true; // Optional field

    // Must be an object
    if (typeof evidence !== 'object' || Array.isArray(evidence)) {
      return false;
    }

    // Must have at least one property
    const keys = Object.keys(evidence);
    if (keys.length === 0) {
      return false;
    }

    // Check that values are not empty
    for (const key of keys) {
      const value = evidence[key];
      if (value === null || value === undefined || value === '') {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Evidence must be a non-empty object with meaningful data';
  }
}

export function IsValidEvidence(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEvidenceConstraint,
    });
  };
}

/**
 * IsValidIdentifier
 * 
 * Validates identifier based on its type.
 */
@ValidatorConstraint({ name: 'isValidIdentifier', async: false })
export class IsValidIdentifierConstraint implements ValidatorConstraintInterface {
  validate(identifier: string, args: ValidationArguments) {
    if (!identifier) return false;

    const object = args.object as any;
    const identifierType = object.identifierType;

    switch (identifierType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      case 'email_domain':
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(identifier);
      case 'phone':
        return /^\+[1-9]\d{1,14}$/.test(identifier);
      case 'ip_address':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(identifier) || /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(identifier);
      case 'device_fingerprint':
        return identifier.length >= 32; // Minimum length for fingerprint
      case 'company':
      case 'tax_id':
        return identifier.length >= 3; // Minimum length
      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const identifierType = object.identifierType;
    return `Invalid ${identifierType} format`;
  }
}

export function IsValidIdentifier(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIdentifierConstraint,
    });
  };
}
