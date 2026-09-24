import React from "react";
import { getSystemInfo } from "zmp-sdk";
import {
  App,
  SnackbarProvider,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";
import { AppProvider } from "@/context/AppContext";
import MainApp from "@/pages/index";

const Layout = () => {
  let theme: AppProps["theme"] = "light";
  try {
    const sys = getSystemInfo();
    if (sys && sys.zaloTheme) {
      theme = sys.zaloTheme as AppProps["theme"];
    }
  } catch (e) {
    theme = "light";
  }

  return (
    <App theme={theme}>
      <SnackbarProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </SnackbarProvider>
    </App>
  );
};

export default Layout;
