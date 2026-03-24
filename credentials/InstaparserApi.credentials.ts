import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InstaparserApi implements ICredentialType {
	name = 'instaparserApi';
	displayName = 'Instaparser API';
	documentationUrl = 'https://www.instaparser.com/docs';
	icon = {
		light: 'file:../icons/instaparser.svg',
		dark: 'file:../icons/instaparser-dark.svg',
	} as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://www.instaparser.com',
			url: '/api/_health',
		},
	};
}
