from PyPDF2 import PdfReader
from sys import argv


def pdf_to_text(source: str):
    reader = PdfReader(source)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text


if __name__ == "__main__":
    if len(argv) < 3:
        print("args: <source> <dest>")
        exit(1)
    source = argv[1]
    dest = argv[2]
    text = pdf_to_text(source, dest)
    with open(dest, "w", encoding="utf-8") as file:
        file.writelines(text)
