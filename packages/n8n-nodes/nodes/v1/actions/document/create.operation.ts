import FormData from 'form-data';
import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport/index.js';

export const description: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'binary_property_name',
		default: 'data',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create'],
			},
		},
		hint: 'The name of the input field containing the file data to be processed',
		required: true,
		type: 'string',
	},
	{
		displayName: 'Additional Fields',
		name: 'additional_fields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create'],
			},
		},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'OCR languages',
				name: 'ocr_languages',
				default: '',
				description: 'The languages of the document',
				type: 'string',
			}
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const endpoint = `/documents`;
	const formData = new FormData();

	const binaryPropertyName = this.getNodeParameter('binary_property_name', itemIndex) as string;
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const data = binaryData.id
		? await this.helpers.getBinaryStream(binaryData.id)
		: Buffer.from(binaryData.data, 'base64');

	formData.append('file', data, {
		filename: binaryData.fileName,
		contentType: binaryData.mimeType,
	});

	const additionalFields = this.getNodeParameter('additional_fields', itemIndex) as any;
	Object.entries({
		ocrLanguages: additionalFields.ocr_languages,
	})
		.filter(([, value]) => value !== undefined && value !== '')
		.forEach(([key, value]) => {
			formData.append(key, value);
		});

	const response = (await apiRequest.call(
		this,
		itemIndex,
		'POST',
		endpoint,
		undefined,
		undefined,
		{ headers: formData.getHeaders(), formData },
	)) as any;

	return { json: { results: [response] } };
}