import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@vizagops/config";
import { UserRepository } from "./repository";
import axios from "axios";

export class AuthService {
  constructor(private repo: UserRepository = new UserRepository()) {}

  async register(payload: any, telemetry: any) {
    const existing = await this.repo.findByEmail(payload.email);
    if (existing) {
      const err: any = new Error("Email already registered");
      err.code = "EMAIL_ALREADY_REGISTERED";
      err.status = 400;
      throw err;
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.repo.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role || "CITIZEN"
    });
    try {
      await axios.post(`${config.AUDIT_SERVICE_URL}/log`, {
        entity: "User",
        entityId: user.id,
        action: "REGISTER",
        performedBy: user.email,
        metadata: { name: user.name, role: user.role }
      }, { headers: { "x-request-id": telemetry.requestId } });
    } catch (auditErr) {
      console.error("Failed to write audit event for user register");
    }
    return user;
  }

  async login(payload: any, telemetry: any) {
    const user = await this.repo.findByEmail(payload.email);
    if (!user || !user.isActive) {
      const err: any = new Error("Invalid credentials or inactive user");
      err.code = "INVALID_CREDENTIALS";
      err.status = 401;
      throw err;
    }
    const isMatch = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error("Invalid credentials");
      err.code = "INVALID_CREDENTIALS";
      err.status = 401;
      throw err;
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );
    try {
      await axios.post(`${config.AUDIT_SERVICE_URL}/log`, {
        entity: "User",
        entityId: user.id,
        action: "LOGIN",
        performedBy: user.email,
        metadata: { role: user.role }
      }, { headers: { "x-request-id": telemetry.requestId } });
    } catch (auditErr) {
      console.error("Failed to write audit event for user login");
    }
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async googleLogin(payload: { email?: string; name?: string }, telemetry: any) {
    const email = payload.email || "citizen.google@gmail.com";
    const name = payload.name || "Visakhapatnam Citizen";

    let user = await this.repo.findByEmail(email);

    if (!user) {
      const passwordHash = await bcrypt.hash("google-auth-pass-" + Date.now(), 10);
      user = await this.repo.create({
        name,
        email,
        passwordHash,
        role: "CITIZEN",
      });
      console.log(`[AuthService] Created new Google Citizen user in DB: ${email}`);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    try {
      await axios.post(`${config.AUDIT_SERVICE_URL}/log`, {
        entity: "User",
        entityId: user.id,
        action: "GOOGLE_LOGIN",
        performedBy: user.email,
        metadata: { role: user.role, authProvider: "google" }
      }, { headers: { "x-request-id": telemetry.requestId || "req-google-auth" } });
    } catch (auditErr) {
      console.error("Failed to write audit event for google login");
    }

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
