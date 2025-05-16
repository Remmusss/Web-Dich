# System Patterns

## Architecture
The application follows the Next.js App Router architecture pattern, with:
- Page components organized in the `/src/app` directory
- Reusable UI components in the `/src/components` directory
- Utility functions in `/src/utils`
- Custom hooks in `/src/hooks`
- Data models in `/src/models`
- Context providers in `/src/contexts`
- Constants in `/src/constants`
- Library integrations in `/src/lib`

## Component Structure
- The application uses a feature card pattern to display available tools
- Components are organized by functionality
- UI components leverage Tailwind CSS for styling
- Icons are provided by React Icons
- Modern minimalist design with card-based UI
- Monochromatic gray color scheme across all components

## UI Design System
- Primary color: monochromatic gray palette (gray-50 to gray-900)
- Primary buttons: gray-600 background with white text
- Button hover states: gray-700 background
- Card backgrounds: white with gray-100 hover states
- Borders: gray-200 for subtle separation, gray-300 for emphasis
- Icons: gray-500 for neutral state, gray-600/700 for active/hover states
- Typography: gray-700 for headings, gray-600 for body text, gray-500 for secondary text
- Form elements: white backgrounds with gray-300 borders
- Active/selected states: gray-600 backgrounds with white text
- Consistent rounded-xl corners for containers and rounded-lg for buttons
- Subtle shadows (shadow-md) for card elevation

## State Management
- React's built-in state management (useState, useEffect, etc.) is used
- Category filtering and search functionality implemented at the component level
- Page view tracking is handled via custom hooks and API calls

## Data Flow
1. Features are defined in static arrays in the Features component
2. User interactions (search, category selection) filter the displayed features
3. Page views are fetched from an API and used to mark popular features
4. Links direct users to the respective feature pages

## Multilanguage Implementation
1. Application supports English and Vietnamese languages via a context-based translation system
2. Translation JSON files are stored in `src/constants/translations` (en.json, vi.json)
3. LanguageContext provides language state and translation function via `useLanguage` hook
4. User language preference is stored in localStorage and detected from browser settings
5. LanguageSwitcher component allows users to toggle between available languages
6. All UI text uses the translation function `t()` to support multiple languages
7. Nested keys in translation files provide organized access to translations (e.g., 'translate.title')

## Key Implementation Patterns
1. Client-side filtering of features based on user input
2. Semantic search with text normalization for better user experience
3. Multiple caching strategies commented in the code (SWR, React Query, Server-Side Caching)
4. Popular feature highlighting based on view metrics
5. Responsive design patterns for mobile optimization
6. Clean, modern UI with consistent styling across components
7. Centralized language management with context-based translation system
8. Consistent styling patterns: 
   - Container padding (p-6 to p-8)
   - Spacing between elements (gap-4 to gap-8)
   - Rounded corners (rounded-lg to rounded-xl)
   - Consistent transition effects (transition-colors, duration-150)
   - Gray-based color palette for all UI elements

## UI Component Architecture

### Component Organization

1. **Directory Structure**
   ```
   src/
   └── components/
       ├── ui/           # Reusable UI components
       │   ├── input.tsx
       │   ├── button.tsx
       │   └── ...
       └── features/     # Feature-specific components
   ```

2. **Component Categories**
   - **Primitive Components**: Basic building blocks (input, button)
   - **Composite Components**: Combine primitives (form, card)
   - **Layout Components**: Structure and positioning (sidebar, sheet)
   - **Feedback Components**: User interaction feedback (toast, progress)

### Component Patterns

1. **Props Pattern**
   ```typescript
   interface ComponentProps {
     className?: string;
     disabled?: boolean;
     // Component-specific props
   }
   ```

2. **Composition Pattern**
   - Use compound components for complex UI
   - Example: Dialog with Header, Content, Footer

3. **State Management**
   - Use controlled components for form elements
   - Implement proper error states
   - Handle loading states consistently

4. **Styling Pattern**
   - Use Tailwind CSS for styling
   - Follow consistent spacing and color system
   - Implement responsive design patterns

### Component Relationships

1. **Parent-Child Communication**
   - Props for data flow
   - Callbacks for events
   - Context for shared state

2. **Component Dependencies**
   - Minimal dependencies between components
   - Clear interface definitions
   - Proper prop typing

3. **Reusability Patterns**
   - Extract common patterns into hooks
   - Create higher-order components when needed
   - Use composition over inheritance

### Implementation Guidelines

1. **Component Creation**
   - Start with TypeScript interfaces
   - Implement accessibility features
   - Add proper error handling
   - Include loading states

2. **Testing Strategy**
   - Unit tests for component logic
   - Integration tests for component interactions
   - Accessibility testing
   - Visual regression testing

3. **Documentation**
   - JSDoc comments for props
   - Usage examples
   - Accessibility notes
   - Performance considerations

4. **Performance Optimization**
   - Memoize expensive computations
   - Use proper React hooks
   - Implement virtual scrolling for large lists
   - Optimize re-renders