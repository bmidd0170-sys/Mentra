Summary: 
You’re building a web application that helps users improve their work before it’s officially graded by providing instant, AI-powered feedback based on structured criteria.

At its core, the platform allows users to create or import “organizations,” each with its own set of rules, standards, or grading criteria. Users can then recreate assignments within those organizations, select the relevant rules, and submit their work. The AI evaluates the submission against those criteria, generates a grade, and provides detailed, actionable feedback on how to improve.

The goal of the app is to eliminate the long wait for feedback and reduce uncertainty by giving users immediate insight into their performance. Instead of receiving a final grade with no chance to revise, users can iteratively improve their work, track their progress over time, and better understand expectations turning grading into a continuous learning process rather than a one-time evaluation.

Project Features

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

