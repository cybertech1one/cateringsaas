import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDialogForm } from "../useDialogForm";
import { z } from "zod";

describe("useDialogForm", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
  });

  type FormData = z.infer<typeof schema>;

  const defaultValues: FormData = {
    name: "",
    email: "",
  };

  it("should initialize with closed state", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({ schema, defaultValues, onSubmit })
    );

    expect(result.current.open).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should open and close dialog", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({ schema, defaultValues, onSubmit })
    );

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.open).toBe(true);

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.open).toBe(false);
  });

  it("should reset form on close when resetOnClose is true", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({ schema, defaultValues, onSubmit, resetOnClose: true })
    );

    act(() => {
      result.current.form.setValue("name", "Test Name");
    });

    expect(result.current.form.getValues("name")).toBe("Test Name");

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.form.getValues("name")).toBe("");
  });

  it("should not reset form on close when resetOnClose is false", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({ schema, defaultValues, onSubmit, resetOnClose: false })
    );

    act(() => {
      result.current.form.setValue("name", "Test Name");
    });

    expect(result.current.form.getValues("name")).toBe("Test Name");

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.form.getValues("name")).toBe("Test Name");
  });

  it("should call onSubmit with form data", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({ schema, defaultValues, onSubmit })
    );

    act(() => {
      result.current.form.setValue("name", "John Doe");
      result.current.form.setValue("email", "john@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
    });
  });
});
