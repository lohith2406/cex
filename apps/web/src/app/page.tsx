import { Chart } from "@/components/Chart";
import { Header } from "@/components/Header";
import { Orderbook } from "@/components/Orderbook";
import { OrderForm } from "@/components/OrderForm";
import { Trades } from "@/components/Trades";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="flex h-svh flex-col">
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-[1fr_18rem_18rem] gap-2 p-2">
        <div className="min-h-0 bg-card">
          <Chart />
        </div>
        <Tabs defaultValue="book" className="min-h-0 bg-card p-2">
          <TabsList>
            <TabsTrigger value="book">Book</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
          <TabsContent value="book">
            <Orderbook />
          </TabsContent>
          <TabsContent value="trades" className="overflow-y-auto">
            <Trades />
          </TabsContent>
        </Tabs>
        <OrderForm />
      </main>
    </div>
  )
}