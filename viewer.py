import requests
import os
import time
import colorama
import sys
from operator import itemgetter
from colorama import Fore, Back, Style
from datetime import datetime
from xml.dom import minidom
colorama.init()

# Globals
DIFF_TABLE = [
    "Beginner",
    "Basic",
    "Difficult",
    "Expert",
    "Challenge"
]
DIFF_TABLE_COLOR = [
    Fore.CYAN,
    Fore.YELLOW,
    Fore.RED,
    Fore.GREEN,
    Fore.MAGENTA
]
EVERYONE_DANCE_PATH = os.path.join(
    os.getenv("appdata"), "StepMania 5", "Save")
EVERYONE_DANCE = os.path.join(
    os.getenv("appdata"), "StepMania 5", "Save", "everyone.dance.txt")
LOCAL_PROFILE = os.path.join(
    os.getenv("appdata"), "StepMania 5", "Save", "LocalProfiles")

class CustomParser:
    def __init__(self, data_arr):
        self.__data = data_arr
        self.__data = list(map(lambda x: str(x).strip("\n"), self.__data))

    def get(self, field):
        lines = []
        for line in self.__data:
            if line.startswith(f"{field}:"):
                lines.append(line[len(field) + 1:])
        return CustomParser(lines)

    @property
    def value(self):
        if len(self.__data) <= 0:
            return None
        return str(self.__data[0]).strip("\n")


# Command line arguments
PROFILE_NAME = "Dummy"
SCORE_TYPE = "controller"
HOST = "http://localhost:8765"

if len(sys.argv) >= 2:
    PROFILE_NAME = sys.argv[1]

if len(sys.argv) >= 3:
    SCORE_TYPE = sys.argv[2]

if len(sys.argv) >= 4:
    HOST = sys.argv[3]

FC_TABLE = ["🔵", "🟢", "🟡", "⚪"]
FC_TABLE_COLOR = [Fore.CYAN, Fore.GREEN, Fore.YELLOW, Fore.LIGHTWHITE_EX]


def printScore(score):
    if len(score) == 0:
        return
    score = sorted(score, key=itemgetter('Score'), reverse=True)
    diff_idx = -1
    try:
        diff_idx = DIFF_TABLE.index(score[0]["Difficulty"])
    except:
        pass
    diff_color = Fore.LIGHTWHITE_EX
    if diff_idx != -1:
        diff_color = DIFF_TABLE_COLOR[diff_idx]
    pdiff = "[" + diff_color + score[0]["Difficulty"] + Fore.RESET + "]"
    print(pdiff)

    ranking = 1
    rank_counts = 0
    for x in range(len(score)):
        if rank_counts >= 3:
            break
        pname = score[x]["PlayerName"]
        pscore = score[x]["Score"]
        pdatetime = score[x]["DateTime"]
        pgrade = str(score[x]["Grade"])

        pdatetime = datetime.strptime(pdatetime, '%Y-%m-%d %H:%M:%f')
        def zfill_lambda(x): return str(x).zfill(2)[-2:]
        pdatetime = "{}{}{}".format(zfill_lambda(pdatetime.year), zfill_lambda(
            pdatetime.month), zfill_lambda(pdatetime.day))

        if "Failed" in pgrade:
            pgrade = pgrade[:1]
        if pgrade[-1:] in FC_TABLE:
            pgrade = FC_TABLE_COLOR[FC_TABLE.index(pgrade[-1:])] + pgrade[:-1]
        sep = Fore.RESET + "|"
        ptns = Fore.LIGHTWHITE_EX + str(score[x]["Marvelous"]) + sep + Fore.YELLOW + str(score[x]["Perfect"]) + sep + Fore.GREEN + str(
            score[x]["Great"]) + sep + Fore.CYAN + str(score[x]["Good"]) + sep + Fore.RED + str(score[x]["Miss"]) + Fore.RESET
        pmods = score[x]["Modifiers"].split(",")[0].strip()
        print("{:<3} {:<10} {:,} {} {} {}".format(
            pdatetime, pname, pscore, pgrade, ptns, pmods))
        ranking += 1
        rank_counts += 1


def getCurSong():
    with open(EVERYONE_DANCE, "r") as f:
        lines = f.readlines()
        song_name = ""
        for line in lines:
            if line.startswith('song_info:name:'):
                song_name = line[15:].strip("\n")
                break
        return song_name

def printActiveSong():
    song_name = getCurSong()
    os.system("cls")

    url = f"{HOST}/getScores"
    if SCORE_TYPE != "":
        url = url + "?score_type=" + SCORE_TYPE
    params = {
        'r_song': song_name
    }

    r = requests.get(url=url, params=params)

    data = r.json()

    beg = [i for i in data if i["Difficulty"] == "Beginner"]
    bas = [i for i in data if i["Difficulty"] == "Basic"]
    dif = [i for i in data if i["Difficulty"] == "Difficult"]
    exprt = [i for i in data if i["Difficulty"] == "Expert"]
    chall = [i for i in data if i["Difficulty"] == "Challenge"]
    edit = [i for i in data if i["Difficulty"] != "Challenge" and i["Difficulty"] !=
            "Beginner" and i["Difficulty"] != "Basic" and i["Difficulty"] != "Difficult" and i["Difficulty"] != "Expert"]

    print("Song: " + song_name)
    print("")
    printScore(beg)
    printScore(bas)
    printScore(dif)
    printScore(exprt)
    printScore(chall)
    printScore(edit)
    return song_name


def printActiveSongLiveStat():
    print("TODO:")
    os.system("cls")
    stats = readstats()
    val = stats.get('steps_info').get('W1').value
    print(val)


def submitScore():
    # 1. Get profile
    dirs = os.listdir(LOCAL_PROFILE)
    stat_path = ""
    for prof_folder in dirs:
        file_path = os.path.join(LOCAL_PROFILE, prof_folder, "Stats.xml")
        file = minidom.parse(file_path)
        display_name = file.getElementsByTagName(
            "DisplayName")[0].childNodes[0].data
        if display_name == PROFILE_NAME:
            stat_path = os.path.join(LOCAL_PROFILE, prof_folder)
            break
    else:
        print(f"Cannot get PROFILE_NAME ({PROFILE_NAME})")
        return

    os.system(f'cd {stat_path} && curl -H "Content-Type: text/plain; charset=UTF-8" --data-binary "@Stats.xml" {HOST}/submitScore?score_type={SCORE_TYPE}')
    pass


def readstats():
    with open(EVERYONE_DANCE, "r") as f:
        data = f.readlines()
        stats = CustomParser(data)
        return stats


if __name__ == "__main__":
    print("PROFILE_NAME: " + PROFILE_NAME)
    print("SCORE_TYPE: " + SCORE_TYPE)
    print("HOST: " + HOST)

    print("\nLoading...")
    # DEV: Change back in release
    # time.sleep(5)    

    # Main loop
    ingame = "true"
    song_name = ""
    printActiveSong()
    while True:
        stats = readstats()
        __ingame = stats.get("ingame").value
        if __ingame == 'false':
            if ingame == 'true':
                os.system("cls")
                print("Submitting score...")
                submitScore()
                printActiveSong()
            __song_name = getCurSong()
            if song_name != __song_name:
                song_name = __song_name
                printActiveSong()
        else:
            printActiveSongLiveStat()
        
        ingame = __ingame
        time.sleep(0.5)


# os.system("cls")
# print("Waiting for stepmania...")
# last_cur_song = ""
# last_ts = ""
# while(True):
#     if getCurTimestamp() != last_ts:
#         last_ts = getCurTimestamp()
#         os.system(SUBMIT_SCORE_BAT_PATH)
#         last_cur_song = printActiveSong()

#     if getCurSong() != last_cur_song:
#         last_cur_song = printActiveSong()

#     time.sleep(1)
