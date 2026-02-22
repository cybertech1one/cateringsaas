import { OrderTrackingPage } from "~/pageComponents/OrderTracking/OrderTracking.page";

export const metadata = {
  title: "Track Your Order | FeastQR",
  description: "Track your restaurant order status in real-time",
};

export default function OrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  return <OrderTrackingPage orderId={params.orderId} />;
}
