// polyfills global in order to import PouchDB
// we need to install events since quasar does not include events in browser
// https://github.com/browserify/events
(window as any).global = window;
