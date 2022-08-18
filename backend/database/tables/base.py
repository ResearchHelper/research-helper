import pymysql
import configparser

config = configparser.ConfigParser()
config.read("config.ini")
host = config['mysql']['host']
dbname = config['mysql']['dbname']
user = config['mysql']['user']
password = config['mysql']['password']
port = config['mysql']['port']


def get_connection():
    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=dbname
    )


def insert(sql: str, vals):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute(sql, vals)
        conn.commit()
        return [cursor.fetchall(), True]
    except Exception as e:
        return [repr(e), False]
    finally:
        cursor.close()
        conn.close()


def delete(sql: str, vals):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute(sql, vals)
        conn.commit()
        return [cursor.fetchall(), True]
    except Exception as e:
        return [repr(e), False]
    finally:
        cursor.close()
        conn.close()


def update(sql: str, vals):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute(sql, vals)
        conn.commit()
        return [cursor.fetchall(), True]
    except Exception as e:
        return [repr(e), False]
    finally:
        cursor.close()
        conn.close()


def search(sql: str, vals):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute(sql, vals)
        return [cursor.fetchall(), True]
    except Exception as e:
        return [repr(e), False]
    finally:
        cursor.close()
        conn.close()
