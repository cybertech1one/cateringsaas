"use client";

import { Component, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";

function AlertIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ThemedMenuViewErrorBoundaryInner extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const t = this.props.t as (key: string) => string;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            textAlign: "center",
            minHeight: "300px",
          }}
        >
          <div
            style={{
              color: "var(--menu-muted)",
              marginBottom: "20px",
              opacity: 0.6,
            }}
          >
            <AlertIcon />
          </div>
          <h2
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-xl)",
              fontWeight: 700,
              color: "var(--menu-text)",
              margin: "0 0 8px",
            }}
          >
            {t("errorBoundary.title")}
          </h2>
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-base)",
              color: "var(--menu-muted)",
              margin: "0 0 24px",
              maxWidth: "360px",
              lineHeight: 1.6,
            }}
          >
            {t("errorBoundary.message")}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: "12px 28px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "var(--menu-primary)",
              color: "var(--menu-surface)",
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-base)",
              fontWeight: 600,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              minHeight: "44px",
            }}
          >
            {t("errorBoundary.reload")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ThemedMenuViewErrorBoundary = withTranslation()(
  ThemedMenuViewErrorBoundaryInner,
);
