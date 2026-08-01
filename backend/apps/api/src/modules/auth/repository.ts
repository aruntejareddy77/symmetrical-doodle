import { prisma, User, Prisma } from "@vizagops/prisma";
import bcrypt from "bcryptjs";

// Pre-hashed default password 'password123'
const DEFAULT_HASH = bcrypt.hashSync("password123", 10);

const inMemoryUsers: User[] = [
  {
    id: "USR-CITIZEN-01",
    email: "citizen@gmail.com",
    name: "Visakhapatnam Citizen",
    passwordHash: DEFAULT_HASH,
    role: "CITIZEN",
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "USR-ADMIN-01",
    email: "admin@gvmc.gov.in",
    name: "GVMC Admin",
    passwordHash: DEFAULT_HASH,
    role: "ADMIN",
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "USR-ADMIN-02",
    email: "admin@vizagops.gov.in",
    name: "VizagOps Admin",
    passwordHash: DEFAULT_HASH,
    role: "ADMIN",
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "USR-OPERATOR-01",
    email: "operator@gvmc.gov.in",
    name: "Dispatch Operator",
    passwordHash: DEFAULT_HASH,
    role: "DISPATCHER",
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
      if (user) return user;
    } catch (err) {
      console.warn("[UserRepository] Prisma DB connection unavailable. Using in-memory fallback user store.");
    }
    return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const newUser = await prisma.user.create({ data });
      inMemoryUsers.push(newUser);
      return newUser;
    } catch (err) {
      console.warn("[UserRepository] Prisma DB write failed. Storing user in-memory fallback.");
      const fallbackUser: User = {
        id: `USR-${Date.now()}`,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: (data.role as any) || "CITIZEN",
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryUsers.push(fallbackUser);
      return fallbackUser;
    }
  }
}
