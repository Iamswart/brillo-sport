import { Joi } from "celebrate";

export const registerAccountSchema = Joi.object({
  userName: Joi.string().trim().required(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{11,}$/)
    .required()
    .min(7)
    .max(12),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)
    .message(
      '"password" must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const loginSchema = Joi.object().keys({
  email: Joi.string().trim().email().lowercase(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{11,}$/)
    .min(7)
    .max(12),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object().keys({
  oldPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)
    .message(
      '"password" must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)
    .message(
      '"password" must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required(),
});

export const forgotPasswordSchema = Joi.object().keys({
  email: Joi.string().trim().email().lowercase().required(),
});

export const resetPasswordSchema = Joi.object().keys({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)
    .message(
      '"password" must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const verifyEmailSchema = Joi.object().keys({
  token: Joi.string()
    .required()
    .length(6)
    .regex(/^[0-9]+$/)
    .message("Invalid Token"),
});

export const updateProfileSchema = Joi.object().keys({
  gender: Joi.string().valid("Male", "Female", "others"),
  email: Joi.string().trim().email().lowercase(),
  userName: Joi.string().trim(),
});

export const verifyPhoneSchema = Joi.object().keys({
  token: Joi.string()
    .required()
    .length(4)
    .regex(/^[0-9]+$/)
    .message("Invalid Token"),
});

export const sportNameSchema = Joi.object({
  name: Joi.string().trim().required(),
});

export const refreshTokenSchema = Joi.object().keys({
  refreshToken: Joi.string().required(),
});