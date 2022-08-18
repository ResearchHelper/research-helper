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

class FolderTree(Resource):
    path: str = os.path.join(STORAGE,"folderTree.json")
    def get(self):
        """ load tree """
        with open(self.path, "r") as fp:
            return json.load(fp)

    def post(self):
        """ save tree """
        tree = request.get_json()
        with open(self.path, "w") as fp:
            json.dump(tree, fp)

class SpecialFolder(Resource):
    path: str = os.path.join(STORAGE,"specialFolder.json")
    def get(self) -> dict:
        """ load special folders """
        with open(self.path, "r") as fp:
            return json.load(fp)

    def post(self):
        """ save special folders """
        specialFolder = request.get_json()
        with open(self.path, "w") as fp:
            json.dump(specialFolder, fp)
        return 204

class Project(Resource):
    projects: str = os.path.join(STORAGE,"projects")
    def get(self, projectId: str):
        """ get project with projectId """
        dirname = os.path.join(self.projects, projectId)
        infoPath = os.path.join(dirname,"info.json")
        with open(infoPath, "r") as fp:
            info = json.load(fp)
        files = os.listdir(dirname)
        files.remove("info.json")
        return {"info": info, "files": files}

    def put(self, projectId: str):
        """ modify information of project with projectId """
        data = request.get_json()
        infoPath = os.path.join(self.projects, projectId, "info.json")
        with open(infoPath,"w") as fp:
            json.dump(data,fp)
        return 204

    def delete(self, projectId: str):
        """ delete project with projectId"""
        dirname = os.path.join(self.projects, projectId)
        shutil.rmtree(dirname)
        return 204


class Test(Resource):
    def get(self):
        return {"msg": "success"}

    def post(self):
        data = request.get_json()
        return data


api.add_resource(Extractor, "/extract")
api.add_resource(FolderTree, "/folderTree")
api.add_resource(SpecialFolder, "/specialFolder")
api.add_resource(Project, "/project/<string:projectId>")
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

    
