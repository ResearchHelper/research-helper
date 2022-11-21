# start backend server
# ./backend/linux-env/bin/python ./backend/app.py &

# start pouchdb server for debuging on port 3000
yarn run pouchdb-server --port 3000 -d remote_database &

# start vue devtools with no sandbox mode
# yarn run vue-devtools --no-sandbox &
# start quasar dev 
# quasar dev -m electron --devtools
quasar dev -m electron