from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'donorschoos'
COLLECTION_NAME = 'projects'

# Here we say to Mongo to retrieve this values only
FIELDS = {  'school_district': True,
            'school_magnet': True,
            'school_county': True,
            'school_metro': True,
            'total_price_excluding_optional_support': True,
            'school_nlns': True,
            'school_state': True, 
            'school_kipp': True, 
            'date_completed': True,
            'total_donations': True,
            '_id': False
             }


@app.route("/")
def index():
    return render_template("index.html")



@app.route("/budget/projects")
def budget_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS, limit=11000)
    #projects = collection.find(projection=FIELDS)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects


@app.route('/<path:path>')
def static_file(path):
    return app.send_static_file(path)


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)