import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
