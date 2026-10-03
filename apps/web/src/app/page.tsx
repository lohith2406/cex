import { Balances } from "@/components/Balances";
import { Chart } from "@/components/Chart";
import { Header } from "@/components/Header";
import { MarketFeed } from "@/components/MarketFeed";
import { OpenOrders } from "@/components/OpenOrders";
import { Orderbook } from "@/components/Orderbook";
import { OrderForm } from "@/components/OrderForm";
import { Trades } from "@/components/Trades";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="flex h-svh flex-col">
      <MarketFeed />
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-[1fr_18rem_18rem] gap-2 p-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-1 bg-card">
            <Chart />
          </div>
          <div className="h-56 bg-card overflow-auto">
            <Tabs defaultValue="balances">
              <TabsList variant="line">
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="openOrders">Open Orders</TabsTrigger>
                <TabsTrigger value="orderHistory">Order History</TabsTrigger>
              </TabsList>
              <TabsContent value="balances">
                  <Balances />
              </TabsContent>
              <TabsContent value="openOrders">
                  <OpenOrders />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Tabs defaultValue="book" className="min-h-0 bg-card p-2">
          <TabsList variant="line">
            <TabsTrigger value="book">Book</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
          <TabsContent value="book" className="overflow-y-auto">
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