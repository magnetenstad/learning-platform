from re import match, sub
from sys import argv
from os import mkdir, path

regex = "[1-9][0-9]*\\.([1-9][0-9]*\\.)*[1-9][0-9]* .+"


def is_successor(key, key_prev):
    for i in range(min(len(key), len(key_prev))):
        if key[i] > key_prev[i]:
            return True
        if key[i] != key_prev[i]:
            return False
    return len(key) > len(key_prev)


def text_to_section_names(text: str):
    section_names = []
    key_prev = (0,)
    for line in text.split("\n"):
        if match(regex, line):
            key, section_name = line.split(" ", 1)
            key = tuple([int(x) for x in key.split(".")])
            if not is_successor(key, key_prev):
                continue
            while match("[0-9\\.]", section_name[-1]):
                section_name = section_name[:-1].strip()
            if len(section_name) == 0:
                continue
            section_names.append((key, section_name))
            key_prev = key
    return section_names


def section_names_to_section_contents(text, section_names):
    sections_plaintext = [
        "\\.".join([str(x) for x in key]) + " " + value for key, value in section_names
    ]

    contents = dict()
    i = -1
    for line in text.split("\n"):
        for j in range(len(section_names)):
            if match(sections_plaintext[j].lower() + ".*", line.lower()):
                i = j
                break
        if i < 0:
            continue
        key = section_names[i][0]
        if not key in contents:
            contents[key] = ""
        contents[key] += line + "\n"

    return contents


def text_to_section_contents(text: str):
    section_names = text_to_section_names(text)
    return section_names, section_names_to_section_contents(text, section_names)


def section_contents_to_dir(section_names, contents, dirname):
    if not path.exists(dirname):
        mkdir(dirname)

    for key, section_name in section_names:
        cleaned_name = sub(r"[^A-Za-z0-9 ]", r"", section_name)
        filename = f"{dirname}/{'.'.join([str(x) for x in key])} {cleaned_name}.txt"
        with open(filename, "w", encoding="utf-8") as file:
            file.write(f"# {key} {section_name}\n\n")
            file.write(contents[key])


if __name__ == "__main__":
    if len(argv) < 2:
        print("args: <source> ?<dest>")
        exit(1)
    source = argv[1]

    with open(source, "r", encoding="utf-8") as file:
        text = file.read()

    section_names, contents = text_to_section_contents(text)

    for key, section in section_names:
        print(key, section)

    if len(argv) > 2:
        dest = argv[2]
        section_contents_to_dir(section_names, contents, dest)
