# start pouchdb server for debuging on port 3000
# open localhost:3000/_utils to manage data
yarn run pouchdb-server --port 3000 -d remote_database &

# (optional) start vue devtools with no sandbox mode
# yarn run vue-devtools --no-sandbox &

# start quasar dev with/without devtools
# quasar dev -m electron --devtools
quasar dev -m electron