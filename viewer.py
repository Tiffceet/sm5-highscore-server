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
DIFF_TABLE_SM5 = [
    "Beginner",
    "Easy",
    "Medium",
    "Hard",
    "Challenge",
    "Edit"
]
DIFF_TABLE = [
    "Beginner",
    "Basic",
    "Difficult",
    "Expert",
    "Challenge",
    "Edit"
]
DIFF_TABLE_COLOR = [
    Fore.CYAN,
    Fore.YELLOW,
    Fore.RED,
    Fore.GREEN,
    Fore.MAGENTA,
    Fore.LIGHTBLACK_EX
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
PROFILE_NAME = ""
SCORE_TYPE = "controller"
HOST = "http://looz.servehttp.com:3001"

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


def formatPTNS(score, sep="|"):
    if score is None:
        return ""
    return Fore.LIGHTWHITE_EX + str(score["Marvelous"]) + sep + Fore.YELLOW + str(score["Perfect"]) + sep + Fore.GREEN + str(score["Great"]) + sep + Fore.CYAN + str(score["Good"]) + sep + Fore.RED + str(score["Miss"]) + Fore.RESET


def getCurSong():
    with open(EVERYONE_DANCE, "r", encoding='utf8') as f:
        lines = f.readlines()
        data = CustomParser(lines)
        song_dir = data.get("song_info").get("song_dir").value
        song_dir = song_dir[:-1]
        song_dir = song_dir[song_dir.rfind("/")+1:]
        return song_dir


def getScoresByName(song_name):
    url = f"{HOST}/getScores"
    if SCORE_TYPE != "":
        url = url + "?score_type=" + SCORE_TYPE
    params = {
        'r_song': song_name
    }

    r = requests.get(url=url, params=params)

    data = r.json()
    return data


def printActiveSong():
    song_name = getCurSong()
    os.system("cls")

    data = getScoresByName(song_name)

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


def getTop3Score(diff):
    song_name = getCurSong()
    data = getScoresByName(song_name)
    score = [i for i in data if i["Difficulty"] ==
             DIFF_TABLE[DIFF_TABLE_SM5.index(diff)]][0:3]

    top3 = []
    for s in score:
        PlayerName = s.get('PlayerName')
        Score = s.get('Score')
        top3.append({
            "PlayerName": PlayerName,
            "Score": Score,
            "raw": s
        })

    while len(top3) < 3:
        top3.append({
            "PlayerName": "",
            "Score": 0,
            "raw": None
        })

    return sorted(top3, key=itemgetter('Score'), reverse=True)


def printActiveSongLiveStat(top3):
    os.system("cls")
    stats = readstats()

    # Parsing
    song_info = stats.get("song_info")
    steps_info = stats.get("steps_info")
    current_score = stats.get("score").value

    progress = stats.get("progress").value

    name = song_info.get("name").value
    artist = song_info.get("artist").value
    difficulty = song_info.get("difficulty").value
    W1 = steps_info.get("W1").value
    W2 = steps_info.get("W2").value
    W3 = steps_info.get("W3").value
    NG = steps_info.get("NG").value
    OK = steps_info.get("OK").value
    Miss = steps_info.get("Miss").value
    W5 = steps_info.get("W5").value
    W4 = steps_info.get("W4").value
    difficulty_name = song_info.get("difficulty_name").value
    diff_idx = DIFF_TABLE_SM5.index(difficulty_name)
    top3 = top3[:]

    you_index = -1
    for idx in range(len(top3)):
        score = top3[idx].get('Score')
        if int(current_score) >= int(score):
            top3.insert(idx, {
                'PlayerName': "You",
                'Score': int(current_score),
                'raw': None
            })
            you_index = idx
            break
    else:
        top3.append({
            'PlayerName': "You",
            'Score': score,
            'raw': None
        })

    def get_prefix_color(idx, you_index):
        if idx == you_index:
            return Fore.YELLOW
        return ""

    print(
        f"{Fore.RESET}[{Fore.LIGHTBLACK_EX}{int(float(progress)*100)}%{Fore.RESET}] {Fore.RESET}{name}")
    print(f"{Fore.LIGHTBLACK_EX}{artist}")
    print(f"{DIFF_TABLE_COLOR[diff_idx]}{DIFF_TABLE[diff_idx]} {difficulty}")
    print(f"{Fore.RESET}{'':<14}{'':<4}Highscore:")
    print(
        f"{Fore.WHITE}{W1:<3} {'Marvelous':<10}    {Fore.RESET}1. {get_prefix_color(0, you_index)}{top3[0].get('PlayerName'):<8} {top3[0].get('Score'):,} {formatPTNS(top3[0]['raw'])}")
    print(
        f"{Fore.YELLOW}{W2:<3} {'Perfect':<10}    {Fore.RESET}2. {get_prefix_color(1, you_index)}{top3[1].get('PlayerName'):<8} {top3[1].get('Score'):,} {formatPTNS(top3[1]['raw'])}")
    print(
        f"{Fore.GREEN}{W3:<3} {'Great':<10}    {Fore.RESET}3. {get_prefix_color(2, you_index)}{top3[2].get('PlayerName'):<8} {top3[2].get('Score'):,} {formatPTNS(top3[2]['raw'])}")
    print(
        f"{Fore.LIGHTBLUE_EX}{W4:<3} {'Good':<10}    {Fore.RESET}4. {top3[3].get('PlayerName'):<8} {top3[3].get('Score'):,} {formatPTNS(top3[3]['raw'])}")
    print(f"{Fore.MAGENTA}{W5:<3} {'Almost':<10}")
    print(f"{Fore.RESET}{OK:<3} {'OK':<10}")
    print(f"{Fore.LIGHTBLACK_EX}{NG:<3} {'NG':<10}")
    print(f"{Fore.RED}{Miss:<3} {'Miss':<10}")
    print(Fore.RESET)


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
    with open(EVERYONE_DANCE, "r", encoding="utf8") as f:
        data = f.readlines()
        stats = CustomParser(data)
        return stats


if __name__ == "__main__":
    print("PROFILE_NAME: " + PROFILE_NAME)
    print("SCORE_TYPE: " + SCORE_TYPE)
    print("HOST: " + HOST)

    print("\nLoading...")
    time.sleep(5)

    # Main loop
    ingame = "true"
    song_name = ""
    top3 = getTop3Score(readstats().get(
        "song_info").get("difficulty_name").value)
    printActiveSong()
    while True:
        try:
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
            elif __ingame == 'true':
                if ingame == 'false':
                    top3 = getTop3Score(
                        stats.get("song_info").get("difficulty_name").value)
                printActiveSongLiveStat(top3)

            ingame = __ingame
            time.sleep(1)
        except KeyboardInterrupt:
            exit(0)
        except:
            print("Unknown error")
            continue
