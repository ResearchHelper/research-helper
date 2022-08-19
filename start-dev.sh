# start backend server
./backend/linux-env/bin/python ./backend/app.py &
# start vue devtools with no sandbox mode
yarn run vue-devtools --no-sandbox &
# start quasar dev 
quasar dev -m electron --devtools