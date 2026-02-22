import { OrderHistoryPage } from "~/pageComponents/OrderHistory/OrderHistory.page";

export const metadata = {
  title: "Order History | Diyafa",
  description: "Look up your past restaurant orders by phone number",
};

export default function OrderHistory() {
  return <OrderHistoryPage />;
}
