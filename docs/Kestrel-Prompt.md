# KESTREL — COMPLETE FRONTEND DEVELOPMENT MASTER PROMPT

## Project references

GitHub: https://github.com/Ashwinnethan64-maker/kestrel

Website / Live Reference: https://ai-cios-60073452908.development.catalystserverless.in/ (Note: The website is not yet done; the platform name is Kestrel, not AI-CIOS)

## Objective

Rebuild the complete Kestrel frontend using the GitHub repository (https://github.com/Ashwinnethan64-maker/kestrel), local codebase, and reference specifications.

Build the complete frontend NOW, including:
- All verified pages and routes.
- Fully implemented reusable components.
- Complete page layouts and navigation.
- UI design, styling, and responsive layouts.
- Animations and interactive states where appropriate.
- Forms, tables, filters, dialogs, charts, and other actual application features.
- State management, data flow, API integration, and frontend logic.
- Loading, empty, success, and error states.

The main architectural requirement is that the entire project must be organized into clean, modular folders and files so that we can customize individual pages, components, styles, and animations later without rewriting the application.

**Do not postpone UI design or animations. Implement them now, but make them easy to modify later.**

## 1. Inspect the existing project

Before writing code:
1. Inspect the repository, source files, package.json, README, dependencies, and configurations.
2. Identify the existing framework, routing, styling system, UI libraries, state management, API services, and data models.
3. Inspect the deployed application, including the dashboard, sidebar, navigation, and accessible feature pages.
4. Identify the actual modules, pages, workflows, and components.
5. Reuse existing working code and integrations wherever possible.

Do not claim to have inspected anything that is inaccessible. If the live application cannot be opened, use available source files and request screenshots only when necessary.

Do not invent application features based on generic dashboard conventions.

## 2. Establish a modular folder structure

Adapt the following structure to the existing project rather than blindly replacing its architecture.

```text
src/
  app/
    App
    routes
    providers
  layouts/
    AppLayout
  components/
    layout/
      Sidebar
      SidebarItem
      Topbar
      Breadcrumbs
      PageHeader
    ui/
      Button
      Input
      Select
      Modal
      Tabs
      Dropdown
      Tooltip
      Badge
      DataTable
      Pagination
      LoadingState
      EmptyState
      ErrorState
  features/
    dashboard/
      pages/
      components/
      hooks/
      services/
      types/
      styles/
    [actual-feature]/
      pages/
      components/
      hooks/
      services/
      types/
      styles/
  pages/
    NotFoundPage
  services/
    apiClient
  hooks/
  types/
  utils/
  constants/
  styles/
    tokens
    global
    animations
```

This is a logical guide, not a requirement to create empty files or duplicate existing components.

Create feature folders only for modules confirmed by the repository or reference application.

## 3. Build the complete application shell

Implement the actual shared layout, including:
- Sidebar with real navigation items.
- Topbar with the actual controls.
- Active navigation states.
- Breadcrumbs where appropriate.
- Page headers and contextual actions.
- Responsive navigation.
- User/profile controls where present.
- Consistent page containers and content spacing.

Match the live reference as closely as possible.

## 4. Implement all actual pages

Inspect the project to determine the required pages and workflows.

For each verified page:
- Build its complete UI.
- Implement reusable components.
- Add relevant interactions.
- Connect it to existing APIs or a separated mock data layer.
- Implement appropriate loading, empty, success, and error states.
- Ensure direct routes and navigation work.

The dashboard must reproduce its actual widgets and layout. Other pages must reflect the real application rather than generic placeholder content.

Do not create fake routes or unnecessary modules.

## 5. Implement UI and animations now

The UI must be fully implemented during this development phase.

Use the live application as the visual reference for:
- Layout and component positioning.
- Colors and typography.
- Spacing and sizing.
- Cards, tables, charts, and forms.
- Borders, backgrounds, and visual hierarchy.
- Icons and interactive controls.
- Responsive behavior.

Implement appropriate animations for:
- Sidebar transitions.
- Dropdowns and dialogs.
- Hover and focus states.
- Loading indicators.
- Page transitions where appropriate.
- Expandable sections and interactive components.

Avoid unnecessary animation or excessive visual effects if they do not match the reference.

## 6. Make customization easy

This is a critical requirement.

Keep the project easy to modify by following these rules:

**Component separation**
- Each substantial component should have its own file.
- Separate page components from reusable UI components.
- Keep business logic out of presentation components when practical.
- Avoid giant components containing the entire application.

**Centralized styling**
- Use reusable design tokens for colors, spacing, typography, radii, shadows, and dimensions.
- Keep global styles separate from feature-specific styles.
- Use the styling solution already established in the project.
- Avoid scattering hardcoded values throughout unrelated components.

**Centralized animations**
- Keep reusable animation definitions and timing values in a shared location where appropriate.
- Allow individual components to control their animation behavior without modifying unrelated pages.
- Respect reduced-motion accessibility preferences.

**Feature independence**
- Keep feature-specific components, hooks, types, services, and styles together.
- Shared components should not depend on individual page implementations.
- Make it possible to restyle one component without rewriting its logic.

**Data separation**
- Keep API calls and mock data outside page presentation files.
- Use typed models and reusable hooks.
- Keep real API integration separate from development fallback data.

Do not overengineer the project. Choose abstractions that make future customization genuinely easier.

## 7. Implement real frontend functionality

All visible controls should work as intended.

Depending on the actual application, implement:
- Routing and navigation.
- Search and filtering.
- Sorting and pagination.
- Forms and validation.
- Create, edit, and delete workflows.
- Tables and detail views.
- Dialogs and dropdowns.
- Tabs and expandable sections.
- Charts and data summaries.
- Notifications and feedback.
- Loading and error handling.

Only implement workflows supported by the actual project.

Preserve existing backend integrations and API contracts. Never invent endpoints or silently change backend behavior.

If APIs are unavailable, create a clearly separated mock service layer that can be replaced later.

## 8. Responsive design and accessibility

Implement responsive layouts for desktop, tablet, and mobile.

Ensure:
- No unintended horizontal overflow.
- Responsive navigation and dialogs.
- Accessible form labels and keyboard interaction.
- Visible focus indicators.
- Suitable contrast and readable typography.
- Reduced-motion support.
- Clear loading, success, and error feedback.

## 9. Quality assurance

After implementation:
1. Run the application.
2. Verify every required route.
3. Test navigation and interactive controls.
4. Test forms and data workflows.
5. Check API requests and error handling.
6. Inspect the rendered UI against the reference.
7. Test different viewport sizes.
8. Resolve build errors, broken imports, and critical console errors.
9. Refine the visual differences that can be verified.

Do not stop after generating files or getting the application to compile. Verify the actual running frontend.

## 10. Final deliverables

Provide:
- The final folder and file structure.
- All implemented routes and feature modules.
- A list of reusable components.
- The location of shared styles and animation definitions.
- A description of API integration and mock data.
- Commands to run the application.
- Tests performed and their results.
- Any remaining blockers or unimplemented features.

## Final instruction

Build the complete, functional, visually implemented Kestrel frontend now.

Keep its architecture modular so future customization of individual pages, UI components, styling, and animations is straightforward.

Start by inspecting the repository and deployed reference, then proceed through implementation, testing, and refinement. Do not stop at planning, a wireframe, or an unstyled skeleton.
