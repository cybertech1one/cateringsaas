export const checkIfSubscribed = (status?: string) => {
  // Bypass subscription check in local development
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return (
    status === "active" ||
    status === "cancelled" ||
    status === "on_trial" ||
    status === "past_due"
  );
};

export const useUserSubscription = () => {
  // Diyafa uses org-based subscriptions — stub until org billing is built
  return {
    subscriptionData: null,
    isSubscriptionLoading: false,
    isSubscribed: true,
  };
};
