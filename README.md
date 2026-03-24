# n8n-nodes-instaparser

n8n node for using the [Instaparser API](https://instaparser.com/) to extract article content, parse PDFs, and generate AI-powered summaries.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Article**
    - Parse an article from a URL (returns title, author, body, and metadata)
- **PDF**
    - Parse a PDF from a URL
    - Parse an uploaded PDF file
- **Summary**
    - Generate an AI-powered summary of an article from a URL

All parsing operations support HTML, plain text, and Markdown output formats.

## Credentials

You need an [Instaparser API key](https://instaparser.com/pricing) to use this node.

1. Go to [instaparser.com](https://instaparser.com/pricing) and sign up for an account.
2. Navigate to your account dashboard to find your API key.
3. In n8n, create a new **Instaparser API** credential and paste your API key.

## Compatibility

Tested with n8n v1.60.0 and later.

## Resources

* [Instaparser API documentation](https://instaparser.com/docs)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)