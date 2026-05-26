"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={thTH}
        theme={{
          token: {
            fontFamily: "var(--font-sarabun), Sarabun, sans-serif",
            colorPrimary: "#b68a2e",
            borderRadius: 6
          }
        }}
      >
        {children}
        <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnHover theme="colored" limit={5} />
      </ConfigProvider>
    </AntdRegistry>
  );
}
