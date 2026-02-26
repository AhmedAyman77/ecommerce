import { Application } from "./Application";

// Bootstrap the application
(async () => {
    const app = new Application();
    await app.start();
})();