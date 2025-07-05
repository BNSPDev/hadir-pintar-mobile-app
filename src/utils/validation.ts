/**
 * Data validation utilities for the application
 */

import { z } from "zod";

// Email validation schema
export const emailSchema = z
  .string()
  .email("Format email tidak valid")
  .min(1, "Email wajib diisi");

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, "Password minimal 6 karakter")
  .max(100, "Password maksimal 100 karakter");

// Profile validation schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s]*$/, "Nama hanya boleh mengandung huruf dan spasi"),
  position: z
    .string()
    .min(2, "Jabatan minimal 2 karakter")
    .max(50, "Jabatan maksimal 50 karakter"),
  department: z.enum(
    [
      "Sekretariat",
      "Akreditasi LSP",
      "Sertifikasi",
      "Pengembangan",
      "Hukum",
      "Umum",
    ],
    {
      errorMap: () => ({ message: "Pilih departemen yang valid" }),
    },
  ),
  employee_id: z
    .string()
    .min(3, "NIP minimal 3 karakter")
    .max(20, "NIP maksimal 20 karakter")
    .regex(
      /^[A-Z0-9-]*$/,
      "NIP hanya boleh mengandung huruf besar, angka, dan tanda strip",
    ),
});

// Daily report validation schema
export const dailyReportSchema = z
  .string()
  .min(10, "Laporan kegiatan minimal 10 karakter")
  .max(1000, "Laporan kegiatan maksimal 1000 karakter")
  .trim();

// Work type validation
export const workTypeSchema = z.enum(["WFO", "DL", "Cuti", "Sakit"], {
  errorMap: () => ({ message: "Pilih tipe kerja yang valid" }),
});

/**
 * Validates email format
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Format email tidak valid" };
  }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    passwordSchema.parse(password);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Password tidak valid" };
  }
}

/**
 * Validates profile data
 */
export function validateProfile(data: any): {
  isValid: boolean;
  errors?: Record<string, string>;
} {
  try {
    profileSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: "Data profil tidak valid" } };
  }
}

/**
 * Validates daily report
 */
export function validateDailyReport(report: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    dailyReportSchema.parse(report);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Laporan kegiatan tidak valid" };
  }
}

/**
 * Validates work type
 */
export function validateWorkType(type: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    workTypeSchema.parse(type);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Tipe kerja tidak valid" };
  }
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validates file uploads
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {},
): { isValid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = ["image/jpeg", "image/png", "application/pdf"],
  } = options;

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Ukuran file maksimal ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Tipe file tidak didukung" };
  }

  return { isValid: true };
}
