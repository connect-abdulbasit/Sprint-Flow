export interface Member {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: "active" | "on_hold" | "archived";
  progress: number;
}

export interface Ticket {
  id: string;
  key: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  type: "task" | "bug" | "feature" | "improvement";
  storyPoints?: number;
  assignee?: Member;
}

export interface Sprint {
  id: string;
  name: string;
  status: "active" | "planning" | "completed";
  startDate?: string;
  endDate?: string;
  tickets: Ticket[];
}

export const MOCK_MEMBERS: Member[] = [
  { id: "m1", name: "Abdul Basit", initials: "AB", role: "owner" },
  { id: "m2", name: "John Doe", initials: "JD", role: "admin" },
  { id: "m3", name: "Sarah Smith", initials: "SS", role: "member" },
  { id: "m4", name: "Michael King", initials: "MK", role: "viewer" },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    key: "SF",
    name: "Sprint-Flow Core",
    description: "Main workspace for developing the Sprint-Flow platform architecture and UI.",
    icon: "LayoutDashboard",
    color: "#6366f1",
    status: "active",
    progress: 72,
  },
  {
    id: "p2",
    key: "MB",
    name: "Mobile App Implementation",
    description: "Developing the cross-platform mobile experience using React Native.",
    icon: "Smartphone",
    color: "#10b981",
    status: "active",
    progress: 35,
  },
  {
    id: "p3",
    key: "DS",
    name: "Design System Revamp",
    description: "Updating the HSL tokens and component library for the next major version.",
    icon: "Palette",
    color: "#ec4899",
    status: "on_hold",
    progress: 90,
  },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "1",
    key: "SF-1",
    title: "Implement consistent multi-tenant sidebar",
    status: "in_progress",
    priority: "high",
    type: "feature",
    storyPoints: 5,
    assignee: MOCK_MEMBERS[0],
  },
  {
    id: "2",
    key: "SF-2",
    title: "Fix workspace switcher flickering on hover",
    status: "todo",
    priority: "medium",
    type: "bug",
    storyPoints: 2,
  },
  {
    id: "3",
    key: "SF-3",
    title: "Design system: update HSL tokens for dark mode",
    status: "done",
    priority: "low",
    type: "improvement",
    storyPoints: 3,
    assignee: MOCK_MEMBERS[0],
  },
  {
    id: "4",
    key: "SF-4",
    title: "Add framer-motion transitions to page routes",
    status: "todo",
    priority: "medium",
    type: "feature",
    storyPoints: 8,
  },
  {
    id: "5",
    key: "SF-5",
    title: "Project Backlog: Add collapsible sprint sections",
    status: "in_progress",
    priority: "urgent",
    type: "feature",
    storyPoints: 13,
    assignee: MOCK_MEMBERS[0],
  },
];

export const MOCK_SPRINTS: Sprint[] = [
  {
    id: "s1",
    name: "Sprint 1: Core Layout",
    status: "active",
    startDate: "2024-04-01",
    endDate: "2024-04-14",
    tickets: [MOCK_TICKETS[0], MOCK_TICKETS[4]],
  },
  {
    id: "s2",
    name: "Sprint 2: Interaction Polish",
    status: "planning",
    startDate: "2024-04-15",
    endDate: "2024-04-28",
    tickets: [MOCK_TICKETS[1], MOCK_TICKETS[3]],
  },
];

export const MOCK_BACKLOG: Ticket[] = [
  {
    id: "b1",
    key: "SF-6",
    title: "Integrate rich text editor for ticket descriptions",
    status: "todo",
    priority: "medium",
    type: "improvement",
    storyPoints: 5,
  },
  {
    id: "b2",
    key: "SF-7",
    title: "Member invites: email validation logic",
    status: "todo",
    priority: "low",
    type: "task",
    storyPoints: 2,
  },
];
