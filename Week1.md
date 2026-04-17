## Week 1 Goal

This week defines who Mentra serves, what problem it solves, what must be built first, and sets up the initial technical foundation.

## Completed Deliverables

### 1) Business Problem Statement

Mentra helps learners improve assignment quality before final grading by delivering instant AI feedback against organization-specific criteria.

Current workflow pain:
- learners often wait too long for feedback
- they receive limited revision opportunities
- expectations vary by organization and are hard to interpret

Mentra solution:
- users create/import organizations and rubric rules
- users create assignments and select applicable rules
- users submit draft work and receive AI-generated scoring + actionable feedback
- users iterate until they are ready for official submission

### 2) Feature List (4 Required Features)

1. Organization + Rule Management
	 Create or import organizations and define grading standards/rubric rules.

2. Assignment Builder by Organization
	 Recreate class/task assignments and map selected rubric rules to each assignment.

3. AI Evaluation Engine
	 Submit draft work and get score predictions plus criterion-based feedback.

4. Revision Tracking
	 Save submissions over time and track improvement trend before final grading.

### 3) Wireframe (Markdown Layout)

#### Page A: Dashboard (`/`)
- Top nav: Mentra logo | Organizations | Assignments | Progress
- Main section:
	- Quick stats cards: Organizations, Assignments, Avg AI Score
	- Recent activity list
	- CTA buttons: New Organization, New Assignment, New Submission

#### Page B: Organization Detail (`/organizations/[id]`)
- Header: Organization name + description
- Rule table:
	- columns: Rule, Description, Weight, Actions
- Sidebar:
	- Import rules
	- Add rule form

#### Page C: Assignment Builder (`/assignments/new`)
- Form fields: title, instructions, organization selector
- Rule picker: checklist of organization rules
- Save draft assignment button

#### Page D: Submission Review (`/assignments/[id]/submit`)
- Left panel: text area for student draft submission
- Right panel: selected rubric summary
- Submit to AI button
- Result section:
	- predicted score
	- strengths
	- improvements
	- rubric-by-rubric breakdown

#### Page E: Progress History (`/progress`)
- Filters: organization, assignment, date
- Submission timeline list
- Score trend chart placeholder

### 4) Starter Project Running Locally (Next.js)

Starter app scaffolded in `app/` using Next.js + TypeScript.

Run locally:

```bash
cd app
npm run dev
```

Open: `http://localhost:3000`

### 5) Starter Docker Setup

Docker starter files added:
- `docker-compose.yml` (web + postgres services)
- `app/Dockerfile`
- `app/.dockerignore`
- `app/.env` and `app/.env.example`

Start with Docker:

```bash
docker compose up --build
```

### 6) Draft Prisma Schema Plan

Draft schema created at `app/prisma/schema.prisma`.

Core models:
- `Organization`
- `Rule`
- `Assignment`
- `AssignmentRule` (join table)
- `Submission`
- `Feedback`

Relationship highlights:
- Organization has many Rules and Assignments
- Assignment has many Rules through AssignmentRule
- Assignment has many Submissions
- Submission has one Feedback

## Week 1 Exit Ticket (Answered)

### Who is the app for?
Students and learners who want early, rubric-based feedback before final grading; secondarily instructors/program admins who define grading standards.

### What problem does it solve?
It removes long feedback delays and uncertainty by giving immediate, criterion-aligned feedback so users can revise before official submission.

### What are the 4 required features?
1. Organization + rule management
2. Assignment builder with rule selection
3. AI grading + actionable feedback
4. Revision/progress tracking

### What pages will your app need?
1. Dashboard
2. Organization detail/rules page
3. Assignment builder page
4. Submission + AI feedback page
5. Progress history page

### What models will your database need?
Organization, Rule, Assignment, AssignmentRule, Submission, Feedback.

### What will Docker do for your project?
Docker standardizes local setup for app and database, reduces environment mismatch, and makes onboarding/testing reproducible.

## Week 1 Success Check

- [x] I know the business problem
- [x] I know the users
- [x] I know my must-have features
- [x] I drew my app pages
- [x] I started the project
- [x] I planned my database
- [x] I created starter Docker files



Intro Page
The Intro Page provides a clear overview of the platform, explaining its purpose and how it works. It includes rotating user testimonials or reviews to build trust and credibility. An example problem scenario is presented to highlight the core issue the platform solves—delayed feedback and lack of guidance on assignments. Clear call-to-action buttons guide users to the next steps, such as signing up or logging in.

Login Page
Users can securely access their accounts through multiple authentication options:
Google Authentication
Email and Password login
“Forgot Password” (planned for future implementation)
Links to Terms of Service and Privacy Policy

Header Navigation
The header remains consistent across the platform and includes:
Home
Settings
Logout
Notifications (bell icon for alerts and updates)

Home Page
The Home Page acts as the central dashboard for the user. It displays:
A list of all saved organizations
The total number of organizations in the account
A summary of assignments that need review
Buttons to create new organizations
Management options for each organization (edit name, modify rule sets, delete, etc.)

Add Organization Page
This page allows users to create and configure a new organization by:
Entering the organization’s name
Defining a rule set manually (with support for structured inputs like commas, brackets, etc.) or uploading rules
Adding descriptions to each rule for clarity
If no rule set is provided, an AI feature will attempt to generate one by researching the specified organization.
Additionally, users can:
Provide a link, description, or screenshot of the organization’s layout
Allow the AI to recreate a familiar interface and summarize how each section functions
If no layout is provided, a default structure will be used.

Specific Organization Page
Each organization has its own dedicated page that includes:
A list of all assignments associated with that organization
The total number of assignments
A search bar for quick navigation
Clickable assignments for easy access
A “Create Assignment” button to add new tasks and select applicable rules
A deletion tool for removing selected assignments
A progression graph showing average performance over time (updated every 24 hours)

Specific Assignment Page
This page focuses on a single assignment and provides:
Assignment details and selected rules/criteria
Current grade (if available)
File upload options (documents, links, repositories, etc.)
Submission functionality
Once submitted, the AI will:
Analyze the assignment based on the selected rules
Generate a grade
Provide actionable feedback for improvement
Additional features include:
Settings to edit the assignment name and rule set
A progression graph showing improvement over time for that specific assignment

Settings Page
The Settings Page allows users to customize their experience:
Profile: Update name, email, and account details
Appearance: Adjust themes and text size
Notifications: Control what alerts are received
Privacy & Data: Manage data collection preferences
Account Management: Delete organizations or the entire account

Notifications System
The notifications feature includes:
A dropdown menu displaying unread notifications
Alerts related to assignment updates and grades
Optional email reminders triggered by recent submission results

