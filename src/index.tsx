import { AppUiProvider } from "@canva/app-ui-kit";
import { prepareDesignEditor } from "@canva/intents/design";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "@canva/app-ui-kit/styles.css";

const render = async () => {
  const rootElement = document.getElementById("root");
  const rootElementExists = rootElement instanceof Element;

  if (!rootElementExists) {
    throw new Error("Unable to find element with id of 'root'");
  }

  const root = createRoot(rootElement);

  root.render(
    <AppUiProvider>
      <App />
    </AppUiProvider>,
  );
};

prepareDesignEditor({
  render,
});

if (module.hot) {
  module.hot.accept("./app", render);
}
