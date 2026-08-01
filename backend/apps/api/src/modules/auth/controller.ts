import { sendSuccess } from "@vizagops/api";
import { AuthService } from "./service";

const service = new AuthService();

export const register = async (req: any, res: any, next: any) => {
  try {
    const user = await service.register(req.validatedBody, { requestId: req.requestId });
    const sanitised = { id: user.id, name: user.name, email: user.email, role: user.role };
    sendSuccess(res, sanitised, "Registration successful");
  } catch (err) { next(err); }
};

export const login = async (req: any, res: any, next: any) => {
  try {
    const result = await service.login(req.validatedBody, { requestId: req.requestId });
    sendSuccess(res, result, "Login successful");
  } catch (err) { next(err); }
};

export const me = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const sanitised = { id: user.id, name: user.name, email: user.email, role: user.role };
    sendSuccess(res, sanitised, "Current user retrieved");
  } catch (err) { next(err); }
};

export const googleLogin = async (req: any, res: any, next: any) => {
  try {
    const result = await service.googleLogin(req.body || {}, { requestId: req.requestId });
    sendSuccess(res, result, "Google login successful");
  } catch (err) { next(err); }
};
