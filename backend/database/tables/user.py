import base
from backend.database.log.logger import Logger


def checkErrorInfo(result: [str, bool], isSearch=False):
    info = result[0]
    flag = result[1]
    if "Error" in info or flag == False:
        Logger('../log/user', level='error').logger.error(info)
        return False
    elif isSearch == False and len(info) > 0:
        Logger('../log/user', level='warning').logger.warning(info)
        return False
    else:
        return True


class User:
    # admin --> level
    def __init__(self, email, username, password, admin=1, userID=-1):
        self.email = email
        self.username = username
        self.password = password
        self.admin = admin  # 0 - admin, 1 - normal
        self.userID = userID  # default -1

    def __str__(self):
        return self.__class__.__name__ + ': ' + str(
            self.userID) + ', ' + self.email + ', ' + self.username + ', ' + self.password + ', ' + str(self.admin)

    def add_user(self):
        sql = "insert into `user` (email, username, password, admin) values (%s, %s, %s, %s);"
        vals = (self.email, self.username, self.password, 1)

        resAdd = base.insert(sql, vals)
        if checkErrorInfo(resAdd):
            return self.search_user()

        return False

    def delete_user(self):
        if self.userID == -1:
            res = ['userID is -1 while deleting', False]
            return checkErrorInfo(res)

        sql = "delete from `user` where userID = %s;"
        vals = (self.userID)
        res = base.delete(sql, vals)

        return checkErrorInfo(res)

    def update_user(self):
        if self.userID == -1:
            res = ['userID is -1 while updating', False]
            return checkErrorInfo(res)

        sql = "update `user` set email = %s, username = %s, password = %s, admin = %s where userID = %s;"
        vals = (self.email, self.username, self.password, self.admin, self.userID)
        res = base.update(sql, vals)

        return checkErrorInfo(res)

    def search_user(self):
        sql = "select * from `user` where (email = %s and password = %s) or (username = %s and password = %s);"
        vals = (self.email, self.password, self.username, self.password)
        res = base.search(sql, vals)

        try:
            if checkErrorInfo(res, True):
                self.email = res[0][0]['email']
                self.username = res[0][0]['username']
                self.userID = res[0][0]['userID']
                self.admin = res[0][0]['admin']
                return True
        except Exception as e:
            checkErrorInfo([repr(e), False], True)
            return False

        return False

# frontend:
user = User("sfu6@sfu.ca", "user6", "123456")
res = user.delete_user()
print("res = ", res)
print(user)
