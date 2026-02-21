from datasets import load_dataset

def load_faq_dataset():
    """
    Loads the Hugging Face Customer Support FAQ dataset
    and converts it to a list of Q&A documents.
    """
    dataset = load_dataset("MakTek/Customer_support_faqs_dataset")
    documents = []

    for item in dataset["train"]:
        text = f"Question: {item['question']}\nAnswer: {item['answer']}"
        documents.append(text)

    return documents