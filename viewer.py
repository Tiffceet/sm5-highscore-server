import requests
import os
import time
import colorama
import sys
from operator import itemgetter
from colorama import Fore, Back, Style
from datetime import datetime
colorama.init()

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

THEME_PATH = ""
BAT_PATH = ""
HOST = "http://localhost:8765"
SCORE_TYPE = ""

if len(sys.argv) >= 2:
    THEME_PATH = sys.argv[1]

if len(sys.argv) >= 3:
    BAT_PATH = sys.argv[2]

if len(sys.argv) >= 4:
    HOST = sys.argv[3]

if len(sys.argv) >= 5:
    SCORE_TYPE = sys.argv[4]

print("THEME_PATH: " + THEME_PATH)
print("BAT_PATH: " + BAT_PATH)
print("HOST: " + HOST)
print("SCORE_TYPE: " + SCORE_TYPE)

print("\nLoading...")
time.sleep(5)

CUR_SONG_PATH = f"{THEME_PATH}\\NowPlaying-P1.txt"
SONG_SELECT_EVENT_PATH = f"{THEME_PATH}\\SongSelectLoaded.txt"
SUBMIT_SCORE_BAT_PATH = f"{BAT_PATH} >NUL"

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
        zfill_lambda = lambda x : str(x).zfill(2)[-2:]
        pdatetime = "{}{}{}".format(zfill_lambda(pdatetime.year), zfill_lambda(pdatetime.month), zfill_lambda(pdatetime.day))

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
    try:
        f = open(CUR_SONG_PATH, "r")
    except:
        return ""
    song_name = f.read()
    song_name = song_name[:-1]
    song_name = song_name[song_name.rfind("/")+1:]
    f.close()
    return song_name


def getCurTimestamp():
    try:
        f = open(SONG_SELECT_EVENT_PATH, "r")
    except:
        return ""
    randoTS = f.read()
    f.close()
    return randoTS


def printActiveSong():
    os.system("cls")
    song_name = getCurSong()
    if song_name == "":
        return ""

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


os.system("cls")
print("Waiting for stepmania...")
last_cur_song = ""
last_ts = ""
while(True):
    if getCurTimestamp() != last_ts:
        last_ts = getCurTimestamp()
        os.system(SUBMIT_SCORE_BAT_PATH)
        last_cur_song = printActiveSong()

    if getCurSong() != last_cur_song:
        last_cur_song = printActiveSong()

    time.sleep(1)
