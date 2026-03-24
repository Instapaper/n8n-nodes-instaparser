import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

async function executeArticle(
	ctx: IExecuteFunctions,
	itemIndex: number,
	additionalFields: IDataObject,
): Promise<IDataObject> {
	const url = ctx.getNodeParameter('url', itemIndex) as string;
	const output = ctx.getNodeParameter('output', itemIndex) as string;

	const body: IDataObject = { url, output };
	Object.assign(body, additionalFields);

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: 'https://instaparser.com/api/1/article',
		headers: { 'Content-Type': 'application/json' },
		body,
		json: true,
	};

	return (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		'instaparserApi',
		options,
	)) as IDataObject;
}

async function executePdf(
	ctx: IExecuteFunctions,
	itemIndex: number,
	operation: string,
	additionalFields: IDataObject,
): Promise<IDataObject> {
	const output = ctx.getNodeParameter('output', itemIndex) as string;

	if (operation === 'parseUrl') {
		const url = ctx.getNodeParameter('url', itemIndex) as string;

		const qs: IDataObject = { url, output };
		if (additionalFields.use_cache !== undefined) {
			qs.use_cache = additionalFields.use_cache;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: 'https://instaparser.com/api/1/pdf',
			qs,
			json: true,
		};

		return (await ctx.helpers.httpRequestWithAuthentication.call(
			ctx,
			'instaparserApi',
			options,
		)) as IDataObject;
	}

	const binaryPropertyName = ctx.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const formData: IDataObject = {
		file: {
			value: buffer,
			options: {
				filename: binaryData.fileName ?? 'document.pdf',
				contentType: binaryData.mimeType ?? 'application/pdf',
			},
		},
		output,
	};

	if (additionalFields.use_cache != null) {
		formData.use_cache = String(additionalFields.use_cache);
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: 'https://instaparser.com/api/1/pdf',
		body: formData,
		json: true,
	};

	return (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		'instaparserApi',
		options,
	)) as IDataObject;
}

async function executeSummary(
	ctx: IExecuteFunctions,
	itemIndex: number,
	additionalFields: IDataObject,
): Promise<IDataObject> {
	const url = ctx.getNodeParameter('url', itemIndex) as string;

	const body: IDataObject = { url };
	Object.assign(body, additionalFields);

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: 'https://instaparser.com/api/1/summary',
		headers: { 'Content-Type': 'application/json' },
		body,
		json: true,
	};

	return (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		'instaparserApi',
		options,
	)) as IDataObject;
}

export class Instaparser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Instaparser',
		name: 'instaparser',
		icon: { light: 'file:../../icons/instaparser.svg', dark: 'file:../../icons/instaparser-dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Extract articles, parse PDFs, and generate summaries using the Instaparser API',
		defaults: {
			name: 'Instaparser',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'instaparserApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Article',
						value: 'article',
						description: 'Parse articles from URLs',
					},
					{
						name: 'PDF',
						value: 'pdf',
						description: 'Parse PDFs from URLs or uploaded files',
					},
					{
						name: 'Summary',
						value: 'summary',
						description: 'Generate AI-powered summaries of articles',
					},
				],
				default: 'article',
			},

			// ------ Article operations ------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['article'],
					},
				},
				options: [
					{
						name: 'Parse',
						value: 'parse',
						description: 'Parse an article from a URL',
						action: 'Parse an article from a URL',
					},
				],
				default: 'parse',
			},

			// ------ PDF operations ------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdf'],
					},
				},
				options: [
					{
						name: 'Parse From URL',
						value: 'parseUrl',
						description: 'Parse a PDF from a URL',
						action: 'Parse a PDF from a URL',
					},
					{
						name: 'Parse From File',
						value: 'parseFile',
						description: 'Parse an uploaded PDF file',
						action: 'Parse an uploaded PDF file',
					},
				],
				default: 'parseUrl',
			},

			// ------ Summary operations ------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['summary'],
					},
				},
				options: [
					{
						name: 'Summarize',
						value: 'summarize',
						description: 'Generate a summary of an article',
						action: 'Generate a summary of an article',
					},
				],
				default: 'summarize',
			},

			// ------ URL field (article parse, pdf parseUrl, summary summarize) ------
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://www.example.com/article',
				description: 'The URL to process',
				displayOptions: {
					show: {
						operation: ['parse', 'parseUrl', 'summarize'],
					},
				},
			},

			// ------ PDF file upload field ------
			{
				displayName: 'Input Data Field Name',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				description: 'The name of the incoming field containing the binary PDF file data',
				displayOptions: {
					show: {
						resource: ['pdf'],
						operation: ['parseFile'],
					},
				},
			},

			// ------ Output format (article + pdf only) ------
			{
				displayName: 'Output Format',
				name: 'output',
				type: 'options',
				options: [
					{ name: 'HTML', value: 'html' },
					{ name: 'Text', value: 'text' },
					{ name: 'Markdown', value: 'markdown' },
				],
				default: 'html',
				description: 'The format of the parsed body content',
				displayOptions: {
					show: {
						resource: ['article', 'pdf'],
					},
				},
			},

			// ------ Additional Fields for Article ------
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['article'],
					},
				},
				options: [
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
						description: 'Raw HTML to parse instead of fetching from the URL',
					},
					{
						displayName: 'Use Cache',
						name: 'use_cache',
						type: 'boolean',
						default: true,
						description: 'Whether to use cached results if available',
					},
				],
			},

			// ------ Additional Fields for PDF ------
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['pdf'],
					},
				},
				options: [
					{
						displayName: 'Use Cache',
						name: 'use_cache',
						type: 'boolean',
						default: true,
						description: 'Whether to use cached results if available',
					},
				],
			},

			// ------ Additional Fields for Summary ------
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['summary'],
					},
				},
				options: [
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
						description: 'Raw HTML to summarize instead of fetching from the URL',
					},
					{
						displayName: 'Use Cache',
						name: 'use_cache',
						type: 'boolean',
						default: true,
						description: 'Whether to use cached results if available',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

				let responseData: IDataObject;

				if (resource === 'article') {
					responseData = await executeArticle(this, i, additionalFields);
				} else if (resource === 'pdf') {
					responseData = await executePdf(this, i, operation, additionalFields);
				} else {
					responseData = await executeSummary(this, i, additionalFields);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
