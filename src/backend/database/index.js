import PouchDB from "pouchdb";
import Find from "pouchdb-find";
PouchDB.plugin(Find);
var db = new PouchDB("mydb");
var remotedb = new PouchDB("http://localhost:3000/mydb");
PouchDB.sync("mydb", "http://localhost:3000/mydb", {
  live: true,
  retry: true,
})
  .on("change", function (info) {
    // handle change
    console.log(info);
  })
  .on("paused", function (err) {
    // replication paused (e.g. replication up to date, user went offline)
    console.log(err);
  })
  .on("active", function () {
    // replicate resumed (e.g. new changes replicating, user went back online)
    console.log("active");
  })
  .on("denied", function (err) {
    // a document failed to replicate (e.g. due to permissions)
    console.log(err);
  })
  .on("complete", function (info) {
    // handle complete
    console.log(info);
  })
  .on("error", function (err) {
    // handle error
    console.log(err);
  });

function destroyDB() {
  remotedb.destroy();
  return db.destroy();
}

db.createIndex({
  index: {
    fields: ["dataType", "projectId", "pageNumber", "folderIds", "children"],
  },
});

export { db, remotedb, destroyDB };
