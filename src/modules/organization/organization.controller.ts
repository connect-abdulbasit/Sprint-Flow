import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "./organization.service";
import { getCurrentUser } from "@/lib/auth";

export class OrganizationController {
  async create(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const name = String(body.name ?? "").trim();

      const workspaceData = body.workspaceName
        ? {
            name: String(body.workspaceName).trim(),
            slug: String(
              body.workspaceSlug || body.workspaceName.toLowerCase().replace(/\s+/g, "-")
            ).trim(),
            description: body.workspaceDescription
              ? String(body.workspaceDescription).trim()
              : undefined,
          }
        : undefined;

      if (!name) {
        return NextResponse.json({ error: "Organization name required" }, { status: 400 });
      }

      const result = await organizationService.createOrganization(user.id, name, workspaceData);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Create organization error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to create organization" },
        { status: 500 }
      );
    }
  }

  async list(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const organizations = await organizationService.getUserOrganizations(user.id);
      return NextResponse.json(organizations);
    } catch (error) {
      console.error("Fetch organizations error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch organizations" },
        { status: 500 }
      );
    }
  }

  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const organization = await organizationService.getOrganizationById(user.id, id);
      return NextResponse.json(organization);
    } catch (error) {
      console.error("Fetch organization by id error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch organization" },
        { status: 500 }
      );
    }
  }

  async getDashboard(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const dashboard = await organizationService.getOrganizationDashboard(user.id, id);
      return NextResponse.json(dashboard);
    } catch (error) {
      console.error("Fetch organization dashboard error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch organization dashboard" },
        { status: 500 }
      );
    }
  }

  async sendInvite(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const organizationId = String(body.organizationId ?? "").trim();
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      const role = String(body.role ?? "").trim() as "member" | "admin" | "owner";

      if (!organizationId || !email || !role) {
        return NextResponse.json(
          { error: "organizationId, email, and role required" },
          { status: 400 }
        );
      }

      const invite = await organizationService.sendInvite(user.id, { organizationId, email, role });
      return NextResponse.json(invite);
    } catch (error) {
      console.error("Create invite error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to create invite" },
        { status: 500 }
      );
    }
  }

  async acceptInvite(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const token = String(body.token ?? "").trim();

      if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }

      const result = await organizationService.acceptInvite(user.id, token);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Accept invite error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to accept invite" },
        { status: 500 }
      );
    }
  }

  async update(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await organizationService.updateOrganization(user.id, id, body);
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Update organization error:", error);
      const message = (error as Error)?.message ?? "Failed to update organization";
      const status = message.includes("Forbidden") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = await params;
      const result = await organizationService.deleteOrganization(user.id, id);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Delete organization error:", error);
      const message = (error as Error)?.message ?? "Failed to delete organization";
      const status = message.includes("Forbidden") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }
}

export const organizationController = new OrganizationController();
