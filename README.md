# Research-Helper (research-helper-quasar)

A paper/textbook management tool

## Install the dependencies

```bash
yarn # strongly recommanded
# or
npm install
```

### Start the electron app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev -m electron
```

### Develope with Vue.js devtools

First start the vue-devtools

```bash
yarn run vue-devtools
# or
npm run vue-devtools
# or
./node_modules/.bin/vue-devtools
```

Then start electron app in dev mode with extra flag

```bash
quasar dev -m electron --devtools
```

### Start the backend

Install the necessary packages using pip

```bash
pip install flask flask-restful flask-cors arxiv pdfminer.six
```

Then we can start the backend server

```bash
python ./backend/app.py
```
