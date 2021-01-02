import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    rows: 15,
    cols: 15,
  },
});

export default app;
