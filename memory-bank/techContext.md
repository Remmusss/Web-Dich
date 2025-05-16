# Technical Context

## Technologies Used
- **Next.js 14.1.0**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Authentication and Firestore database
- **React Icons**: Icon library including various icon sets
- **Framer Motion**: Animation library for smooth UI transitions
- **AI Integrations**: OpenAI, Google AI
- **SWR** (suggested): Data fetching and caching

## Development Setup
- Standard Next.js development environment
- `npm run dev` for local development
- `npm run build` for production builds
- `npm run start` to run the production build
- `npm run lint` for linting

## Technical Constraints
- Client-side filtering and search may have performance implications with large feature sets
- API for page views tracking requires proper caching strategy
- Firebase rules need to be configured for proper security
- Mobile responsiveness requires careful design considerations
- Translation system relies on client-side configuration

## Dependencies
The project has numerous dependencies including:
- Firebase for authentication and database
- Google AI/Gen AI for AI functionality
- Chart.js for data visualization
- Various utilities for specific features (qrcode, katex, etc.)
- SWR (suggested) for data fetching
- Framer Motion for animations in UI components like the language switcher

## API Integration
- The application integrates with several external APIs:
  - OpenAI/Google AI for AI-powered features
  - Weather APIs for weather forecasts
  - Currency APIs for exchange rates
  - Firebase for backend services

## Design System
- Modern minimalist design approach
- Card-based UI components for features
- Soft color palette with clean typography
- Light icons and subtle shadows for depth
- Fully responsive design with mobile-first approach

## Multilanguage System
- JSON-based translation files for each supported language (en.json, vi.json)
- Context-provider architecture for language state management
- Dynamic language detection from browser settings
- Persistent language preference via localStorage
- Animated language switcher component with dropdown
- Translation function with nested key support
- Fallback to English when translations are missing

## UI Components Library

The project uses a comprehensive set of UI components located in `src/components/ui/`. These components are built using modern React patterns and provide a consistent design system.

### Available Components

1. **Basic Input Components**
   - `input.tsx` - Standard text input field
   - `textarea.tsx` - Multi-line text input
   - `select.tsx` - Dropdown selection component
   - `radio-group.tsx` - Radio button group
   - `switch.tsx` - Toggle switch component
   - `slider.tsx` - Range slider component

2. **Button Components**
   - `button.tsx` - Standard button component
   - `button-group.tsx` - Group of buttons

3. **Layout Components**
   - `card.tsx` - Card container component
   - `separator.tsx` - Visual separator
   - `sidebar.tsx` - Side navigation component
   - `sheet.tsx` - Sliding panel component

4. **Overlay Components**
   - `dialog.tsx` - Modal dialog component
   - `modal.tsx` - Modal window component
   - `popover.tsx` - Popover component
   - `tooltip.tsx` - Tooltip component

5. **Feedback Components**
   - `toast.tsx` - Toast notification component
   - `toaster.tsx` - Toast container
   - `progress.tsx` - Progress indicator
   - `skeleton.tsx` - Loading skeleton component

6. **Navigation Components**
   - `tabs.tsx` - Tab navigation component
   - `command.tsx` - Command palette component

### Usage Guidelines

1. **Import Pattern**
   ```typescript
   import { ComponentName } from '@/components/ui/component-name'
   ```

2. **Component Props**
   - All components follow a consistent props interface
   - Common props include:
     - `className` for custom styling
     - `disabled` for disabling interaction
     - `onChange` for input handling
     - `value` for controlled components

3. **Styling**
   - Components use Tailwind CSS for styling
   - Custom styles can be added via className prop
   - Follow the design system's color scheme and spacing

4. **Accessibility**
   - All components are built with accessibility in mind
   - Include proper ARIA attributes
   - Support keyboard navigation
   - Maintain proper focus management

### Best Practices

1. **Component Selection**
   - Use the most appropriate component for the use case
   - Consider accessibility requirements
   - Follow the design system guidelines

2. **State Management**
   - Use controlled components when possible
   - Implement proper error handling
   - Consider loading states

3. **Performance**
   - Avoid unnecessary re-renders
   - Use proper memoization when needed
   - Follow React best practices

4. **Testing**
   - Components should be unit tested
   - Include accessibility testing
   - Test different states and edge cases