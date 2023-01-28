import PouchDB from "pouchdb";
import Find from "pouchdb-find";
PouchDB.plugin(Find);
const db = new PouchDB("mydb");

console.log(db.info());

db.createIndex({
  index: {
    fields: [
      "dataType",
      "projectId",
      "pageNumber",
      "folderIds",
      "children",
      "source",
      "targets",
    ],
  },
});

if (process.env.DEV) {
  // for debug use
  const remotedb = new PouchDB("http://localhost:3000/mydb");
  PouchDB.sync("mydb", "http://localhost:3000/mydb", {
    live: true,
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
    db.destroy();
  }
  window.db = db;
  window.destroyDB = destroyDB;
}

export { db };
