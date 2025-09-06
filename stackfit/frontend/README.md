# StackFit Frontend

This is the frontend for the StackFit application built with Next.js.

## UI Components

The frontend uses [shadcn/ui](https://ui.shadcn.com/) for UI components. Shadcn/UI is a collection of re-usable components built using Radix UI and Tailwind CSS.

### Available Components

The following shadcn/ui components have been integrated into the application:

- Button - `@/components/ui/button`
- Input - `@/components/ui/input`
- Textarea - `@/components/ui/textarea`
- Card - `@/components/ui/card`
- Table - `@/components/ui/table`
- Dialog - `@/components/ui/dialog`
- Alert - `@/components/ui/alert`
- Label - `@/components/ui/label`
- Tabs - `@/components/ui/tabs`
- Select - `@/components/ui/select`
- Separator - `@/components/ui/separator`
- Skeleton - `@/components/ui/skeleton`
- Calendar - `@/components/ui/calendar`
- DatePicker - `@/components/ui/date-picker`
- Checkbox - `@/components/ui/checkbox`
- Form - `@/components/ui/form`
- DropdownMenu - `@/components/ui/dropdown-menu`
- Popover - `@/components/ui/popover`

### Wrapper Components

The following legacy components have been wrapped around shadcn/ui components to maintain compatibility with existing code:

- `Button.js` - Wraps shadcn Button with Framer Motion animations
- `Input.js` - Wraps shadcn Input with label support
- `Card.js` - Wraps shadcn Card with additional layout options
- `Table.js` - Wraps shadcn Table components

### Toast Notifications

The application uses [Sonner](https://sonner.emilkowal.ski/) for toast notifications, integrated through shadcn/ui's Sonner component.

Usage:
```javascript
import { toast } from "sonner";

// Success toast
toast.success("Operation completed successfully");

// Error toast
toast.error("Something went wrong");

// Info toast
toast("This is an information message");
```

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.
