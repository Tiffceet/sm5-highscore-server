import os
import re
import sys
import json
import requests
import time
from http.client import responses
# Fix for UTF-8 encoding issues
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOST = "http://localhost:3000"
USERNAME = "Looz"
# Change this to your actual StepMania Songs folder
STEPMANIA_SONGS_PATH = 'D:\\StepMania 5\\Songs'
if len(sys.argv) >= 2:
    HOST = sys.argv[1]

if len(sys.argv) >= 3:
    USERNAME = sys.argv[2]

if len(sys.argv) >= 4:
    STEPMANIA_SONGS_PATH = sys.argv[3]


def parse_sm_file(sm_path):
    song_info = {
        'map_name': None,
        'pack_name': None,
        'difficulties': []
    }

    try:
        with open(sm_path, 'r', encoding='utf-8', errors='ignore') as f:
            data = f.read()

        # Get title
        song_info['map_name'] = os.path.basename(os.path.dirname(sm_path))

        # Get difficulties
        notes_blocks = re.findall(
            r'#NOTES:(.*?);', data, re.DOTALL | re.IGNORECASE)
        for block in notes_blocks:
            lines = [line.strip() for line in block.strip().splitlines()]
            if len(lines) >= 5:
                chart_mode = lines[0].strip(':').strip()
                difficulty_name = lines[2].strip(':').strip()
                meter = lines[3].strip(':').strip()
                if difficulty_name and meter.isdigit():
                    song_info['difficulties'].append(
                        {"difficulty_name": difficulty_name, "meter": int(meter), "chart_mode": chart_mode})

        # Get pack name from folder (2 levels above .sm file)
        song_info['pack_name'] = os.path.basename(
            os.path.dirname(os.path.dirname(sm_path)))

    except Exception as e:
        print(f"Failed to parse {sm_path}: {e}")

    return song_info


def parse_ssc_file(sm_path):
    song_info = {
        'map_name': None,
        'pack_name': None,
        'difficulties': []
    }

    try:
        with open(sm_path, 'r', encoding='utf-8', errors='ignore') as f:
            data = f.read()

        # Get title
        song_info['map_name'] = os.path.basename(os.path.dirname(sm_path))

        # Get difficulties
        notedata_blocks = re.split(
            r'(?=#NOTEDATA:;)', data, flags=re.IGNORECASE)
        for block in notedata_blocks:
            diff_match = re.search(r'#DIFFICULTY:(.*?);', block, re.IGNORECASE)
            meter_match = re.search(r'#METER:(.*?);', block, re.IGNORECASE)
            chart_match = re.search(r'#STEPSTYPE:(.*?);', block, re.IGNORECASE)
            if diff_match and meter_match and chart_match:
                diff = diff_match.group(1).strip()
                meter = meter_match.group(1).strip()
                chart_mode = chart_match.group(1).strip()
                if meter.isdigit():
                    song_info['difficulties'].append(
                        {"difficulty_name": diff, "meter": int(meter), "chart_mode": chart_mode})

        # Get pack name from folder (2 levels above .sm file)
        song_info['pack_name'] = os.path.basename(
            os.path.dirname(os.path.dirname(sm_path)))

    except Exception as e:
        print(f"Failed to parse {sm_path}: {e}")

    return song_info


def find_all_sm_files(songs_directory):
    sm_files = []
    for root, dirs, files in os.walk(songs_directory):
        for file in files:
            if file.lower().endswith('.sm'):
                sm_files.append(os.path.join(root, file))
    return sm_files


def find_all_ssc_files(songs_directory):
    sm_files = []
    for root, dirs, files in os.walk(songs_directory):
        for file in files:
            if file.lower().endswith('.ssc'):
                sm_files.append(os.path.join(root, file))
    return sm_files


def main():

    all_sm_files = find_all_sm_files(STEPMANIA_SONGS_PATH)
    all_ssc_files = find_all_ssc_files(STEPMANIA_SONGS_PATH)
    print(f"Found {len(all_sm_files)} .sm files.")
    print(f"Found {len(all_ssc_files)} .ssc files.")

    all_songs_info = []

    for sm_file in all_sm_files:
        song_info = parse_sm_file(sm_file)
        all_songs_info.append(song_info)

    for ssc_file in all_ssc_files:
        song_info = parse_ssc_file(ssc_file)
        all_songs_info.append(song_info)

    r = requests.post(
        f'{HOST}/uploadSongIndexes', data=json.dumps({
            "username": USERNAME,
            "songs": all_songs_info,
        }), headers={
            "Content-Type": "application/json"
        })

    print(f"{r.status_code} {responses[r.status_code]}")
    print(r.content)

    # with open("index.json", "w", encoding="utf-8") as f:
    #     json.dump(all_songs_info, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    print("HOST: " + HOST)
    print("USERNAME: " + USERNAME)
    print("STEPMANIA_SONGS_PATH: " + STEPMANIA_SONGS_PATH)
    print("\nLoading...")
    sys.stdout.flush()
    time.sleep(5)

    main()
