import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks - must be declared before component import
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "feedback.title": "How was your experience?",
        "feedback.ratingLabel": "Rate your experience",
        "feedback.commentLabel": "Leave a comment (optional)",
        "feedback.nameLabel": "Your name (optional)",
        "feedback.submit": "Submit Feedback",
        "feedback.submitting": "Submitting...",
        "feedback.selectRating": "Please select a rating",
        "feedback.thankYouPositive": "Thank you for your wonderful feedback!",
        "feedback.thankYouNegative": "Thank you for your feedback. We will do better.",
        "feedback.shareOnGoogle": "Share on Google",
        "feedback.alreadySubmitted": "You have already submitted feedback.",
        "feedback.poweredBy": "Powered by FeastQR",
      };

      return translations[key] ?? key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement("img", { src, alt, ...props }),
}));

// Mutable mutation state so tests can override behavior
const mockMutate = vi.fn();
let mutationState = {
  mutate: mockMutate,
  isLoading: false,
  isError: false,
  error: null as { message: string } | null,
};
let onSuccessCallback: (() => void) | undefined;

vi.mock("~/trpc/react", () => ({
  api: {
    reviews: {
      submitReview: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void }) => {
          if (opts?.onSuccess) {
            onSuccessCallback = opts.onSuccess;
          }

          return mutationState;
        }),
      },
    },
  },
}));

import { FeedbackForm } from "../FeedbackForm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  menuId: "menu-123",
  restaurantName: "Cafe Marrakech",
  logoUrl: "https://example.com/logo.png",
  googleReviewUrl: "https://g.page/cafe-marrakech/review",
};

function renderForm(overrides?: Partial<typeof defaultProps>) {
  return render(<FeedbackForm {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FeedbackForm", () => {
  beforeEach(() => {
    cleanup();
    mockMutate.mockClear();
    onSuccessCallback = undefined;
    mutationState = {
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      error: null,
    };
    // Clear localStorage for the test menu
    localStorage.removeItem("feedback-submitted-menu-123");
  });

  // 1. Renders star rating, comment field, name field, submit button
  it("renders star rating, comment field, name field, and submit button", () => {
    renderForm();

    // Star rating radio group with 5 stars
    const radioGroup = screen.getByRole("radiogroup");

    expect(radioGroup).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(5);

    // Comment textarea
    const comment = screen.getByLabelText("Leave a comment (optional)");

    expect(comment).toBeInTheDocument();
    expect(comment.tagName.toLowerCase()).toBe("textarea");

    // Name input
    const nameInput = screen.getByLabelText("Your name (optional)");

    expect(nameInput).toBeInTheDocument();

    // Submit button
    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    expect(submitBtn).toBeInTheDocument();
  });

  // 2. Rating validation error when no stars selected
  it("shows rating validation error when submitting without selecting stars", () => {
    renderForm();

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    fireEvent.click(submitBtn);

    const alert = screen.getByRole("alert");

    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toBe("Please select a rating");

    // mutate should NOT have been called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // 3. Star selection updates visual state (aria-checked)
  it("star selection updates aria-checked state", () => {
    renderForm();

    const radios = screen.getAllByRole("radio");

    // All start unchecked
    for (const radio of radios) {
      expect(radio).toHaveAttribute("aria-checked", "false");
    }

    // Click 4th star
    fireEvent.click(radios[3]!);

    // 4th star should be checked, others not
    expect(radios[3]!).toHaveAttribute("aria-checked", "true");
    expect(radios[0]!).toHaveAttribute("aria-checked", "false");
    expect(radios[4]!).toHaveAttribute("aria-checked", "false");
  });

  // 4. Successful submission transitions to thank-you phase
  it("transitions to thank-you phase on successful submission", async () => {
    renderForm();

    // Select 5 stars
    const radios = screen.getAllByRole("radio");

    fireEvent.click(radios[4]!);

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    fireEvent.click(submitBtn);

    // mutate should have been called
    expect(mockMutate).toHaveBeenCalledWith({
      menuId: "menu-123",
      rating: 5,
      comment: undefined,
      customerName: undefined,
    });

    // Simulate onSuccess callback
    onSuccessCallback?.();

    await waitFor(() => {
      expect(screen.getByText("Thank you for your wonderful feedback!")).toBeInTheDocument();
    });
  });

  // 5. Positive rating (4-5) shows Google Review link when googleReviewUrl is provided
  it("shows Google Review link for positive rating (4-5 stars) with googleReviewUrl", async () => {
    renderForm();

    // Select 4 stars
    const radios = screen.getAllByRole("radio");

    fireEvent.click(radios[3]!);

    // Submit
    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    fireEvent.click(submitBtn);

    // Trigger onSuccess
    onSuccessCallback?.();

    await waitFor(() => {
      const googleLink = screen.getByText("Share on Google");

      expect(googleLink).toBeInTheDocument();
      expect(googleLink.closest("a")).toHaveAttribute(
        "href",
        "https://g.page/cafe-marrakech/review",
      );
      expect(googleLink.closest("a")).toHaveAttribute("target", "_blank");
    });
  });

  // 6. Negative rating (1-3) shows internal thank-you message (no Google link)
  it("shows internal thank-you for negative rating (1-3 stars) without Google link", async () => {
    renderForm();

    // Select 2 stars
    const radios = screen.getAllByRole("radio");

    fireEvent.click(radios[1]!);

    // Submit
    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    fireEvent.click(submitBtn);

    // Trigger onSuccess
    onSuccessCallback?.();

    await waitFor(() => {
      expect(
        screen.getByText("Thank you for your feedback. We will do better."),
      ).toBeInTheDocument();
      expect(screen.queryByText("Share on Google")).not.toBeInTheDocument();
    });
  });

  // 7. Shows "already submitted" when localStorage has the key
  it("shows already-submitted message when localStorage flag is set", () => {
    localStorage.setItem("feedback-submitted-menu-123", "true");

    renderForm();

    expect(screen.getByText("You have already submitted feedback.")).toBeInTheDocument();

    // Form elements should NOT be present
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit feedback/i })).not.toBeInTheDocument();
  });

  // 8. Submit button disabled while loading
  it("disables submit button and shows loading text while mutation is loading", () => {
    mutationState = {
      mutate: mockMutate,
      isLoading: true,
      isError: false,
      error: null,
    };

    renderForm();

    const submitBtn = screen.getByRole("button", { name: /submitting/i });

    expect(submitBtn).toBeDisabled();
  });

  // 9. Error message displayed on mutation error
  it("displays error message when mutation fails", () => {
    mutationState = {
      mutate: mockMutate,
      isLoading: false,
      isError: true,
      error: { message: "Network error: could not submit review" },
    };

    renderForm();

    const alerts = screen.getAllByRole("alert");
    const errorAlert = alerts.find((a) =>
      a.textContent?.includes("Network error"),
    );

    expect(errorAlert).toBeTruthy();
    expect(errorAlert!.textContent).toBe("Network error: could not submit review");
  });

  // 10. Submits with comment and name when provided
  it("includes comment and customerName in mutation when provided", () => {
    renderForm();

    // Select 3 stars
    const radios = screen.getAllByRole("radio");

    fireEvent.click(radios[2]!);

    // Fill comment and name
    const comment = screen.getByLabelText("Leave a comment (optional)");

    fireEvent.change(comment, { target: { value: "Great food!" } });

    const nameInput = screen.getByLabelText("Your name (optional)");

    fireEvent.change(nameInput, { target: { value: "Ahmed" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });

    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith({
      menuId: "menu-123",
      rating: 3,
      comment: "Great food!",
      customerName: "Ahmed",
    });
  });

  // 11. Renders restaurant header with logo and name
  it("renders restaurant name and logo", () => {
    renderForm();

    expect(screen.getByText("Cafe Marrakech")).toBeInTheDocument();
    const logo = screen.getByAltText("Cafe Marrakech");

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "https://example.com/logo.png");
  });
});
