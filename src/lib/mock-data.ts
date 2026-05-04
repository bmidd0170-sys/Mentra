export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  gradingSystem?: string
  rules: string[]
  assignmentCount: number
  createdAt: string
}

export interface Assignment {
  id: string
  name: string
  organizationId: string
  organizationName: string
  rules: string[]
  status: "pending" | "reviewed" | "submitted"
  grade?: string
  feedback?: string[]
  createdAt: string
  updatedAt: string
}

export const mockUser: User = {
  id: "1",
  name: "Jordan Smith",
  email: "jordan.smith@university.edu",
}

export const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "CS 301 - Data Structures",
    description: "Advanced data structures and algorithms course",
    gradingSystem: "Letter Grade (A-F)",
    rules: [
      "Code must be properly commented",
      "Time complexity analysis required",
      "Include test cases",
      "Follow naming conventions",
    ],
    assignmentCount: 5,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "ENG 201 - Technical Writing",
    description: "Technical and professional writing skills",
    gradingSystem: "Percentage (0-100)",
    rules: [
      "Clear thesis statement",
      "Proper citations (APA format)",
      "Logical paragraph structure",
      "Grammar and spelling",
    ],
    assignmentCount: 3,
    createdAt: "2026-02-01",
  },
  {
    id: "3",
    name: "BUS 401 - Business Strategy",
    description: "Strategic management and business planning",
    gradingSystem: "GPA (4.0 Scale)",
    rules: [
      "Executive summary required",
      "SWOT analysis included",
      "Financial projections",
      "Market research citations",
    ],
    assignmentCount: 2,
    createdAt: "2026-02-20",
  },
]

export const mockAssignments: Assignment[] = [
  {
    id: "1",
    name: "Binary Search Tree Implementation",
    organizationId: "1",
    organizationName: "CS 301 - Data Structures",
    rules: ["Code must be properly commented", "Time complexity analysis required", "Include test cases"],
    status: "reviewed",
    grade: "A-",
    feedback: [
      "Excellent implementation of core BST operations",
      "Consider adding more edge case handling",
      "Time complexity analysis was thorough",
      "Could improve code documentation in helper functions",
    ],
    createdAt: "2026-03-01",
    updatedAt: "2026-03-02",
  },
  {
    id: "2",
    name: "Technical Report Draft",
    organizationId: "2",
    organizationName: "ENG 201 - Technical Writing",
    rules: ["Clear thesis statement", "Proper citations (APA format)", "Logical paragraph structure"],
    status: "pending",
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "3",
    name: "Graph Algorithms Project",
    organizationId: "1",
    organizationName: "CS 301 - Data Structures",
    rules: ["Code must be properly commented", "Time complexity analysis required", "Include test cases", "Follow naming conventions"],
    status: "submitted",
    createdAt: "2026-03-15",
    updatedAt: "2026-03-15",
  },
  {
    id: "4",
    name: "Market Analysis Report",
    organizationId: "3",
    organizationName: "BUS 401 - Business Strategy",
    rules: ["Executive summary required", "SWOT analysis included", "Market research citations"],
    status: "reviewed",
    grade: "B+",
    feedback: [
      "Good market research and data collection",
      "SWOT analysis needs more depth in opportunities section",
      "Executive summary is well-written",
      "Consider adding competitor analysis",
    ],
    createdAt: "2026-03-05",
    updatedAt: "2026-03-07",
  },
]


