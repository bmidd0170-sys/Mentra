# Week 2 Execution

This document tracks Week 2 implementation status and acceptance checks.

## Must-Have vs Nice-to-Have Features

### Must-Have (Required This Week)
1. Login page with working test-credential flow
2. Dashboard page with organization and assignment visibility
3. AI review placeholder behavior for assignment submissions
4. User journey draft covering first-time and repeat usage
5. Clean folder structure with route responsibilities clarified
6. Week 2 status evidence captured in this file

### Nice-to-Have (Not Required)
1. Full backend persistence for organizations and assignments
2. Real AI grading integration (replace placeholders)
3. Email reminder automation for notifications
4. Advanced analytics visualizations with real data
5. Role-based access controls for instructors/admins

## User Journey Draft

1. User opens landing page and understands the value proposition.
2. User selects login and signs in with Google, Firebase email/password, or demo credentials.
3. User lands on dashboard and sees organizations plus assignments that need review.
4. User opens an organization and creates or edits assignment criteria.
5. User submits assignment content by upload, link, or text.
6. AI placeholder returns grade estimate plus actionable feedback.
7. User revises and resubmits to improve score trend over time.
8. User checks profile/settings and notifications, then logs out.

## Week 2 Acceptance Coverage

- [x] Must-have vs nice-to-have feature list is documented
- [x] User journey draft is documented
- [x] Login page supports required demo credentials
- [x] Dashboard page is implemented
- [x] AI placeholder review experience is implemented
- [x] Folder structure is organized by route purpose

## Clean Folder Structure Notes

- Primary authenticated area is grouped under `app/src/app/dashboard/*`.
- Public and entry routes remain under `app/src/app/*` (landing + login + redirect routes).
- Reusable UI components are centralized under `app/src/components/ui/*`.
- Shared data/utilities are centralized under `app/src/lib/*`.
- Demo auth helpers are isolated in `app/src/lib/demo-auth.ts`.

## Week 2 Demo Login Requirement

- Email: rob@launchpadphilly.org
- Password: password123
- Expected result: user is routed to `/dashboard` with a demo session.
