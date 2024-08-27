# -*- coding:utf-8 -*-
# 进程指令 lsof -i:8080
# 鲨进程指令 kill -9 <pid>
# 生产环境py指令 nohup python app.py &
import hashlib
import json
import random
import re
import time
import datetime

from flask import Flask, render_template, request, Response, abort, send_file, jsonify
# from flask_babel import Babel
from sqlalchemy import MetaData, Table, Column, Integer, String, Text
from werkzeug.security import safe_join


class Config(object):
    LANGUAGES = ['zh']


# 导入 Flask 扩展
# from flask_wtf import FlaskForm
# from wtforms import SubmitField, StringField, PasswordField
UserTable = {}
cardUpgradeDict = {
    0: {
        "chance": 100,
        "coinCost": 300,
        "insurance": 1,
    },
    1: {
        "chance": 100,
        "coinCost": 600,
        "insurance": 1,
    },
    2: {
        "chance": 96.15,
        "coinCost": 1000,
        "insurance": 1,
    },
    3: {
        "chance": 69.37,
        "coinCost": 1500,
        "insurance": 1,
    },
    4: {
        "chance": 49.02,
        "coinCost": 2000,
        "insurance": 1,
    },
    5: {
        "chance": 38.42,
        "coinCost": 3000,
        "insurance": 1,
    },
    6: {
        "chance": 32.41,
        "coinCost": 4500,
        "insurance": 1,
    },
    7: {
        "chance": 28.58,
        "coinCost": 6000,
        "insurance": 1,
    },
    8: {
        "chance": 24.65,
        "coinCost": 8000,
        "insurance": 1,
    },
    9: {
        "chance": 0,
        "coinCost": 0,
        "insurance": 1,
    },

}


def get_timestamp():
    return int(time.time())


def get_token(parameter, timestamp):
    date = str(timestamp)
    data = parameter + date
    outcome = hashlib.sha256(data.encode('utf-8')).hexdigest()
    outcome = outcome[0:8]
    outcome = hashlib.sha256(outcome.encode('utf-8')).hexdigest()
    outcome = outcome[0:12]
    return outcome


class UserBehavior:
    def __init__(self, username):
        self.db_index = None
        self.username = username
        self.login_time = None
        self.action_time = None
        self.archive = {}
        self.UpgradeTableDetail = []
        self.UpgradeSuccess = 0
        self.UpgradeFail = 0
        self.UpgradeLastOutcome = False
        self.login_attempts = 0

    def record_upgrade_details(self, need_chance, overall_chance):
        self.UpgradeTableDetail.append({
            "needChance": need_chance,
            "overallChance": overall_chance,
        })
        self.UpgradeLastOutcome = False
        if overall_chance >= need_chance:
            self.UpgradeSuccess += 1
            if need_chance >= 50:
                self.UpgradeLastOutcome = True
        else:
            self.UpgradeFail += 1
        return True

    def time_check(self):
        offset = (self.action_time - self.login_time).total_seconds()
        return offset

    def expire_check(self, out=None):
        if out:
            check_num = (out - self.action_time).total_seconds()
        else:
            check_num = self.time_check()
        return check_num > 3600

    def remove(self):
        del UserTable[self.username]
        del self


class Time:
    def __init__(self):
        self.timestamp = get_timestamp()
        self.localtime = time.localtime(self.timestamp)
        self.year = int(time.strftime("%Y", self.localtime))
        self.month = int(time.strftime("%m", self.localtime))
        self.day = int(time.strftime("%d", self.localtime))
        self.hour = int(time.strftime("%H", self.localtime))
        self.minute = int(time.strftime("%M", self.localtime))


app = Flask(__name__)
# app.secret_key = "ACELEISURE"
#
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:yY3241686@192.168.0.141:3306/leisurepass'
# # app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:yy3241686@localhost:3306/flask_sql'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
# app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = False
# app.config['SQLALCHEMY_ECHO'] = True
#
# db = MetaData()
#
#
# class UserInfo(db):
#     __tablename__ = 'UserInfo'
#     id = Column(Integer, primary_key=True, nullable=False)
#     email = Column(String(24), unique=True, nullable=False)
#     username = Column(String(12), unique=True, nullable=False)
#     password = Column(String(12), nullable=False)
#     archive = Column(Text())
#     timestamp = Column(Integer)
    # sample = db.Column(db.Integer, db.ForeignKey('access.id'))


# db.create_all()

# class LoginForm(FlaskForm):
#     username = StringField('通行证名称')
#     password = PasswordField('通行证密码')
#     submit = SubmitField('登录')


FETCH_GET_CHANCE_METHOD = "GETCHANCE"  # 为前后端指定获取概率的方法名称
FETCH_SAVE_ARCHIVE_METHOD = "SAVEARCHIVE"  # 为前后端指定保存存档的方法名称
GAME_STAR_DEG_MAX = 9  # 为前后端指定最高卡片星级
GAME_STAR_DEG_MIN = 0  # 为前后端指定最低卡片星级
TextTemplate = {
    "ABOUT": "关于本游戏",
    "ABOUT_INFO": "美食大战老鼠JS是一款第三方非营利性性质的、旨在学习编程知识的同人游戏。\\n加入交流群 680829382 获取更多资讯！",
    "FETCH_GET_CHANCE_METHOD": FETCH_GET_CHANCE_METHOD,
    "FETCH_SAVE_ARCHIVE_METHOD": FETCH_SAVE_ARCHIVE_METHOD,
    "GAME_NAME": "CVMJS Beta",  # 这里是Tab页面名称
    "GAME_STAR_DEG_MAX": GAME_STAR_DEG_MAX,  # 这里指派游戏最高星级
    "GAME_STAR_DEG_MIN": GAME_STAR_DEG_MIN,  # 这里指派游戏最低星级
    "SERVER_ERROR_CODE_000": "请输入通行证名称",
    "SERVER_ERROR_CODE_001": "请输入通行证密码",
    "SERVER_ERROR_CODE_002": "此通行证信息不可用",
    "SERVER_ERROR_CODE_003": "登录实践过多",
    "SERVER_ERROR_CODE_004": "身份信息已失效，请重新登录",
    "SERVER_ERROR_CODE_005": "服务器响应请求后，未提供新的令牌",
    "SERVER_ERROR_CODE_233": "无法处理的服务器错误码",
    "SERVER_SUCCESS_CODE_000": "已完成云同步",
    "STORAGE_ACCOUNT_NAME": "LEISUREACCOUNT",
    "UPDATE_ANNOUNCEMENT": "更新公告",
    "UPDATE_ANNOUNCEMENT_TEXT": [
        # 公告使用此数组表示，flask模板会顺序读取这些公告
        "   v1.2.0 重大更新",
        "·组件重构，提供更好的性能；",
        "·缓存图像文件到本地，加速游戏载入过程；",
        "·其他游戏内核更新。",],
    "USERNAME": "通行证名称",
}


@app.before_request
def deny_no_cache_policy():
    cache_control = request.headers.get('Cache-Control')
    if cache_control and 'no-cache' in cache_control:
        return "<h2>428 Precondition Required</h2><p>服务需要缓存才能运行。<br>Caching needed for this service.</p>", 428


@app.route('/static/images/<path:filename>.svg')
def svg_route(filename):
    filepath = safe_join('static/images/', filename + '.svg')
    try:
        return send_file(filepath, mimetype='image/svg+xml')
    except FileNotFoundError:
        abort(404)


@app.route('/beta/', methods=['GET', 'POST'])
def index():
    return render_template("index.html", **TextTemplate)


# @app.route('/login', methods=['POST'])
# def login():
#     response = Response()
#     response.status_code = 200
#     c_type = request.content_type
#     if c_type == 'application/x-www-form-urlencoded':
#         username = request.form.get('username')
#         if username:
#             return "您输入的用户名:" + username
#         else:
#             return "您没有输入用户名"
#
#     message = request.json
#
#     if message:
#         if 'username' in message:
#             uname = message['username']
#             uname = re.match("^[a-z\\dA-Z]+$", uname)
#             if uname:
#                 uname = uname.group()
#                 if len(uname) > 12 or len(uname) <= 0:
#                     response.headers.set("ERROR_CODE", "000")
#                     return response
#                 if 'password' in message:
#                     pwd = message['password']
#                     pwd = re.match("^[a-z\\dA-Z]+$", pwd)
#                     if pwd:
#                         pwd = pwd.group()
#                         if len(pwd) > 12 or len(pwd) <= 0:
#                             response.headers.set("ERROR_CODE", "001")
#                             return response
#                         if uname in UserTable:
#                             user = UserTable[uname]
#                             user.db_index = UserInfo.query.filter_by(username=user.username).first()
#                             user.action_time = datetime.datetime.now()
#                             if user.expire_check():
#                                 user.login_attempts = 0
#                         else:
#                             user = UserBehavior(uname)
#                             user.db_index = UserInfo.query.filter_by(username=user.username).first()
#                             if user.db_index:
#                                 user.archive = json.loads(user.db_index.archive)
#                                 user.login_time = datetime.datetime.now()
#                                 user.action_time = user.login_time
#                                 UserTable[uname] = user
#                                 response.status_code = 201
#                             else:
#                                 del user
#                                 user = None
#
#                         if user:
#                             timestamp = get_timestamp()
#                             if user.login_attempts >= 5:
#                                 data = {
#                                     'WAIT_TIME': 3600 - user.time_check().__int__()
#                                 }
#                                 response.data = json.dumps(data)
#                                 response.headers.set("ERROR_CODE", "003")
#                             else:
#                                 if user.db_index.password == pwd:
#                                     token = get_token(user.username, timestamp)
#                                     data = {
#                                         'id': user.db_index.id,
#                                         'username': user.db_index.username,
#                                         'archive': user.db_index.archive,
#                                         'token': token,
#                                     }
#                                     response.data = json.dumps(data)
#                                 else:
#                                     user.login_attempts = user.login_attempts + 1
#                                     response.headers.set("ERROR_CODE", "002")
#                             user.db_index.timestamp = timestamp
#                             db.session.commit()
#                             return response
#                         response.headers.set("ERROR_CODE", "002")
#                         return response
#
#
@app.route('/login/', methods=['GET'])
def account():
    return render_template("account.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
