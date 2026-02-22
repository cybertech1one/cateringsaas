# Shared Components and Hooks

This directory contains reusable components and hooks designed to reduce code duplication across the FeastQR project.

## Hooks

### `useDialogForm`

A shared hook for managing dialog forms with validation and submission. Encapsulates the common pattern of form state + dialog state + submission handling.

**Location:** `src/shared/hooks/useDialogForm.ts`

**Features:**
- Manages dialog open/close state
- Integrates react-hook-form with Zod validation
- Handles form submission and loading states
- Optionally resets form on close
- Type-safe with full TypeScript support

**Example Usage:**

```tsx
import { useDialogForm } from "~/shared/hooks/useDialogForm";
import { z } from "zod";

const createRestaurantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type CreateRestaurantForm = z.infer<typeof createRestaurantSchema>;

export function CreateRestaurantDialog() {
  const { toast } = useToast();
  const utils = api.useContext();

  const createMutation = api.restaurants.createRestaurant.useMutation({
    onSuccess: () => {
      toast({ title: "Restaurant created successfully" });
      void utils.restaurants.getRestaurants.invalidate();
    },
  });

  const { open, setOpen, form, handleSubmit, handleClose, isSubmitting } =
    useDialogForm<CreateRestaurantForm>({
      schema: createRestaurantSchema,
      defaultValues: { name: "", description: "" },
      onSubmit: async (data) => {
        await createMutation.mutateAsync(data);
      },
      resetOnClose: true, // Optional, defaults to true
    });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Restaurant</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Restaurant</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Migration Guide:**

Before (duplicated pattern):
```tsx
const [open, setOpen] = useState(false);
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

const onSubmit = (values) => {
  mutation.mutate(values);
};

// Manual open/close handling
// Manual form reset
```

After (using useDialogForm):
```tsx
const { open, setOpen, form, handleSubmit, handleClose, isSubmitting } =
  useDialogForm({
    schema,
    defaultValues: { ... },
    onSubmit: async (data) => {
      await mutation.mutateAsync(data);
    },
  });
```

## Components

### `StatCard`

A reusable card component for displaying metrics, KPIs, and statistics.

**Location:** `src/components/StatCard/StatCard.tsx`

**Props:**
- `title` (required): The metric label
- `value` (required): The metric value (string or number)
- `description` (optional): Additional context text
- `icon` (optional): Lucide icon component
- `trend` (optional): Trend indicator with value, label, and positive/negative flag
- `className` (optional): Additional CSS classes
- `iconClassName` (optional): Icon wrapper classes
- `valueClassName` (optional): Value text classes

**Example Usage:**

```tsx
import { StatCard } from "~/components/StatCard";
import { MenuSquare, TrendingUp, Users } from "lucide-react";

// Simple stat
<StatCard
  title="Total Menus"
  value={42}
  icon={MenuSquare}
  iconClassName="text-primary"
/>

// With trend indicator
<StatCard
  title="Active Users"
  value="1,234"
  icon={Users}
  trend={{
    value: 12.5,
    label: "vs last month",
    isPositive: true,
  }}
/>

// With description
<StatCard
  title="Revenue"
  value="$12,345"
  description="Last 30 days"
  icon={TrendingUp}
  iconClassName="text-green-600"
/>
```

**Replaces:**
- Dashboard.page.tsx inline StatCard component (lines 202-224)
- Reviews.page.tsx inline StatCard component (lines 598-616)

### `EmptyState`

A reusable component for displaying empty states with icons, descriptions, and optional action buttons.

**Location:** `src/components/EmptyState/EmptyState.tsx`

**Props:**
- `title` (required): The empty state heading
- `description` (optional): Explanatory text
- `icon` (optional): Lucide icon component
- `action` (optional): Object with `label`, `onClick`, and optional `icon`
- `className` (optional): Additional CSS classes

**Example Usage:**

```tsx
import { EmptyState } from "~/components/EmptyState";
import { Store, Plus } from "lucide-react";

<EmptyState
  icon={Store}
  title="No restaurants yet"
  description="Get started by creating your first restaurant. You can add multiple locations and menus."
  action={{
    label: "Create Restaurant",
    onClick: () => setCreateDialogOpen(true),
    icon: Plus,
  }}
/>

// Without action button
<EmptyState
  icon={MessageSquare}
  title="No reviews yet"
  description="Reviews will appear here once customers start leaving feedback."
/>
```

**Replaces:**
- Restaurants.page.tsx empty state (lines 148-167)
- Reviews.page.tsx empty state (lines 353-361)
- Dashboard.page.tsx empty placeholder usage

### `ConfirmDialog`

A reusable confirmation dialog for destructive or important actions.

**Location:** `src/components/ConfirmDialog/ConfirmDialog.tsx`

**Props:**
- `trigger` (required): The element that opens the dialog
- `title` (required): Dialog title
- `description` (required): Dialog description/warning text
- `confirmLabel` (optional): Confirm button text (default: "Confirm")
- `cancelLabel` (optional): Cancel button text (default: "Cancel")
- `variant` (optional): "destructive" or "default"
- `onConfirm` (required): Function to call when confirmed (can be async)
- `open` (optional): Controlled open state
- `onOpenChange` (optional): Controlled open change handler

**Example Usage:**

```tsx
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Trash2 } from "lucide-react";

// Uncontrolled (trigger-based)
<ConfirmDialog
  trigger={
    <Button variant="ghost" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  }
  title="Delete restaurant?"
  description="This action cannot be undone. All menus and data will be permanently deleted."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  variant="destructive"
  onConfirm={async () => {
    await deleteMutation.mutateAsync({ id: restaurant.id });
  }}
/>

// Controlled (for programmatic opening)
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

<ConfirmDialog
  trigger={<Button>Delete</Button>}
  title="Confirm deletion"
  description="Are you sure?"
  variant="destructive"
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={async () => {
    await handleDelete();
  }}
/>
```

**Replaces:**
- Reviews.page.tsx delete confirmation dialog (lines 562-591)
- Any manual AlertDialog implementations for confirmations

## Testing

All shared hooks and components include comprehensive tests:

- `src/shared/hooks/__tests__/useDialogForm.test.ts` - 5 tests covering:
  - Initialization
  - Open/close behavior
  - Form reset logic
  - Submission handling

Run tests with:
```bash
pnpm test
```

## Migration Checklist

To migrate existing code to use these shared components:

### For Dialog Forms:

1. Identify components using the pattern:
   - `useState` for dialog open state
   - `useForm` with zodResolver
   - Manual submission handling
   - Manual form reset

2. Replace with `useDialogForm`:
   - Import the hook
   - Replace state management with hook
   - Update form submission to use `handleSubmit`
   - Update close handlers to use `handleClose`
   - Use `isSubmitting` instead of mutation loading state (optional)

3. Examples to migrate:
   - `CreateRestaurantDialog.tsx`
   - `CreateLocationDialog.tsx`

### For Stat Cards:

1. Find inline StatCard implementations
2. Replace with shared `<StatCard />` component
3. Update props to match new API

Files to update:
- `Dashboard.page.tsx` (lines 202-224)
- `Reviews.page.tsx` (lines 598-616)

### For Empty States:

1. Find empty state markup (typically centered divs with icons)
2. Replace with `<EmptyState />` component
3. Convert action buttons to `action` prop

Files to update:
- `Restaurants.page.tsx` (lines 148-167)
- `Reviews.page.tsx` (lines 353-361)

### For Confirmation Dialogs:

1. Find AlertDialog usage for confirmations
2. Replace with `<ConfirmDialog />` wrapper
3. Move confirmation logic to `onConfirm` prop

Files to update:
- `Reviews.page.tsx` (delete confirmation)

## Benefits

Using these shared components provides:

1. **Consistency**: Same UX patterns across the application
2. **Maintainability**: Single source of truth for common patterns
3. **Type Safety**: Full TypeScript support with proper inference
4. **Testability**: Pre-tested components reduce testing burden
5. **Developer Experience**: Less boilerplate, faster development
6. **Accessibility**: Components follow best practices (AlertDialog, proper ARIA)

## Future Additions

Consider creating shared components for:

- Loading states (skeleton loaders)
- Data tables with sorting/filtering
- Toast notification wrappers
- File upload components
- Form field wrappers (to reduce FormField boilerplate)
