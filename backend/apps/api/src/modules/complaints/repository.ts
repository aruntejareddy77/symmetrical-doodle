import { prisma, Complaint, Prisma } from "@vizagops/prisma";

const inMemoryComplaints: Complaint[] = [];

export class ComplaintRepository {
  async create(data: Prisma.ComplaintCreateInput): Promise<Complaint> {
    try {
      const result = await prisma.complaint.create({ data });
      inMemoryComplaints.unshift(result);
      return result;
    } catch (err) {
      console.warn("[Database] Prisma PostgreSQL write failed, storing in memory fallback:", (err as Error).message);
      const fallbackItem: Complaint = {
        id: `CMP-${Date.now()}`,
        citizenId: data.citizenId || null,
        title: data.title,
        description: data.description || null,
        category: data.category || 'INFRASTRUCTURE',
        priority: data.priority || 'MEDIUM',
        severity: data.severity || null,
        status: data.status || 'PENDING',
        ward: data.ward || 'GVMC-W12',
        department: data.department || null,
        latitude: data.latitude ?? 17.6868,
        longitude: data.longitude ?? 83.2185,
        source: data.source || 'WEB_API',
        imageUrls: [],
        estimatedResolutionTime: null,
        resolutionNotes: null,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryComplaints.unshift(fallbackItem);
      return fallbackItem;
    }
  }

  async getAll(): Promise<Complaint[]> {
    try {
      const dbComplaints = await prisma.complaint.findMany({
        orderBy: { createdAt: "desc" }
      });
      return dbComplaints.length > 0 ? dbComplaints : inMemoryComplaints;
    } catch (err) {
      console.warn("[Database] Prisma PostgreSQL read failed, serving in-memory complaints fallback");
      return inMemoryComplaints;
    }
  }

  async findById(id: string): Promise<Complaint | null> {
    try {
      const found = await prisma.complaint.findUnique({ where: { id } });
      if (found) return found;
    } catch (err) { /* fallback */ }
    return inMemoryComplaints.find(c => c.id === id) || null;
  }

  async findByCitizenId(citizenId: string): Promise<Complaint[]> {
    try {
      const dbComplaints = await prisma.complaint.findMany({
        where: { citizenId },
        orderBy: { createdAt: "desc" }
      });
      if (dbComplaints.length > 0) return dbComplaints;
    } catch (err) { /* fallback */ }
    return inMemoryComplaints.filter(c => c.citizenId === citizenId);
  }

  async updateStatus(id: string, status: string): Promise<Complaint | null> {
    try {
      const updated = await prisma.complaint.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });
      const inMemIdx = inMemoryComplaints.findIndex(c => c.id === id);
      if (inMemIdx !== -1) {
        inMemoryComplaints[inMemIdx].status = status;
      }
      return updated;
    } catch {
      const inMem = inMemoryComplaints.find(c => c.id === id);
      if (inMem) {
        inMem.status = status;
        return inMem;
      }
      return null;
    }
  }
}
