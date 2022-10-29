from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS

from extractor.meta_extractor import extract_meta
import os
import shutil
import json

app = Flask(
    __name__,
    static_url_path="/",
    static_folder='./'
)
CORS(app) # allow cross origin requests
api = Api(app)

ROOT = os.path.dirname(__file__)
STORAGE = os.path.join(ROOT,"storage")

class Extractor(Resource):
    def post(self):
        data = request.get_json()
        project_id = data["projectId"]
        project_path = os.path.join(STORAGE,"projects",project_id)
        # create the corresponding project folder
        os.mkdir(project_path)
        # copy the file to corresponding project folder
        src_pdf_path = os.path.join(ROOT,data["path"])
        dst_pdf_path = shutil.copy(src_pdf_path, project_path)
        meta = extract_meta(dst_pdf_path)
        meta["path"] = os.path.relpath(dst_pdf_path, ROOT) # we need to save the relative path
        meta["projectId"] = project_id
        meta["projectType"] = data["projectType"]
        with open(os.path.join(project_path, "info.json"), "w") as f:
            json.dump(meta.copy(), f)

        # change folderTree.json and specialFolder.json
        return meta

class Test(Resource):
    def get(self):
        return {"msg": "success"}

    def post(self):
        data = request.get_json()
        return data


api.add_resource(Extractor, "/extract")
api.add_resource(Test, "/test")

# usage
# curl http://localhost:5000/extract
#   -X POST
#   -H 'Content-Type: application/json' 
#   -d '{"path":path, "projectId":projectId, "projectType": projectType}'

if __name__ == '__main__':
    # create local storage folders if there is none
    if not os.path.exists(STORAGE):
        os.mkdir(STORAGE)
        os.mkdir(os.path.join(STORAGE, "projects"))

        with open(os.path.join(STORAGE,"folderTree.json"),"w") as fp:
            json.dump({"name":"root", "id":0, "children": []},fp)
        
        with open(os.path.join(STORAGE,"specialFolder.json"),"w") as fp:
            json.dump(
                [
                    {"name": "All Documents", "projectIds":[]},
                    {"name": "Favorites", "projectIds":[]}
                ],
                fp
            )


    app.run("localhost",5000, debug=True)

    
