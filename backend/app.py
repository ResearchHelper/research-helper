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
        meta = extract_meta(data["path"])
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
    app.run("localhost",5000, debug=True)

    
