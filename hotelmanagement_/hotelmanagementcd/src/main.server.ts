import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App);

export default bootstrap;
