import { Chart } from "@/components/Chart";
import { Orderbook } from "@/components/Orderbook";
import { OrderForm } from "@/components/OrderForm";
import { Trades } from "@/components/Trades";

export default function Home() {
  return (
    <main className="flex gap-4 p-4">
      <Orderbook />
      <Chart />
      <Trades />
      <OrderForm />
    </main>
  )
}