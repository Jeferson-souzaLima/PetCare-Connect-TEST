import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { MobileBottomNav } from "../components/navigation/MobileBottomNav";

export default function Layout({ children }) {
  return (
    <>
      <Header />

      <main className="pb-24 md:pb-0">
        {children ?? <Outlet />}
      </main>

      <MobileBottomNav />
    </>
  );
}