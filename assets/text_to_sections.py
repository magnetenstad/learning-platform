from re import match
from sys import argv

regex = "[1-9][0-9]*\\.([1-9][0-9]*\\.)*[1-9][0-9]* .+"


def is_successor(key, key_prev):
    for i in range(min(len(key), len(key_prev))):
        if key[i] > key_prev[i]:
            return True
        if key[i] != key_prev[i]:
            return False
    return len(key) > len(key_prev)


def text_to_sections(text: str):
    sections = []
    key_prev = (0,)
    for line in text.split("\n"):
        if match(regex, line):
            key, section = line.split(" ", 1)
            key = tuple([int(x) for x in key.split(".")])
            if not is_successor(key, key_prev):
                continue
            while match("[0-9\\.]", section[-1]):
                section = section[:-1].strip()
            if len(section) == 0:
                continue
            sections.append((key, section))
            key_prev = key
    return sections


def sections_to_section_contents(text, sections):
    sections_plaintext = [
        "\\.".join([str(x) for x in key]) + " " + value for key, value in sections
    ]

    contents = dict()
    i = -1
    for line in text.split("\n"):
        for j in range(len(sections)):
            if match(sections_plaintext[j].lower() + ".*", line.lower()):
                i = j
                break
        if i < 0:
            continue
        key = sections[i][0]
        if not key in contents:
            contents[key] = ""
        contents[key] += line + "\n"

    return contents


def text_to_section_contents(text: str):
    sections = text_to_sections(text)
    return sections, sections_to_section_contents(text, sections)


def section_contents_to_file(sections, contents, filename):
    with open(filename, "w", encoding="utf-8") as file:
        for key, section in sections:
            file.write(f"\n{key} {section}\n\n")
            file.write(contents[key])


if __name__ == "__main__":
    if len(argv) < 2:
        print("args: <source> ?<dest>")
        exit(1)
    source = argv[1]

    with open(source, "r", encoding="utf-8") as file:
        text = file.read()

    sections, contents = text_to_section_contents(text)

    for key, section in sections:
        print(key, section)

    if len(argv) > 2:
        dest = argv[2]
        section_contents_to_file(sections, contents, dest)
