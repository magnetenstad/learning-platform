from PyPDF2 import PdfReader
from sys import argv


def pdf_to_text(filename: str):
    reader = PdfReader(filename)
    text = ""
    for page in reader.pages:
        text += page.extract_text()

    lines = text.split("\n")
    i = 0
    while i < len(lines) - 1:
        if len(lines[i].strip()) == 0:
            del lines[i]
            continue
        if lines[i][-1] == "-":
            lines[i] = lines[i][:-1] + lines[i + 1]
            del lines[i + 1]
            continue
        i += 1

    return "\n".join(lines)


if __name__ == "__main__":
    if len(argv) < 3:
        print("args: <source> <dest>")
        exit(1)
    source = argv[1]
    dest = argv[2]
    text = pdf_to_text(source)

    with open(dest, "w", encoding="utf-8") as file:
        file.writelines(text)
