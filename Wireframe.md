# Mentra Wireframe

This file is a standalone wireframe reference extracted from Week 1 planning.

## Page A: Dashboard (`/`)

### Layout
- Top nav: Mentra logo | Organizations | Assignments | Progress
- Main content:
  - Quick stats cards: Organizations, Assignments, Avg AI Score
  - Recent activity list
  - CTA buttons: New Organization, New Assignment, New Submission

### Wireframe Sketch

```text
+--------------------------------------------------------------+
| Mentra | Organizations | Assignments | Progress              |
+--------------------------------------------------------------+
| [Organizations] [Assignments] [Avg AI Score]                 |
|                                                              |
| Recent Activity                                              |
| - ...                                                        |
| - ...                                                        |
|                                                              |
| [New Organization] [New Assignment] [New Submission]         |
+--------------------------------------------------------------+
```

## Page B: Organization Detail (`/organizations/[id]`)

### Layout
- Header: Organization name + description
- Rule table columns: Rule, Description, Weight, Actions
- Sidebar:
  - Import rules
  - Add rule form

### Wireframe Sketch

```text
+--------------------------------------------------------------+
| Organization Name                                             |
| Description                                                   |
+----------------------------------------+---------------------+
| Rules Table                             | Sidebar             |
| Rule | Description | Weight | Actions   | [Import Rules]      |
| ...                                    | Add Rule Form        |
| ...                                    | [Rule Input]         |
|                                         | [Description Input] |
|                                         | [Weight Input]      |
|                                         | [Add Rule]          |
+----------------------------------------+---------------------+
```

## Page C: Assignment Builder (`/assignments/new`)

### Layout
- Form fields: title, instructions, organization selector
- Rule picker: checklist of organization rules
- Save draft assignment button

### Wireframe Sketch

```text
+--------------------------------------------------------------+
| New Assignment                                                |
+--------------------------------------------------------------+
| Title: [________________________]                             |
| Instructions:                                                 |
| [__________________________________________________________]  |
| Organization: [Select ▼]                                      |
|                                                              |
| Rule Picker                                                   |
| [ ] Rule A                                                    |
| [ ] Rule B                                                    |
| [ ] Rule C                                                    |
|                                                               |
| [Save Draft Assignment]                                       |
+--------------------------------------------------------------+
```

## Page D: Submission Review (`/assignments/[id]/submit`)

### Layout
- Left panel: text area for student draft submission
- Right panel: selected rubric summary
- Submit to AI button
- Results section:
  - predicted score
  - strengths
  - improvements
  - rubric-by-rubric breakdown

### Wireframe Sketch

```text
+--------------------------------------------------------------+
| Submission Review                                             |
+----------------------------------------+---------------------+
| Draft Submission                        | Rubric Summary      |
| [textarea]                              | - Criterion 1       |
|                                         | - Criterion 2       |
|                                         | - Criterion 3       |
+----------------------------------------+---------------------+
| [Submit to AI]                                                |
+--------------------------------------------------------------+
| Predicted Score: 00/100                                       |
| Strengths: ...                                                |
| Improvements: ...                                             |
| Rubric Breakdown: ...                                         |
+--------------------------------------------------------------+
```

## Page E: Progress History (`/progress`)

### Layout
- Filters: organization, assignment, date
- Submission timeline list
- Score trend chart placeholder

### Wireframe Sketch

```text
+--------------------------------------------------------------+
| Progress History                                              |
+--------------------------------------------------------------+
| Filters: [Organization ▼] [Assignment ▼] [Date Range ▼]       |
+--------------------------------------------------------------+
| Timeline                                                      |
| - Submission 1                                                |
| - Submission 2                                                |
| - Submission 3                                                |
+--------------------------------------------------------------+
| Score Trend (Chart Placeholder)                               |
| [---------------------- line chart -------------------------] |
+--------------------------------------------------------------+
```
