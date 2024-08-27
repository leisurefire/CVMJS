import os
while True:
    dic = dict()
    name = input()
    filePath = 'C:\\Users\\leisurefire\\Desktop\\leisureweb\\static\\images\\foods'
    for i, j, k in os.walk(filePath):
        key = i.split("\\")[-1]
        value = "\tstatic assets = ["
        for a in k:
            text = os.path.splitext(a)[0]
            if text == "default":
                continue
            value += "\"" + os.path.splitext(a)[0] + "\""
            if a != k[-1]:
                value += ","
        value += "];"
        dic[key] = value
    print(dic.get(name), end="\n")
