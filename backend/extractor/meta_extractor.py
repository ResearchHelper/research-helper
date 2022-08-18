# import os
# import json
# import random
# import requests
# from bs4 import BeautifulSoup
import re
import arxiv
from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfparser import PDFParser

from flask import current_app as app

def extract_meta(path: str) -> dict:
    """
    Input: file absolute path
    Output: return meta data of a paper as a dictionary

    metadata: 
    {
        'title': 'Positivity-preserving DG and central DG methods for ideal MHD equations',
        'year': '2013',
        'journal': 'Journal of Computational Physics',
        'author': 'Yue Cheng',
        'abstract': "...",
        'doi': "",
        'arxiv_id': "",
    }
    
    """
    # get meta from the file
    with open(path, 'rb') as f:
        doc = PDFDocument(PDFParser(f))
    # decode ignores some unicode char
    meta = {k.lower(): v.decode("utf-8","ignore") for k,v in doc.info[0].items()}

    for page in range(2):
        raw_text = extract_text(path, page_numbers=[page], laparams=LAParams(detect_vertical=True)) # detect_vertical for arxiv id
        # doi
        search = re.search("http.*doi.*", raw_text)
        https_doi = search.group() if search else ""
        if https_doi:
            meta["doi"] = https_doi.split("doi.org/")[1] # only need the doi numbers
        else:
            meta["doi"] = ""

        # arxiv id
        search = re.search(".*arXiv[.\S]*", raw_text) # [.\S]* match anything but NOT white space
        meta["arxiv_id"] = search.group() if search else ""

        if meta["doi"] or meta["arxiv_id"]:
            break

    # use meta_scraper to get more complete meta
    meta = meta_scraper(meta)
    return meta


def meta_scraper(meta:dict) -> dict:
    """ Get meta data using arxiv api """
    query =""
    id_list = []
    if meta.get("arxiv_id"):
        id_list.append(meta["arxiv_id"])
    elif meta.get("doi"):
        query = meta["doi"]
    elif meta.get("title"):
        query = meta["title"]
    
    app.logger.info(query)
    app.logger.info(id_list)
    if query or id_list:
        search = arxiv.Search(
            query = query,
            id_list = id_list,
            max_results = 1,
            sort_by = arxiv.SortCriterion.Relevance,
            sort_order = arxiv.SortOrder.Descending
        )
        app.logger.info(search)
        try:
            result = next(search.results())
            meta["title"] = result.title
            meta["author"] = ", ".join([author.name for author in result.authors])
            meta["abstract"] = result.summary
            meta["year"] = result.published.year
            meta["journal"] = result.journal_ref
        except:
            pass
    return meta

# def meta_scraper(meta:dict) -> dict:
#     """
#     FIXME: THIS DOES NOT WORK ANYMORE
#     Take title, doi, arxivID etc to search the paper on google scholar
#     """
#     identifier = meta["title"]
#     if not identifier:
#         return

#     url = f"https://scholar.google.ca/scholar?hl=en&as_sdt=0%2C5&q={identifier}&btnG="
#     s = requests.session()
#     headers = {"User-Agent":random.choice(user_agents)}
#     response = s.get(url,headers=headers)
#     soup = BeautifulSoup(response.text, "html.parser")

#     # authors
#     info_div = soup.find("div", {"class": "gs_a"})
#     if info_div:
#         info_list = info_div.text.split("-")
#         author_string = info_list[0]
#         authors = author_string.replace(",", ";")

#         journal_year_string = info_list[1]
#         journal, year = journal_year_string.split(",")
#         journal = journal.strip().replace(u'\xa0',' ') # \xa0 is space
#         year = year.strip()

#         meta["author"] = authors if (not meta.get("author")) else meta["author"]
#         meta["journal"] = journal if (not meta.get("journal")) else meta["journal"]
#         meta["year"] = year if (not meta.get("year")) else meta["year"]
#     else:
#         authors = ""

#     title_h3 = soup.find("h3", {"class": "gs_rt"})
#     if title_h3:
#         title = title_h3.text.strip()
#     else:
#         title = ""
#     meta["title"] = title if (not meta.get("title")) else meta["title"]

#     # short abstract
#     abstract_div = soup.find("div", {"class": "gs_rs"})
#     if abstract_div:
#         abstract = abstract_div.text
#         abstract = abstract.replace(u'\xa0',' ') # \xa0 is space
#     else:
#         abstract = ""
#     meta["abstract"] = abstract if (not meta.get("abstract")) else meta["abstract"]
#     return meta