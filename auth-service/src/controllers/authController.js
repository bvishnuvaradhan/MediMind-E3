import { AuthService } from "../services/authService.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, role, referenceId, family_member_ids } = req.body;
    const result = await AuthService.register({
      email,
      password,
      role,
      referenceId,
      family_member_ids,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const profile = await AuthService.getMe(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
