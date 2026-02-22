"use client";

import { useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

interface UseDialogFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void>;
  resetOnClose?: boolean;
}

interface UseDialogFormReturn<T extends FieldValues> {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleClose: () => void;
}

/**
 * Shared hook for managing dialog forms with validation and submission.
 * Encapsulates common dialog + form patterns to reduce duplication.
 *
 * @example
 * ```tsx
 * const schema = z.object({ name: z.string().min(1) });
 * type FormData = z.infer<typeof schema>;
 *
 * const { open, setOpen, form, handleSubmit, handleClose } = useDialogForm<FormData>({
 *   schema,
 *   defaultValues: { name: "" },
 *   onSubmit: async (data) => {
 *     await createMutation.mutateAsync(data);
 *   },
 * });
 * ```
 */
export function useDialogForm<T extends FieldValues>(
  options: UseDialogFormOptions<T>
): UseDialogFormReturn<T> {
  const { schema, defaultValues, onSubmit, resetOnClose = true } = options;
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    setIsSubmitting(true);
    try {
      await form.handleSubmit(async (data) => {
        await onSubmit(data);
        if (resetOnClose) {
          form.reset();
        }

        setOpen(false);
      })(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (resetOnClose) {
      form.reset();
    }
  };

  return {
    open,
    setOpen,
    form,
    isSubmitting,
    handleSubmit,
    handleClose,
  };
}
