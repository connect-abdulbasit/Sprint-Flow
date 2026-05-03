import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "./organization.service";
import { getCurrentUser } from "@/lib/auth";
import { parsePaginationParams, paginateArray } from "@/lib/pagination";

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
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      return NextResponse.json(paginateArray(organizations, pagination));
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
