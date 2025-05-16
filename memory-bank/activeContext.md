# Active Context

## Current Focus

### UI Component Development

1. **Component Library Status**
   - Comprehensive set of UI components available in `src/components/ui/`
   - Components follow modern React patterns and best practices
   - All components are built with accessibility in mind

2. **Recent Component Updates**
   - Added new components:
     - `command.tsx` - Command palette for quick actions
     - `sheet.tsx` - Sliding panel component
     - `skeleton.tsx` - Loading skeleton component
   - Enhanced existing components with better accessibility
   - Improved TypeScript types and documentation

3. **Active Development Areas**
   - Component documentation and examples
   - Performance optimization
   - Accessibility improvements
   - Testing coverage

## Next Steps

1. **Component Enhancements**
   - Add more interactive examples
   - Improve component documentation
   - Add visual regression tests
   - Enhance keyboard navigation

2. **Documentation**
   - Create component usage guides
   - Document accessibility features
   - Add performance best practices
   - Include testing guidelines

3. **Quality Assurance**
   - Increase test coverage
   - Add accessibility testing
   - Implement visual regression testing
   - Performance benchmarking

## Important Patterns

1. **Component Usage**
   - Import from `@/components/ui/`
   - Use TypeScript for type safety
   - Follow accessibility guidelines
   - Implement proper error handling

2. **Styling Conventions**
   - Use Tailwind CSS classes
   - Follow consistent spacing
   - Implement responsive design
   - Maintain dark mode support

3. **State Management**
   - Use controlled components
   - Implement proper loading states
   - Handle errors gracefully
   - Manage form state effectively

## Learnings & Insights

1. **Component Design**
   - Composition over inheritance
   - Clear prop interfaces
   - Consistent styling patterns
   - Accessibility first approach

2. **Performance**
   - Memoization for expensive computations
   - Proper use of React hooks
   - Optimized re-renders
   - Efficient event handling

3. **Testing**
   - Unit testing component logic
   - Accessibility testing
   - Visual regression testing
   - Integration testing

## Current Focus
The application is currently focused on the Features component, which acts as the main dashboard for displaying all available tools and utilities to users. This component organizes features into categories, provides search functionality, and highlights popular features based on page views. The application also implements a multilanguage system supporting English and Vietnamese. Recently, new image utility features have been added: background removal and image cropping functionality to expand the utility offerings.

## Recent Changes
- Implementation of the Features component with category filtering
- Search functionality with text normalization for better user experience
- Page view tracking and popular feature highlighting
- Multiple caching strategies for performance optimization
- Multilanguage system with context-based translation function
- Language switcher component with animated dropdown menu
- Browser language detection and persistent language preference
- Added new image background removal tool with API endpoint
- Added new image cropping tool with rotation and scaling functionality
- Updated UI with modern gray-based color scheme across all components

## Key Patterns and Preferences
- Component-based architecture with clear separation of concerns
- Tailwind CSS for styling with consistent design patterns
- Client-side filtering and search for immediate user feedback
- Category-based organization of features
- Popular/Hot badges for features with high page views
- Clean, modern minimalist dashboard UI with card-based components
- Monochromatic gray color scheme (avoiding blue colors)
- Neutral UI with gray-600 for primary buttons and active states
- Soft transitions between gray shades (gray-50 to gray-700)
- Responsive design optimized for mobile devices
- JSON-based translation files with nested keys
- Context API for language state management
- Translation function (t) for all user-facing text
- API routes for special functionality like image processing
- Canvas-based image manipulation for client-side processing
- React-image-crop library integration for image cropping functionality

## UI Styling Guidelines
- Use gray-600 instead of blue-600 for primary buttons and active states
- Use gray-700 instead of blue-700 for hover states on primary elements
- Background colors should primarily be gray-50 for light containers
- Use subtle gray borders (gray-200, gray-300) for container elements
- Interactive elements should use consistent hover transitions
- Forms should maintain a clean, minimalist appearance
- Icons should be gray-500 unless in active state (then gray-600)
- Card-based components with subtle shadows and rounded corners (xl)
- Typography should follow a clear hierarchy with gray-700/800 for headings

## Active Decisions
- Currently using a basic fetch approach for page views with suggested alternatives
- Using client-side filtering for features with debounced search
- Organizing features into defined categories
- Implementing a consistent card-based UI for all features
- Prioritizing clean layouts, soft gray colors, and simple navigation
- Using a context-based approach for language management
- Detecting browser language on first visit with localStorage persistence
- Using a placeholder API for image background removal in development
- Using client-side canvas manipulation for image cropping
- Adopting a monochromatic gray palette replacing all blue color references