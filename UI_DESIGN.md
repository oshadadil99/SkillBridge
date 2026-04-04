# SkillBridge UI Design Document

## Color Palette

- **Primary Blue**: `#2c3e7f` / `#3d5ba8`
- **Light Background**: `#f5f5f5`
- **White**: `#ffffff`
- **Dark Text**: `#333333`
- **Light Gray**: `#999999`
- **Border Gray**: `#ddd`
- **Error Red**: `#cc3333`
- **Success Green**: `#33cc33`

## Login & Registration Pages

### Layout
- **Split Design**: Left side with brand features, right side with form
- **Gradient Background**: Blue gradient on left panel
- **Responsive**: Stacks vertically on mobile

### Components
- Form inputs with focus states
- Password toggle visibility
- Remember me checkbox
- OAuth buttons (Google)
- Links to login/register pages

### Features
- Real-time form validation
- Error message display
- Loading states
- Password confirmation matching

## Dashboard

### Layout
- **Sidebar**: Navigation with icon + text
- **Main Content**: Dynamic content area
- **Top Bar**: Welcome message + user menu

### Sidebar Menu
1. Overview (📊)
2. My Courses (📖)
3. Progress (📈)
4. Certificates (🎓)
5. Settings (⚙️)

### Dashboard Cards
- Learning statistics displayed in grid
- Hover effects for interactivity
- Icons + values + descriptions

### Recent Activity
- Activity list with timestamps
- Different icons for different actions
- Expandable items (future)

## Responsive Design

- Desktop: 1920px - Full layout
- Tablet: 768px - Adjusted grid
- Mobile: 480px - Stacked layout

## Font Sizes

- H1: 48px
- H2: 28px
- Title: 24px
- Heading: 18px
- Body: 16px
- Small: 14px
- Tiny: 12px

## Spacing

- Base unit: 8px
- Padding: 20px (cards), 12px (inputs)
- Margin: 20px (sections), 15px (items)
- Border radius: 4px-8px

## Interactive Elements

### Buttons
- Primary (Login/Register): Blue gradient
- Secondary (OAuth): White border
- Logout: Red background
- Hover state: Slight lift + shadow

### Links
- Color: `#3d5ba8`
- Hover: Underline
- No text decoration by default

### Form Inputs
- Border: 1px solid `#ddd`
- Focus: Blue border + shadow
- Padding: 12px
- Border radius: 4px

## Animation & Transitions

- Hover effects: 0.2s-0.3s
- Transform: translateY(-2px) to -4px
- Shadows: Subtle enhancement on hover
- No animations on load (performance)

## Accessibility

- High contrast text
- Proper label associations
- Focus indicators on inputs
- Keyboard navigation support
- Semantic HTML structure

## Next Steps for UI Enhancement

1. Add admin dashboard layout
2. Create course card components
3. Design progress visualization (charts)
4. Add notification system UI
5. Design settings page
6. Create user profile page
7. Add dark mode support
8. Implement animations library
